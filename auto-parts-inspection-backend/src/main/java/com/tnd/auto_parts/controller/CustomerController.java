package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.model.*;
import com.tnd.auto_parts.repository.*;
import com.tnd.auto_parts.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer/sessions")
// 🔥 SỬA Ở ĐÂY: Cho phép cả CUSTOMER và ADMIN được gọi các API này
@PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
public class CustomerController {

    private final InspectionSessionRepository sessionRepo;
    private final PartRepository partRepo;
    private final UserRepository userRepo;
    @Autowired
    private VNPayService vnPayService;

    public CustomerController(InspectionSessionRepository sessionRepo, PartRepository partRepo, UserRepository userRepo) {
        this.sessionRepo = sessionRepo;
        this.partRepo = partRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/parts")
    public ResponseEntity<List<Part>> getAvailableParts() {
        return ResponseEntity.ok(partRepo.findAll());
    }

    /**
     * API 1: Khách xem DANH SÁCH tất cả đơn hàng của mình (Tóm tắt)
     */
    @GetMapping
    public ResponseEntity<List<SessionSummaryResponse>> getMySessions(@AuthenticationPrincipal UserDetails userDetails) {
        AppUser currentUser = userRepo.findByUsername(userDetails.getUsername()).orElseThrow();

        // 🔥 Map sang bản Tóm Tắt (Không lấy chi tiết ảnh để load nhanh hơn)
        List<SessionSummaryResponse> responses = sessionRepo.findAllByCustomerIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(s -> new SessionSummaryResponse(
                        s.getId(),
                        s.getLotCode(),
                        s.getPart().getPartName(),
                        s.getQuantity(),
                        s.getDetails().size(), // Số lượng ảnh đã quét
                        s.getStatus().name(),
                        s.getPaymentStatus().name(),
                        s.getCreatedAt(),
                        s.getPdfReportUrl()
                ))
                .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * 🔥 API 2: Khách xem BÁO CÁO CHI TIẾT của một đơn hàng cụ thể (Kèm danh sách ảnh)
     * GET /api/customer/sessions/27
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSessionDetail(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        AppUser currentUser = userRepo.findByUsername(userDetails.getUsername()).orElseThrow();

        InspectionSession session = sessionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn kiểm định mang ID: " + id));

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !session.getCustomer().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Bảo mật: Bạn không có quyền truy cập vào báo cáo của đơn hàng này!");
        }

        // 🔥 Chuyển danh sách Entity ảnh sang DTO
        List<InspectionDetailDto> scannedItems = session.getDetails().stream()
                .map(d -> new InspectionDetailDto(
                        d.getId(),
                        d.getImageUrl(),
                        d.getDefectType(),
                        d.getBoundingBoxes(),
                        d.getCreatedAt()
                )).toList();

        // 🔥 Map sang SessionDetailResponse (Bao gồm cả danh sách ảnh)
        SessionDetailResponse fullDetail = new SessionDetailResponse(
                session.getId(),
                session.getLotCode(),
                session.getPart().getPartName(),
                session.getQuantity(),
                session.getStatus().name(),
                session.getPaymentStatus().name(), // 🔥 THÊM DÒNG NÀY: Trạng thái thanh toán
                session.getCreatedAt(),
                session.getPdfReportUrl(),
                session.getPackageType(),
                scannedItems // Nhét mảng ảnh vào đây
        );

        return ResponseEntity.ok(fullDetail);
    }

    /**
     * API 3: Khách tạo đơn kiểm định mới
     */
    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody CreateSessionRequest req,
                                           @AuthenticationPrincipal UserDetails userDetails,
                                           HttpServletRequest request) throws Exception {
        AppUser currentUser = userRepo.findByUsername(userDetails.getUsername()).orElseThrow();
        Part part = partRepo.findById(req.partId()).orElseThrow();

        Double finalPrice = part.getPrice() != null ? part.getPrice() : 0.0;
        PaymentStatus defaultPaymentStatus = PaymentStatus.UNPAID;

        if ("BASIC_AI".equals(req.packageType())) {
            finalPrice = finalPrice / 2;
            defaultPaymentStatus = PaymentStatus.PAID; // Gói Basic tự động PAID luôn
        }

        InspectionSession session = InspectionSession.builder()
                .lotCode(req.lotCode())
                .part(part)
                .quantity(req.quantity())
                .customer(currentUser)
                .packageType(req.packageType())
                .status(InspectionStatus.PENDING)
                .serviceFee(finalPrice)
                .paymentStatus(defaultPaymentStatus)
                .build();

        sessionRepo.save(session);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Tạo đơn thành công!");
        response.put("sessionId", session.getId());

        // 🔥 NẾU LÀ PREMIUM: Trả thêm Link VNPay để Frontend chuyển hướng
        if ("PREMIUM_EXPERT".equals(req.packageType())) {
            Double totalAmount = finalPrice * req.quantity();
            String paymentUrl = vnPayService.createPaymentUrl(session.getId(), totalAmount, request);
            response.put("paymentUrl", paymentUrl);
        }

        return ResponseEntity.ok(response);
    }
}

/**
 * =====================================================================
 * CÁC RECORD DTO MỚI (Bác có thể bê sang file SessionDtos.java cho gọn)
 * =====================================================================
 */
record SessionSummaryResponse(
        Long id, String lotCode, String partName, Integer quantity,
        Integer scannedCount, String status, String paymentStatus, LocalDateTime createdAt, String pdfReportUrl
        // 🔥 Thêm paymentStatus
) {
}

record InspectionDetailDto(
        Long id, String imageUrl, String defectType, String boundingBoxes, LocalDateTime createdAt
) {
}

record SessionDetailResponse(
        Long id, String lotCode, String partName, Integer quantity,
        String status, String paymentStatus, LocalDateTime createdAt, String pdfReportUrl, String packageType,
        // 🔥 Thêm paymentStatus
        List<InspectionDetailDto> scannedItems
) {
}

record CreateSessionRequest(
        String lotCode, Long partId, Integer quantity, String packageType
) {
}