package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionSessionRepository extends JpaRepository<InspectionSession, Long> {

    long countByStatus(InspectionStatus status);

    @EntityGraph(attributePaths = "part")
    @Override
    List<InspectionSession> findAll();
}
