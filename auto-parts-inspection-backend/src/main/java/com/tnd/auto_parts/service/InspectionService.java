package com.tnd.auto_parts.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tnd.auto_parts.inspection.dto.AiResultDTO;
import com.tnd.auto_parts.inspection.dto.CreateInspectionSessionRequest;
import com.tnd.auto_parts.inspection.dto.UpdateInspectionStatusRequest;
import com.tnd.auto_parts.model.InspectionDetail;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import com.tnd.auto_parts.model.InspectionStatusLog;
import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.repository.InspectionDetailRepository;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.repository.InspectionStatusLogRepository;
import com.tnd.auto_parts.repository.PartRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InspectionService {

    // 1. KHAI BÁO BIẾN
    private final InspectionSessionRepository sessionRepository;
    private final InspectionDetailRepository detailRepository;
    private final InspectionStatusLogRepository statusLogRepository;
    private final PartRepository partRepository;

    // 🔥 Tiêm CloudinaryService vào để xử lý ảnh
    private final CloudinaryService cloudinaryService;

    // 2. CONSTRUCTOR
    public InspectionService(
            InspectionSessionRepository sessionRepository,
            InspectionDetailRepository detailRepository,
            InspectionStatusLogRepository statusLogRepository,
            PartRepository partRepository,
            CloudinaryService cloudinaryService
    ) {
        this.sessionRepository = sessionRepository;
        this.detailRepository = detailRepository;
        this.statusLogRepository = statusLogRepository;
        this.partRepository = partRepository;
        this.cloudinaryService = cloudinaryService;
    }

    // 3. CÁC PHƯƠNG THỨC XỬ LÝ (BUSINESS LOGIC)

    @Transactional
    public void updateAiResult(Long detailId, AiResultDTO aiResult) {
        InspectionDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết kiểm định với ID: " + detailId));
        InspectionSession session = detail.getSession();

        // 1. Kiểm tra logic "Chống lắp nhầm linh kiện"
        Integer expectedAiClassId = session.getPart().getAiClassId();
        Long predictedAiClassId = aiResult.getClassId();

        if (expectedAiClassId != null && expectedAiClassId.longValue() != predictedAiClassId) {
            // Lắp sai hàng -> Đánh FAILED ngay lập tức và ghi rõ lý do
            session.setDefectType("Lỗi sai linh kiện (Mong đợi: ID " + expectedAiClassId + ", Thực tế AI nhận diện: ID " + predictedAiClassId + ")");
            sessionRepository.save(session);
            this.updateStatus(session.getId(), InspectionStatus.FAILED);

        } else if ("FAILED".equalsIgnoreCase(aiResult.getStatus())) {
            // Mở rộng: Nếu bản thân Python AI phát hiện lỗi, tôn trọng kết quả AI
            session.setDefectType(aiResult.getDefectType());
            try {
                ObjectMapper mapper = new ObjectMapper();
                session.setBoundingBoxes(mapper.writeValueAsString(aiResult.getBoundingBoxes()));
            } catch (Exception e) {
                session.setBoundingBoxes("[]");
            }
            sessionRepository.save(session);
            this.updateStatus(session.getId(), InspectionStatus.FAILED);

        }
        // 🔥 QUAN TRỌNG: Nếu ĐÚNG HÀNG, hệ thống sẽ KHÔNG làm gì cả.
        // Trạng thái giữ nguyên là PENDING để chờ nhân viên (Staff) tự khoanh vùng lỗi trên giao diện React.
    }

    public InspectionSession createSession(CreateInspectionSessionRequest request) {
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new IllegalArgumentException("Part not found: " + request.getPartId()));

        InspectionSession session = InspectionSession.builder()
                .lotCode(request.getLotCode().trim())
                .part(part)
                .status(InspectionStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .createdBy(resolveCurrentUsername())
                .build();

        InspectionSession saved = sessionRepository.save(session);
        createStatusLog(saved, saved.getStatus(), "Session created");
        return saved;
    }

    public InspectionSession getSession(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection session not found: " + sessionId));
    }

    public InspectionSession updateStatus(Long sessionId, InspectionStatus status) {
        return updateStatusWithDetails(sessionId, status, null, null);
    }

    public InspectionSession updateStatus(Long sessionId, UpdateInspectionStatusRequest request) {
        return updateStatusWithDetails(
                sessionId,
                request.getStatus(),
                request.getDefectType(),
                request.getBoundingBoxes()
        );
    }

    private InspectionSession updateStatusWithDetails(
            Long sessionId,
            InspectionStatus status,
            String defectType,
            Object boundingBoxes
    ) {
        if (status == null) {
            throw new IllegalArgumentException("Status is required");
        }

        InspectionSession session = getSession(sessionId);
        if (session.getStatus() == InspectionStatus.CANCELLED && status != InspectionStatus.CANCELLED) {
            throw new IllegalStateException("Inspection session is cancelled");
        }

        boolean statusChanged = session.getStatus() != status;
        boolean cancelledNow = status == InspectionStatus.CANCELLED && session.getCancelledAt() == null;

        if (!statusChanged && !cancelledNow) {
            return session;
        }

        if (statusChanged) {
            session.setStatus(status);
        }
        if (cancelledNow) {
            session.setCancelledAt(LocalDateTime.now());
        }

        if (status == InspectionStatus.FAILED) {
            if (defectType != null && !defectType.isBlank()) {
                session.setDefectType(defectType);
            }
            if (boundingBoxes != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    session.setBoundingBoxes(mapper.writeValueAsString(boundingBoxes));
                } catch (Exception e) {
                    session.setBoundingBoxes("[]");
                }
            }
        }

        InspectionSession saved = sessionRepository.save(session);
        String message = status == InspectionStatus.CANCELLED ? "Session cancelled" : "Status updated";
        createStatusLog(saved, status, message);
        return saved;
    }

    public InspectionSession cancelSession(Long sessionId) {
        return updateStatus(sessionId, InspectionStatus.CANCELLED);
    }

    public List<InspectionStatusLog> getStatusLogs(Long sessionId) {
        getSession(sessionId);
        return statusLogRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    // 🔥 TÍCH HỢP CLOUDINARY: Đẩy ảnh lên mây thay vì lưu ổ cứng
    public InspectionDetail addDetail(Long sessionId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        InspectionSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection session not found: " + sessionId));

        // Gọi Cloudinary lấy URL an toàn (HTTPS)
        String imageUrl = cloudinaryService.uploadImage(image);

        InspectionDetail detail = InspectionDetail.builder()
                .session(session)
                .imagePath(imageUrl)
                .createdAt(LocalDateTime.now())
                .build();

        return detailRepository.save(detail);
    }

    // 🔥 Cập nhật ảnh cũng đẩy lên Cloudinary
    public InspectionDetail updateDetailImage(Long detailId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        InspectionDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection detail not found: " + detailId));

        String newImageUrl = cloudinaryService.uploadImage(image);
        detail.setImagePath(newImageUrl);
        detail.setCreatedAt(LocalDateTime.now());

        return detailRepository.save(detail);
    }

    // 4. PRIVATE HELPER METHODS
    private String resolveCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String name = authentication.getName();
        if (name == null || "anonymousUser".equals(name)) {
            return null;
        }
        return name;
    }

    private void createStatusLog(InspectionSession session, InspectionStatus status, String message) {
        InspectionStatusLog log = InspectionStatusLog.builder()
                .session(session)
                .status(status)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
        statusLogRepository.save(log);
    }
}