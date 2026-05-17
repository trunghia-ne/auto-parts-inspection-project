package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionStatusLogRepository extends JpaRepository<InspectionStatusLog, Long> {
    List<InspectionStatusLog> findAllBySessionIdOrderByCreatedAtAsc(Long sessionId);
}
