package com.tnd.auto_parts.model;

public enum PaymentStatus {
    UNPAID,    // Chưa thanh toán
    PAID,      // Đã thanh toán
    REFUNDED   // Đã hoàn tiền (nếu có lỗi/hủy đơn)
}