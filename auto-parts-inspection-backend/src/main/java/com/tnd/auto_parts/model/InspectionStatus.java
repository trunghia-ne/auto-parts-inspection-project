package com.tnd.auto_parts.model;

public enum InspectionStatus {
    PENDING,      // Khách hàng vừa tạo đơn
    PENDING_EXPERT,
//    PROCESSING,   // Nhân viên QC đang thao tác kiểm định
    PASSED,       // QC chốt Đạt
    FAILED,       // QC chốt Lỗi
    PAID,         // Khách hàng đã thanh toán phí dịch vụ
    CANCELLED     // Đơn bị hủy bỏ
}