package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    boolean existsByPartCode(String partCode);
}