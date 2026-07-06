package com.tnd.auto_parts.inspection.dto;

import java.time.LocalDateTime;

public record ReportSessionResponse(
        Long id,
        String lotCode,
        String customerName,
        LocalDateTime createdAt,
        String paymentStatus,
        Double totalAmount,
        String status
) {
}