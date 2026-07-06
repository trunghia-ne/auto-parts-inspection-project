package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionDetailRepository extends JpaRepository<InspectionDetail, Long> {
    // Hàm bổ sung nếu sau này bác muốn lấy danh sách ảnh của riêng 1 đơn
    List<InspectionDetail> findBySessionId(Long sessionId);
}