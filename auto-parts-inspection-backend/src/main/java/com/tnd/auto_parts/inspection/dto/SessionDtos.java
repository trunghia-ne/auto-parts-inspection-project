package com.tnd.auto_parts.inspection.dto;

import com.tnd.auto_parts.model.InspectionStatus;

import java.time.LocalDateTime;

public class SessionDtos {

    // Request: Khi khách hàng tạo đơn mới
    public record CreateSessionRequest(
            Long partId,
            Integer quantity,
            String lotCode,
            String packageType // 🔥 THÊM DÒNG NÀY (VD: "BASIC_AI" hoặc "PREMIUM_EXPERT")
    ) {
    }

    // Request: Khi QC ấn chốt kết quả trên UI
    public record QcUpdateResultRequest(
            InspectionStatus status, // PASSED hoặc FAILED
            String defectType,
            String boundingBoxes, // Chuỗi JSON tọa độ
            String resultImageUrl
    ) {
    }

    // Response: Trả dữ liệu gọn gàng ra cho Frontend hiển thị
    public record SessionResponse(
            Long id,
            String lotCode,
            String partName,
            Integer quantity,
            Integer scannedCount,
            InspectionStatus status,
            String paymentStatus,
            LocalDateTime createdAt,
            String defectType,
            String boundingBoxes,
            String resultImageUrl,
            String pdfReportUrl
    ) {
    }
}