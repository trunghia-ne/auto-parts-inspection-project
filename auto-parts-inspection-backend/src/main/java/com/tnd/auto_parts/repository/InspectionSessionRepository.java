package com.tnd.auto_parts.repository;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.InspectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionSessionRepository extends JpaRepository<InspectionSession, Long> {

    List<InspectionSession> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<InspectionSession> findByIdAndCustomerId(Long id, Long customerId);

    List<InspectionSession> findAllByStatusOrderByCreatedAtAsc(InspectionStatus status);

    @Query("SELECT SUM(s.serviceFee * s.quantity) FROM InspectionSession s WHERE s.paymentStatus = 'PAID'")
    Double calculateTotalRevenue();

    // 🔥 Thêm hàm này để lấy cả đơn PENDING và PENDING_EXPERT
    List<InspectionSession> findAllByStatusInOrderByCreatedAtAsc(List<InspectionStatus> statuses);

    List<InspectionSession> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // Lọc theo ngày VÀ trạng thái cụ thể
    List<InspectionSession> findByCreatedAtBetweenAndStatus(LocalDateTime startDate, LocalDateTime endDate, InspectionStatus status);

    // Lấy tất cả đơn hàng từ một mốc thời gian trở về hiện tại
    List<InspectionSession> findByCreatedAtAfter(LocalDateTime startDate);

    // Đếm số lượng đơn theo trạng thái (Dùng cho Donut Chart)
    long countByStatus(InspectionStatus status);
}