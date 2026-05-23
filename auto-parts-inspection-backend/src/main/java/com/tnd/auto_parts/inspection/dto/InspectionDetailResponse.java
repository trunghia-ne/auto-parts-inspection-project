package com.tnd.auto_parts.inspection.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InspectionDetailResponse {
    private Long id;
    private Long sessionId;
    private String imageUrl;
    private LocalDateTime createdAt;
}
