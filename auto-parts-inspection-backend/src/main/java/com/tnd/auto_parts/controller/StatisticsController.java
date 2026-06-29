package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.service.StatisticsService;
import com.tnd.auto_parts.statistics.PeriodGroupBy;
import com.tnd.auto_parts.statistics.dto.DashboardResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(defaultValue = "DAY") PeriodGroupBy groupBy,
            @RequestParam(defaultValue = "30") Integer trendDays
    ) {
        return ResponseEntity.ok(statisticsService.getDashboard(groupBy, trendDays));
    }
}
