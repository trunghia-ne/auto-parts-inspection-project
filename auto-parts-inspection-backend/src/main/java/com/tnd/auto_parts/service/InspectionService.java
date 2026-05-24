package com.tnd.auto_parts.service;

import com.tnd.auto_parts.inspection.dto.AiResultDTO;
import com.tnd.auto_parts.inspection.dto.CreateInspectionSessionRequest;
import com.tnd.auto_parts.model.InspectionDetail;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import com.tnd.auto_parts.model.InspectionStatusLog;
import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.repository.InspectionDetailRepository;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.repository.InspectionStatusLogRepository;
import com.tnd.auto_parts.repository.PartRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InspectionService {

    // 1. KHAI BÁO BIẾN LUÔN ĐẶT TRÊN CÙNG
    private final InspectionSessionRepository sessionRepository;
    private final InspectionDetailRepository detailRepository;
    private final InspectionStatusLogRepository statusLogRepository;
    private final PartRepository partRepository;
    private final String uploadDir;

    // 2. CONSTRUCTOR
    public InspectionService(
            InspectionSessionRepository sessionRepository,
            InspectionDetailRepository detailRepository,
            InspectionStatusLogRepository statusLogRepository,
            PartRepository partRepository,
            @Value("${app.inspection.upload-dir:uploads/inspections}") String uploadDir
    ) {
        this.sessionRepository = sessionRepository;
        this.detailRepository = detailRepository;
        this.statusLogRepository = statusLogRepository;
        this.partRepository = partRepository;
        this.uploadDir = uploadDir;
    }

    // 3. CÁC PHƯƠNG THỨC XỬ LÝ (BUSINESS LOGIC)

    @Transactional
    public void updateAiResult(Long detailId, AiResultDTO aiResult) {
        // 1. Tìm chi tiết kiểm định
        InspectionDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết kiểm định với ID: " + detailId));

        InspectionSession session = detail.getSession();

        // 2. Lấy AI Class ID được cấu hình sẵn trong cấu trúc Phụ tùng
        Integer expectedAiClassId = session.getPart().getAiClassId();

        // Lấy Class ID thực tế do Python AI phân tích được từ ảnh
        Long predictedAiClassId = aiResult.getClassId();

        float CONFIDENCE_THRESHOLD = 0.8f;

        // 3. Tiến hành so sánh trực tiếp hai mã AI Class với nhau
        InspectionStatus finalStatus;
        if (expectedAiClassId != null && expectedAiClassId.longValue() == predictedAiClassId && aiResult.getConfidence() >= CONFIDENCE_THRESHOLD) {
            finalStatus = InspectionStatus.PASSED;
        } else {
            finalStatus = InspectionStatus.FAILED;
        }

        // 4. Cập nhật trạng thái phiên và lưu lịch sử hệ thống
        this.updateStatus(session.getId(), finalStatus);
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

    public InspectionDetail addDetail(Long sessionId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        InspectionSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection session not found: " + sessionId));

        String storedPath = storeImage(sessionId, image);

        InspectionDetail detail = InspectionDetail.builder()
                .session(session)
                .imagePath(storedPath)
                .createdAt(LocalDateTime.now())
                .build();

        return detailRepository.save(detail);
    }

    public InspectionDetail updateDetailImage(Long detailId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image is required");
        }

        InspectionDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection detail not found: " + detailId));

        String oldPath = detail.getImagePath();
        String storedPath = storeImage(detail.getSession().getId(), image);
        detail.setImagePath(storedPath);
        detail.setCreatedAt(LocalDateTime.now());

        InspectionDetail saved = detailRepository.save(detail);
        deleteImageFile(oldPath);
        return saved;
    }

    public ImageResource loadDetailImage(Long detailId) {
        InspectionDetail detail = detailRepository.findById(detailId)
                .orElseThrow(() -> new IllegalArgumentException("Inspection detail not found: " + detailId));

        Path path = Paths.get(detail.getImagePath()).normalize();
        if (!Files.exists(path)) {
            throw new IllegalStateException("Image file not found: " + detail.getImagePath());
        }

        try {
            Resource resource = new UrlResource(path.toUri());
            String contentType = Files.probeContentType(path);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return new ImageResource(resource, contentType);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to read image file", ex);
        }
    }

    // 4. PRIVATE HELPER METHODS

    private String storeImage(Long sessionId, MultipartFile image) {
        String originalName = image.getOriginalFilename();
        String extension = "";
        if (originalName != null) {
            int dot = originalName.lastIndexOf('.');
            if (dot >= 0 && dot < originalName.length() - 1) {
                extension = originalName.substring(dot);
            }
        }

        String filename = "session-" + sessionId + "-" + UUID.randomUUID() + extension;
        Path dirPath = Paths.get(uploadDir);

        try {
            Files.createDirectories(dirPath);
            Path target = dirPath.resolve(filename).normalize();
            try (InputStream inputStream = image.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store image", ex);
        }

        return dirPath.resolve(filename).toString().replace("\\", "/");
    }

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

    private void deleteImageFile(String path) {
        if (path == null || path.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (IOException ex) {
            // Ignore cleanup failures.
        }
    }

    // 5. INNER CLASSES

    public static class ImageResource {
        private final Resource resource;
        private final String contentType;

        public ImageResource(Resource resource, String contentType) {
            this.resource = resource;
            this.contentType = contentType;
        }

        public Resource getResource() {
            return resource;
        }

        public String getContentType() {
            return contentType;
        }
    }
}