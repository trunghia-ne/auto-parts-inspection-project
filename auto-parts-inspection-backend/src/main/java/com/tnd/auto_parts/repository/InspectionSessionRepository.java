package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InspectionSessionRepository extends JpaRepository<InspectionSession, Long> {

    long countByStatus(InspectionStatus status);

    @Query("SELECT s FROM InspectionSession s JOIN FETCH s.part ORDER BY s.createdAt DESC")
    List<InspectionSession> findRecentSessions(Pageable pageable);

    @Query(value = """
            SELECT DATE(created_at) AS label,
                   SUM(CASE WHEN status IN ('PASSED', 'FAILED') THEN 1 ELSE 0 END) AS inspected,
                   SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
            FROM inspection_sessions
            WHERE created_at >= :fromDate
            GROUP BY DATE(created_at)
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> aggregateDefectTrendByDay(@Param("fromDate") LocalDateTime fromDate);

    @Query(value = """
            SELECT DATE_FORMAT(created_at, '%Y-%m') AS label,
                   SUM(CASE WHEN status IN ('PASSED', 'FAILED') THEN 1 ELSE 0 END) AS inspected,
                   SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) AS passed,
                   SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
            FROM inspection_sessions
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY label ASC
            """, nativeQuery = true)
    List<Object[]> aggregateStatsByMonth();

    @Query(value = """
            SELECT lot_code AS label,
                   SUM(CASE WHEN status IN ('PASSED', 'FAILED') THEN 1 ELSE 0 END) AS inspected,
                   SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) AS passed,
                   SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
            FROM inspection_sessions
            GROUP BY lot_code
            ORDER BY inspected DESC
            LIMIT 30
            """, nativeQuery = true)
    List<Object[]> aggregateStatsByLot();

    @Query(value = """
            SELECT DATE(created_at) AS label,
                   SUM(CASE WHEN status IN ('PASSED', 'FAILED') THEN 1 ELSE 0 END) AS inspected,
                   SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) AS passed,
                   SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
            FROM inspection_sessions
            WHERE created_at >= :fromDate
            GROUP BY DATE(created_at)
            ORDER BY label DESC
            LIMIT 30
            """, nativeQuery = true)
    List<Object[]> aggregateStatsByDay(@Param("fromDate") LocalDateTime fromDate);

    @Query(value = """
            SELECT COALESCE(created_by, 'Không xác định') AS username,
                   SUM(CASE WHEN status IN ('PASSED', 'FAILED') THEN 1 ELSE 0 END) AS inspected,
                   SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) AS passed,
                   SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed
            FROM inspection_sessions
            WHERE status IN ('PASSED', 'FAILED')
            GROUP BY COALESCE(created_by, 'Không xác định')
            ORDER BY inspected DESC
            """, nativeQuery = true)
    List<Object[]> aggregateEmployeePerformance();
}
