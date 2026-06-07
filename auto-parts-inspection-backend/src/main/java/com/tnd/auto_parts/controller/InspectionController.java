package com.tnd.auto_parts.controller;

import com.fasterxml.jackson.databind.ObjectMapper; // 🔥 Đã thêm import này
import com.tnd.auto_parts.inspection.dto.*;
import com.tnd.auto_parts.model.InspectionDetail;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatusLog;
import com.tnd.auto_parts.service.InspectionService;
import com.tnd.auto_parts.service.AiClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.validation.Valid;
import org.springframework.core.io.Resource;

import java.util.List;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;
    private final AiClientService aiClientService;

    @PostMapping("/sessions")
    public ResponseEntity<InspectionSessionResponse> createSession(
            @Valid @RequestBody CreateInspectionSessionRequest request
    ) {
        InspectionSession session = inspectionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toSessionResponse(session));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<InspectionSessionResponse> getSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(toSessionResponse(inspectionService.getSession(sessionId)));
    }

    @PatchMapping("/sessions/{sessionId}/status")
    public ResponseEntity<InspectionSessionResponse> updateStatus(
            @PathVariable Long sessionId,
            @Valid @RequestBody UpdateInspectionStatusRequest request
    ) {
        InspectionSession session = inspectionService.updateStatus(sessionId, request.getStatus());
        return ResponseEntity.ok(toSessionResponse(session));
    }

    @PostMapping("/sessions/{sessionId}/cancel")
    public ResponseEntity<InspectionSessionResponse> cancelSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(toSessionResponse(inspectionService.cancelSession(sessionId)));
    }

    // --- CÁC API LIÊN QUAN ĐẾN HÌNH ẢNH VÀ AI ---

    @PostMapping(value = "/sessions/{sessionId}/details", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionDetailResponse> addDetail(
            @PathVariable Long sessionId,
            @RequestParam("image") MultipartFile image
    ) {
        InspectionDetail detail = inspectionService.addDetail(sessionId, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDetailResponse(detail));
    }

    @PutMapping(value = "/details/{detailId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionDetailResponse> updateDetailImage(
            @PathVariable Long detailId,
            @RequestParam("image") MultipartFile image
    ) {
        InspectionDetail detail = inspectionService.updateDetailImage(detailId, image);
        return ResponseEntity.ok(toDetailResponse(detail));
    }

    // 🔥 API Tích hợp gọi AI Python (Đã được kích hoạt)
    @PostMapping(value = "/sessions/{sessionId}/inspect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionDetailResponse> performAiInspection(
            @PathVariable Long sessionId,
            @RequestParam("image") MultipartFile image
    ) {
        // 1. Lưu ảnh vào hệ thống local thông qua service hiện tại
        InspectionDetail detail = inspectionService.addDetail(sessionId, image);

        // 2. Gửi ảnh sang Python FastAPI để phân tích
        AiResultDTO aiResult = aiClientService.analyzeImage(image);

        // 3. Cập nhật kết quả AI dự đoán vào Database
        inspectionService.updateAiResult(detail.getId(), aiResult);

        // 4. Trả về thông vị chi tiết ảnh vừa kiểm tra
        return ResponseEntity.status(HttpStatus.CREATED).body(toDetailResponse(detail));
    }

    @GetMapping("/details/{detailId}/image")
    public ResponseEntity<Resource> getDetailImage(@PathVariable Long detailId) {
        InspectionService.ImageResource imageResource = inspectionService.loadDetailImage(detailId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imageResource.getContentType()))
                .body(imageResource.getResource());
    }

    // --- HELPER METHODS ---

    @GetMapping("/sessions/{sessionId}/logs")
    public ResponseEntity<List<InspectionStatusLogResponse>> getSessionLogs(@PathVariable Long sessionId) {
        List<InspectionStatusLogResponse> response = inspectionService.getStatusLogs(sessionId)
                .stream()
                .map(this::toStatusLogResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    private String buildImageUrl(Long detailId) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/inspections/details/")
                .path(detailId.toString())
                .path("/image")
                .toUriString();
    }

    private InspectionDetailResponse toDetailResponse(InspectionDetail detail) {
        return InspectionDetailResponse.builder()
                .id(detail.getId())
                .sessionId(detail.getSession().getId())
                .imageUrl(buildImageUrl(detail.getId()))
                .createdAt(detail.getCreatedAt())
                .build();
    }

    // 🔥 ĐÃ CẬP NHẬT HÀM NÀY ĐỂ TRẢ VỀ LỖI VÀ TỌA ĐỘ CHO REACT
    private InspectionSessionResponse toSessionResponse(InspectionSession session) {
        Object parsedBoxes = null;
        try {
            if (session.getBoundingBoxes() != null && !session.getBoundingBoxes().trim().isEmpty()) {
                parsedBoxes = new ObjectMapper().readValue(session.getBoundingBoxes(), Object.class);
            }
        } catch (Exception ignored) {
            // Bỏ qua nếu không parse được JSON
        }

        return InspectionSessionResponse.builder()
                .id(session.getId())
                .lotCode(session.getLotCode())
                .partId(session.getPart().getId())
                .partName(session.getPart().getPartName())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .cancelledAt(session.getCancelledAt())
                .createdBy(session.getCreatedBy())
                .defectType(session.getDefectType()) // Lấy loại lỗi
                .boundingBoxes(parsedBoxes)          // Lấy tọa độ
                .build();
    }

    private InspectionStatusLogResponse toStatusLogResponse(InspectionStatusLog log) {
        return InspectionStatusLogResponse.builder()
                .id(log.getId())
                .sessionId(log.getSession().getId())
                .status(log.getStatus())
                .message(log.getMessage())
                .createdAt(log.getCreatedAt())
                .build();
    }
}