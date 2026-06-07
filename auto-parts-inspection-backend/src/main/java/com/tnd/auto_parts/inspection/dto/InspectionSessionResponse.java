package com.tnd.auto_parts.inspection.dto;

import com.tnd.auto_parts.model.InspectionStatus;
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
    private InspectionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
    private String createdBy;


    private String defectType;
    private Object boundingBoxes;
}