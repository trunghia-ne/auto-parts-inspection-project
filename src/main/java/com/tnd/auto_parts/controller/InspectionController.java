package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.inspection.dto.CreateInspectionSessionRequest;
import com.tnd.auto_parts.inspection.dto.InspectionDetailResponse;
import com.tnd.auto_parts.inspection.dto.InspectionSessionResponse;
import com.tnd.auto_parts.inspection.dto.InspectionStatusLogResponse;
import com.tnd.auto_parts.inspection.dto.UpdateInspectionStatusRequest;
import com.tnd.auto_parts.model.InspectionDetail;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatusLog;
import com.tnd.auto_parts.service.InspectionService;
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
public class InspectionController {

    private final InspectionService inspectionService;

    public InspectionController(InspectionService inspectionService) {
        this.inspectionService = inspectionService;
    }

    @PostMapping("/sessions")
    public ResponseEntity<InspectionSessionResponse> createSession(
            @Valid @RequestBody CreateInspectionSessionRequest request
    ) {
        InspectionSession session = inspectionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(toSessionResponse(session));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<InspectionSessionResponse> getSession(@PathVariable Long sessionId) {
        InspectionSession session = inspectionService.getSession(sessionId);
        return ResponseEntity.ok(toSessionResponse(session));
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
        InspectionSession session = inspectionService.cancelSession(sessionId);
        return ResponseEntity.ok(toSessionResponse(session));
    }

    @PostMapping(value = "/sessions/{sessionId}/details", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionDetailResponse> addDetail(
            @PathVariable Long sessionId,
            @RequestParam("image") MultipartFile image
    ) {
        InspectionDetail detail = inspectionService.addDetail(sessionId, image);
        String imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/inspections/details/")
                .path(detail.getId().toString())
                .path("/image")
                .toUriString();

        InspectionDetailResponse response = InspectionDetailResponse.builder()
                .id(detail.getId())
                .sessionId(detail.getSession().getId())
                .imageUrl(imageUrl)
                .createdAt(detail.getCreatedAt())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping(value = "/details/{detailId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionDetailResponse> updateDetailImage(
            @PathVariable Long detailId,
            @RequestParam("image") MultipartFile image
    ) {
        InspectionDetail detail = inspectionService.updateDetailImage(detailId, image);
        String imageUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/inspections/details/")
                .path(detail.getId().toString())
                .path("/image")
                .toUriString();

        InspectionDetailResponse response = InspectionDetailResponse.builder()
                .id(detail.getId())
                .sessionId(detail.getSession().getId())
                .imageUrl(imageUrl)
                .createdAt(detail.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{sessionId}/logs")
    public ResponseEntity<List<InspectionStatusLogResponse>> getSessionLogs(@PathVariable Long sessionId) {
        List<InspectionStatusLog> logs = inspectionService.getStatusLogs(sessionId);
        List<InspectionStatusLogResponse> response = logs.stream()
                .map(this::toStatusLogResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/details/{detailId}/image")
    public ResponseEntity<Resource> getDetailImage(@PathVariable Long detailId) {
        InspectionService.ImageResource imageResource = inspectionService.loadDetailImage(detailId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(imageResource.getContentType()))
                .body(imageResource.getResource());
    }

    private InspectionSessionResponse toSessionResponse(InspectionSession session) {
        return InspectionSessionResponse.builder()
                .id(session.getId())
                .lotCode(session.getLotCode())
                .partId(session.getPart().getId())
                .partName(session.getPart().getPartName())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .cancelledAt(session.getCancelledAt())
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
