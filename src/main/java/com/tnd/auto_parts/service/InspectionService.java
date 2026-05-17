package com.tnd.auto_parts.service;

import com.tnd.auto_parts.inspection.dto.CreateInspectionSessionRequest;
import com.tnd.auto_parts.model.InspectionDetail;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.repository.InspectionDetailRepository;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.repository.PartRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class InspectionService {

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

    private final InspectionSessionRepository sessionRepository;
    private final InspectionDetailRepository detailRepository;
    private final PartRepository partRepository;
    private final String uploadDir;

    public InspectionService(
            InspectionSessionRepository sessionRepository,
            InspectionDetailRepository detailRepository,
            PartRepository partRepository,
            @Value("${app.inspection.upload-dir:uploads/inspections}") String uploadDir
    ) {
        this.sessionRepository = sessionRepository;
        this.detailRepository = detailRepository;
        this.partRepository = partRepository;
        this.uploadDir = uploadDir;
    }

    public InspectionSession createSession(CreateInspectionSessionRequest request) {
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new IllegalArgumentException("Part not found: " + request.getPartId()));

        InspectionSession session = InspectionSession.builder()
                .lotCode(request.getLotCode().trim())
                .part(part)
                .createdAt(LocalDateTime.now())
                .build();

        return sessionRepository.save(session);
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
}
