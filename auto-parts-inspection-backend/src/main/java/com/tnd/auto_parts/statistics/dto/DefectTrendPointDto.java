package com.tnd.auto_parts.statistics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DefectTrendPointDto {
    private String label;
    private long inspectedCount;
    private long failedCount;
    private double defectRate;
}
