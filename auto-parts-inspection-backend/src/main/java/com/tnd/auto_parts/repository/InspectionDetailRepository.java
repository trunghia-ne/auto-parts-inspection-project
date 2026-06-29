package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InspectionDetailRepository extends JpaRepository<InspectionDetail, Long> {
}
