package com.tnd.auto_parts.inspection.dto;

import com.tnd.auto_parts.model.InspectionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InspectionStatusLogResponse {
    private Long id;
    private Long sessionId;
    private InspectionStatus status;
    private String message;
    private LocalDateTime createdAt;
}
