package com.tnd.auto_parts.statistics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardSummaryDto {
    private long totalInspected;
    private long passedCount;
    private long failedCount;
    private double defectRate;
    private long pendingCount;
    private long cancelledCount;
}
