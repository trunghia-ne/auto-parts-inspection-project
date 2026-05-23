package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InspectionSessionRepository extends JpaRepository<InspectionSession, Long> {
}
