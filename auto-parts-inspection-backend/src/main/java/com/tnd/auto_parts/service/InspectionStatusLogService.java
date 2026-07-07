package com.tnd.auto_parts.service;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import com.tnd.auto_parts.model.InspectionStatusLog;
import com.tnd.auto_parts.repository.InspectionStatusLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InspectionStatusLogService {

    private final InspectionStatusLogRepository logRepository;

    public void logStatusChange(InspectionSession session, InspectionStatus status, String message) {
        InspectionStatusLog log = InspectionStatusLog.builder()
                .session(session)
                .status(status)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
        logRepository.save(log);
    }

    public java.util.List<com.tnd.auto_parts.inspection.dto.InspectionStatusLogResponse> getSessionLogs(Long sessionId) {
        return logRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(log -> com.tnd.auto_parts.inspection.dto.InspectionStatusLogResponse.builder()
                        .id(log.getId())
                        .sessionId(log.getSession().getId())
                        .status(log.getStatus())
                        .message(log.getMessage())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();
    }
}
