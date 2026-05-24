package com.tnd.auto_parts.statistics.dto;

import com.tnd.auto_parts.model.InspectionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RecentInspectionDto {
    private Long id;
    private String lotCode;
    private String partName;
    private InspectionStatus status;
    private String createdBy;
    private LocalDateTime createdAt;
}
