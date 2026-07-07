package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.inspection.dto.AiResultDTO;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionDetail; // Bổ sung
import com.tnd.auto_parts.model.InspectionStatus;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.repository.InspectionDetailRepository; // Bổ sung
import com.tnd.auto_parts.service.AiClientService;
import com.tnd.auto_parts.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/qc/sessions")
@PreAuthorize("hasAnyRole('QC', 'ADMIN')")
public class QcController {

    private final InspectionSessionRepository sessionRepo;
    private final InspectionDetailRepository detailRepo; // Thêm repo này
    private final AiClientService aiClientService;
    private final CloudinaryService cloudinaryService;
    private final com.tnd.auto_parts.service.InspectionStatusLogService statusLogService;

    private static final double AI_CONFIDENCE_THRESHOLD = 0.85;

    public QcController(InspectionSessionRepository sessionRepo,
                        InspectionDetailRepository detailRepo,
                        AiClientService aiClientService,
                        CloudinaryService cloudinaryService,
                        com.tnd.auto_parts.service.InspectionStatusLogService statusLogService) {
        this.sessionRepo = sessionRepo;
        this.detailRepo = detailRepo;
        this.aiClientService = aiClientService;
        this.cloudinaryService = cloudinaryService;
        this.statusLogService = statusLogService;
    }

    // 1. LẤY DANH SÁCH CHỜ
    @GetMapping("/pending")
    public ResponseEntity<List<QcSessionResponse>> getPendingSessions() {
        List<QcSessionResponse> responses = sessionRepo.findAllByStatusInOrderByCreatedAtAsc(
                        List.of(InspectionStatus.PENDING, InspectionStatus.PENDING_EXPERT))
                .stream()
                .map(s -> new QcSessionResponse(
                        s.getId(),
                        s.getLotCode(),
                        s.getPart() != null ? s.getPart().getPartName() : "N/A",
                        s.getQuantity(),
                        s.getDetails().size(), // 🔥 Bổ sung: Số lượng đã quét
                        s.getStatus().name(),
                        s.getPaymentStatus() != null ? s.getPaymentStatus().name() : "UNPAID",
                        s.getCreatedAt(),
                        s.getPdfReportUrl(),
                        s.getDetails().stream().map(d -> d.getImageUrl()).toList()
                ))
                .toList();
        return ResponseEntity.ok(responses);
    }

    // 2. PHÂN TÍCH AI (LƯU TỪNG ẢNH VÀ CẬP NHẬT TRẠNG THÁI KHI HOÀN THÀNH)
    @PostMapping(value = "/{id}/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> analyzeImageWithAi(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "boundingBoxes", required = false) String boundingBoxes) {

        InspectionSession session = sessionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn kiểm định mang ID: " + id));

        if (session.getStatus() != InspectionStatus.PENDING) {
            return ResponseEntity.badRequest().body("Đơn hàng này không ở trạng thái chờ phân tích AI.");
        }

        // 🔥 Chặn nếu đã quét đủ số lượng khách đặt
        if (session.getDetails().size() >= session.getQuantity()) {
            return ResponseEntity.badRequest().body("Đơn này đã quét đủ " + session.getQuantity() + " sản phẩm!");
        }

        try {
            // Gọi AI và Cloudinary (Giữ nguyên logic cực hay của bác)
            AiResultDTO aiResult = aiClientService.analyzeImage(file);
            String cloudinaryUrl = cloudinaryService.uploadImage(file);

            double confidence = aiResult.getConfidence() != null ? aiResult.getConfidence() : 0.0;
            String confidencePercent = String.format("%.1f", confidence * 100);
            boolean isAiClean = (aiResult.getClassId() != null && aiResult.getClassId() == 0 && confidence >= AI_CONFIDENCE_THRESHOLD);

            String aiDefectMessage;
            if (isAiClean) {
                aiDefectMessage = "AI duyệt sạch (Độ tin cậy: " + confidencePercent + "%)";
            } else {
                String defectName = (aiResult.getClassId() != null && aiResult.getClassId() == 0) ? "AI nghi ngờ" :
                        switch (aiResult.getClassId().intValue()) {
                            case 1 -> "Nứt (Crack)";
                            case 2 -> "Móp (Deform)";
                            case 3 -> "Rỉ sét (Rust)";
                            default -> "Lỗi cấu trúc";
                        };
                aiDefectMessage = defectName + " (Chính xác: " + confidencePercent + "%)";
            }

            // 🔥 TẠO VÀ LƯU CHI TIẾT SẢN PHẨM (MỚI)
            InspectionDetail detail = new InspectionDetail();
            detail.setSession(session);
            detail.setImageUrl(cloudinaryUrl);
            detail.setDefectType(aiDefectMessage);
            detail.setBoundingBoxes(isAiClean ? null : boundingBoxes);
            detailRepo.save(detail);

            // 🔥 KIỂM TRA XEM ĐÃ QUÉT ĐỦ SỐ LƯỢNG CHƯA ĐỂ CHỐT TRẠNG THÁI ĐƠN
            int totalScanned = session.getDetails().size() + 1; // +1 vì cái detail vừa tạo chưa được cập nhật vào session entity trong bộ nhớ
            if (totalScanned >= session.getQuantity()) {
                if ("PREMIUM_EXPERT".equalsIgnoreCase(session.getPackageType())) {
                    session.setStatus(InspectionStatus.PENDING_EXPERT);
                    statusLogService.logStatusChange(session, InspectionStatus.PENDING_EXPERT, "Đã quét đủ " + session.getQuantity() + " sản phẩm. Chờ QC thẩm định thủ công.");
                } else {
                    // Logic BASIC: Kiểm tra xem trong toàn bộ các ảnh đã quét, có ảnh nào bị lỗi không?
                    boolean isAnyDefect = session.getDetails().stream()
                            .anyMatch(d -> !d.getDefectType().contains("duyệt sạch")) || !isAiClean;

                    InspectionStatus newStatus = isAnyDefect ? InspectionStatus.FAILED : InspectionStatus.PASSED;
                    session.setStatus(newStatus);
                    statusLogService.logStatusChange(session, newStatus, "AI hoàn tất phân tích (" + (isAnyDefect ? "Phát hiện lỗi" : "Đạt chất lượng") + ").");
                }
                sessionRepo.save(session);
            }

            return ResponseEntity.ok("Đã lưu ảnh thứ " + totalScanned + "/" + session.getQuantity() + " thành công!");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi hệ thống khi xử lý AI & Cloudinary: " + e.getMessage());
        }
    }

