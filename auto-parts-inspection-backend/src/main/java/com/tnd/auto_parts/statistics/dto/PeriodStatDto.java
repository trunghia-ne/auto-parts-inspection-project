package com.tnd.auto_parts.statistics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PeriodStatDto {
    private String label;
    private long inspectedCount;
    private long passedCount;
    private long failedCount;
    private double defectRate;
}
