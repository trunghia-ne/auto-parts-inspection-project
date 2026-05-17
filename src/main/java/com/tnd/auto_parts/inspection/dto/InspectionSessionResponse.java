package com.tnd.auto_parts.inspection.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InspectionSessionResponse {
    private Long id;
    private String lotCode;
    private Long partId;
    private String partName;
    private LocalDateTime createdAt;
}
