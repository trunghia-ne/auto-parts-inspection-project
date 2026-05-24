package com.tnd.auto_parts.service;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.statistics.PeriodGroupBy;
import com.tnd.auto_parts.statistics.dto.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class StatisticsService {

    private static final int DEFAULT_TREND_DAYS = 30;
    private static final int RECENT_LIMIT = 15;

    private final InspectionSessionRepository sessionRepository;

    public StatisticsService(InspectionSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public DashboardResponse getDashboard(PeriodGroupBy groupBy, Integer trendDays) {
        int days = trendDays != null && trendDays > 0 ? trendDays : DEFAULT_TREND_DAYS;
        LocalDateTime trendFrom = LocalDateTime.now().minusDays(days);
        LocalDateTime dayStatsFrom = LocalDateTime.now().minusDays(30);

        PeriodGroupBy effectiveGroupBy = groupBy != null ? groupBy : PeriodGroupBy.DAY;

        return DashboardResponse.builder()
                .summary(buildSummary())
                .defectTrend(buildDefectTrend(trendFrom))
                .periodStats(buildPeriodStats(effectiveGroupBy, dayStatsFrom))
                .periodGroupBy(effectiveGroupBy.name())
                .employeePerformance(buildEmployeePerformance())
                .recentInspections(buildRecentInspections())
                .generatedAt(LocalDateTime.now())
                .build();
    }

    private DashboardSummaryDto buildSummary() {
        long passed = sessionRepository.countByStatus(InspectionStatus.PASSED);
        long failed = sessionRepository.countByStatus(InspectionStatus.FAILED);
        long inspected = passed + failed;
        long pending = sessionRepository.countByStatus(InspectionStatus.PENDING)
                + sessionRepository.countByStatus(InspectionStatus.PROCESSING);
        long cancelled = sessionRepository.countByStatus(InspectionStatus.CANCELLED);

        return DashboardSummaryDto.builder()
                .totalInspected(inspected)
                .passedCount(passed)
                .failedCount(failed)
                .defectRate(calculateRate(failed, inspected))
                .pendingCount(pending)
                .cancelledCount(cancelled)
                .build();
    }

    private List<DefectTrendPointDto> buildDefectTrend(LocalDateTime fromDate) {
        List<Object[]> rows = sessionRepository.aggregateDefectTrendByDay(fromDate);
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }

        List<DefectTrendPointDto> trend = new ArrayList<>();
        for (Object[] row : rows) {
            String label = row[0] != null ? row[0].toString() : "";
            long inspected = toLong(row[1]);
            long failed = toLong(row[2]);
            trend.add(DefectTrendPointDto.builder()
                    .label(label)
                    .inspectedCount(inspected)
                    .failedCount(failed)
                    .defectRate(calculateRate(failed, inspected))
                    .build());
        }
        return trend;
    }

    private List<PeriodStatDto> buildPeriodStats(PeriodGroupBy groupBy, LocalDateTime dayFrom) {
        List<Object[]> rows = switch (groupBy) {
            case MONTH -> sessionRepository.aggregateStatsByMonth();
            case LOT -> sessionRepository.aggregateStatsByLot();
            case DAY -> sessionRepository.aggregateStatsByDay(dayFrom);
        };

        List<PeriodStatDto> stats = new ArrayList<>();
        for (Object[] row : rows) {
            long inspected = toLong(row[1]);
            long failed = toLong(row[3]);
            stats.add(PeriodStatDto.builder()
                    .label(row[0] != null ? row[0].toString() : "")
                    .inspectedCount(inspected)
                    .passedCount(toLong(row[2]))
                    .failedCount(failed)
                    .defectRate(calculateRate(failed, inspected))
                    .build());
        }

        if (groupBy == PeriodGroupBy.DAY) {
            Collections.reverse(stats);
        }
        return stats;
    }

    private List<EmployeePerformanceDto> buildEmployeePerformance() {
        List<Object[]> rows = sessionRepository.aggregateEmployeePerformance();
        List<EmployeePerformanceDto> result = new ArrayList<>();

        for (Object[] row : rows) {
            String username = row[0] != null ? row[0].toString() : "Không xác định";
            long inspected = toLong(row[1]);
            long passed = toLong(row[2]);
            long failed = toLong(row[3]);

            result.add(EmployeePerformanceDto.builder()
                    .username(username)
                    .inspectedCount(inspected)
                    .passedCount(passed)
                    .failedCount(failed)
                    .defectRate(calculateRate(failed, inspected))
                    .passRate(calculateRate(passed, inspected))
                    .build());
        }
        return result;
    }

    private List<RecentInspectionDto> buildRecentInspections() {
        List<InspectionSession> sessions = sessionRepository.findRecentSessions(
                PageRequest.of(0, RECENT_LIMIT)
        );

        return sessions.stream()
                .map(session -> RecentInspectionDto.builder()
                        .id(session.getId())
                        .lotCode(session.getLotCode())
                        .partName(session.getPart().getPartName())
                        .status(session.getStatus())
                        .createdBy(session.getCreatedBy())
                        .createdAt(session.getCreatedAt())
                        .build())
                .toList();
    }

    private static double calculateRate(long numerator, long denominator) {
        if (denominator == 0) {
            return 0.0;
        }
        return Math.round((numerator * 10000.0) / denominator) / 100.0;
    }

    private static long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }
}
