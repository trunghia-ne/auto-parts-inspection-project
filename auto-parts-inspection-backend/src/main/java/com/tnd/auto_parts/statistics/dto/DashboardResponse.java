package com.tnd.auto_parts.statistics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private DashboardSummaryDto summary;
    private List<DefectTrendPointDto> defectTrend;
    private List<PeriodStatDto> periodStats;
    private String periodGroupBy;
    private List<EmployeePerformanceDto> employeePerformance;
    private List<RecentInspectionDto> recentInspections;
    private LocalDateTime generatedAt;
}