    // 3. QC DUYỆT TAY (Cập nhật trạng thái tổng của đơn hàng)
    @PatchMapping(value = "/{id}/inspect", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> manualInspect(
            @PathVariable Long id,
            @RequestBody QcManualInspectRequest request) {

        InspectionSession session = sessionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn mang ID: " + id));

        if (session.getStatus() != InspectionStatus.PENDING_EXPERT) {
            return ResponseEntity.badRequest().body("Đơn hàng không ở trạng thái chờ thẩm định thủ công.");
        }

        try {
            InspectionStatus status = InspectionStatus.valueOf(request.status().toUpperCase());
            session.setStatus(status);
            statusLogService.logStatusChange(session, status, "QC đánh giá thủ công: " + request.overallNote());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Trạng thái không hợp lệ (PASSED/FAILED).");
        }

        // Đơn đã duyệt tay thành công, lưu lại trạng thái
        InspectionSession updatedSession = sessionRepo.save(session);
        QcSessionResponse responseDto = new QcSessionResponse(
                updatedSession.getId(),
                updatedSession.getLotCode(),
                updatedSession.getPart() != null ? updatedSession.getPart().getPartName() : "N/A",
                updatedSession.getQuantity(),
                updatedSession.getDetails() != null ? updatedSession.getDetails().size() : 0,
                updatedSession.getStatus().name(),
                updatedSession.getPaymentStatus() != null ? updatedSession.getPaymentStatus().name() : "UNPAID",
                updatedSession.getCreatedAt(),
                updatedSession.getPdfReportUrl(),
                updatedSession.getDetails().stream().map(d -> d.getImageUrl()).toList()
        );
        return ResponseEntity.ok(updatedSession);
    }
}

/**
 * =====================================================================
 * CÁC RECORD DTO ĐÃ ĐƯỢC LÀM SẠCH LẠI
 * =====================================================================
 */
record QcSessionResponse(
        Long id,
        String lotCode,
        String partName,
        Integer quantity,
        Integer scannedCount,
        String status,
        String paymentStatus, // 🔥 1. Thêm trường này ở đây để khớp Front-end
        LocalDateTime createdAt,
        String pdfReportUrl,
        List<String> imageUrls
) {
}

record QcManualInspectRequest(
        String status,
        String overallNote // Đổi từ defectType sang overallNote vì kết quả chi tiết nằm ở bảng con
) {
}