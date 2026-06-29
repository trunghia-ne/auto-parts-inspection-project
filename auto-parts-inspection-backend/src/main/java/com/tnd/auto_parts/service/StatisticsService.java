package com.tnd.auto_parts.service;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.statistics.PeriodGroupBy;
import com.tnd.auto_parts.statistics.dto.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private static final int DEFAULT_TREND_DAYS = 30;
    private static final int RECENT_LIMIT = 15;
    private static final int LOT_LIMIT = 30;
    private static final int DAY_LIMIT = 30;
    private static final String UNKNOWN_USER = "Không xác định";

    private final InspectionSessionRepository sessionRepository;

    public StatisticsService(InspectionSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public DashboardResponse getDashboard(PeriodGroupBy groupBy, Integer trendDays) {
        int days = trendDays != null && trendDays > 0 ? trendDays : DEFAULT_TREND_DAYS;
        LocalDateTime trendFrom = LocalDateTime.now().minusDays(days);
        LocalDateTime dayStatsFrom = LocalDateTime.now().minusDays(30);

        PeriodGroupBy effectiveGroupBy = groupBy != null ? groupBy : PeriodGroupBy.DAY;
        List<InspectionSession> allSessions = sessionRepository.findAll();

        return DashboardResponse.builder()
                .summary(buildSummary())
                .defectTrend(buildDefectTrend(allSessions, trendFrom))
                .periodStats(buildPeriodStats(allSessions, effectiveGroupBy, dayStatsFrom))
                .periodGroupBy(effectiveGroupBy.name())
                .employeePerformance(buildEmployeePerformance(allSessions))
                .recentInspections(buildRecentInspections(allSessions))
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

    private List<DefectTrendPointDto> buildDefectTrend(
            List<InspectionSession> allSessions,
            LocalDateTime fromDate
    ) {
        Map<LocalDate, List<InspectionSession>> byDay = allSessions.stream()
                .filter(s -> !s.getCreatedAt().isBefore(fromDate))
                .collect(Collectors.groupingBy(s -> s.getCreatedAt().toLocalDate()));

        return byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> toDefectTrendPoint(entry.getKey().toString(), entry.getValue()))
                .toList();
    }

    private List<PeriodStatDto> buildPeriodStats(
            List<InspectionSession> allSessions,
            PeriodGroupBy groupBy,
            LocalDateTime dayFrom
    ) {
        return switch (groupBy) {
            case MONTH -> buildPeriodStatsByMonth(allSessions);
            case LOT -> buildPeriodStatsByLot(allSessions);
            case DAY -> buildPeriodStatsByDay(allSessions, dayFrom);
        };
    }

    private List<PeriodStatDto> buildPeriodStatsByDay(
            List<InspectionSession> allSessions,
            LocalDateTime dayFrom
    ) {
        Map<LocalDate, List<InspectionSession>> byDay = allSessions.stream()
                .filter(s -> !s.getCreatedAt().isBefore(dayFrom))
                .collect(Collectors.groupingBy(s -> s.getCreatedAt().toLocalDate()));

        return byDay.entrySet().stream()
                .sorted(Map.Entry.<LocalDate, List<InspectionSession>>comparingByKey().reversed())
                .limit(DAY_LIMIT)
                .map(entry -> toPeriodStat(entry.getKey().toString(), entry.getValue()))
                .toList();
    }

    private List<PeriodStatDto> buildPeriodStatsByMonth(List<InspectionSession> allSessions) {
        Map<YearMonth, List<InspectionSession>> byMonth = allSessions.stream()
                .collect(Collectors.groupingBy(s -> YearMonth.from(s.getCreatedAt())));

        return byMonth.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    String label = entry.getKey().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    return toPeriodStat(label, entry.getValue());
                })
                .toList();
    }

    private List<PeriodStatDto> buildPeriodStatsByLot(List<InspectionSession> allSessions) {
        Map<String, List<InspectionSession>> byLot = allSessions.stream()
                .collect(Collectors.groupingBy(InspectionSession::getLotCode));

        return byLot.entrySet().stream()
                .map(entry -> toPeriodStat(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingLong(PeriodStatDto::getInspectedCount).reversed())
                .limit(LOT_LIMIT)
                .toList();
    }

    private List<EmployeePerformanceDto> buildEmployeePerformance(List<InspectionSession> allSessions) {
        Map<String, List<InspectionSession>> byUser = allSessions.stream()
                .filter(s -> isInspected(s.getStatus()))
                .collect(Collectors.groupingBy(s ->
                        s.getCreatedBy() != null && !s.getCreatedBy().isBlank()
                                ? s.getCreatedBy()
                                : UNKNOWN_USER
                ));

        return byUser.entrySet().stream()
                .map(entry -> {
                    long passed = countByStatus(entry.getValue(), InspectionStatus.PASSED);
                    long failed = countByStatus(entry.getValue(), InspectionStatus.FAILED);
                    long inspected = passed + failed;
                    return EmployeePerformanceDto.builder()
                            .username(entry.getKey())
                            .inspectedCount(inspected)
                            .passedCount(passed)
                            .failedCount(failed)
                            .defectRate(calculateRate(failed, inspected))
                            .passRate(calculateRate(passed, inspected))
                            .build();
                })
                .sorted(Comparator.comparingLong(EmployeePerformanceDto::getInspectedCount).reversed())
                .toList();
    }

    private List<RecentInspectionDto> buildRecentInspections(List<InspectionSession> allSessions) {
        return allSessions.stream()
                .sorted(Comparator.comparing(InspectionSession::getCreatedAt).reversed())
                .limit(RECENT_LIMIT)
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

    private DefectTrendPointDto toDefectTrendPoint(String label, List<InspectionSession> sessions) {
        long failed = countByStatus(sessions, InspectionStatus.FAILED);
        long inspected = sessions.stream().filter(s -> isInspected(s.getStatus())).count();
        return DefectTrendPointDto.builder()
                .label(label)
                .inspectedCount(inspected)
                .failedCount(failed)
                .defectRate(calculateRate(failed, inspected))
                .build();
    }

    private PeriodStatDto toPeriodStat(String label, List<InspectionSession> sessions) {
        long passed = countByStatus(sessions, InspectionStatus.PASSED);
        long failed = countByStatus(sessions, InspectionStatus.FAILED);
        long inspected = passed + failed;
        return PeriodStatDto.builder()
                .label(label)
                .inspectedCount(inspected)
                .passedCount(passed)
                .failedCount(failed)
                .defectRate(calculateRate(failed, inspected))
                .build();
    }

    private static long countByStatus(List<InspectionSession> sessions, InspectionStatus status) {
        return sessions.stream().filter(s -> s.getStatus() == status).count();
    }

    private static boolean isInspected(InspectionStatus status) {
        return status == InspectionStatus.PASSED || status == InspectionStatus.FAILED;
    }

    private static double calculateRate(long numerator, long denominator) {
        if (denominator == 0) {
            return 0.0;
        }
        return Math.round((numerator * 10000.0) / denominator) / 100.0;
    }
}
