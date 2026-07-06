package com.tnd.auto_parts.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_details")
@Getter
@Setter
public class InspectionDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết ngược về bảng InspectionSession cha
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore // Tránh lỗi vòng lặp vô hạn khi Spring trả về JSON cho React
    private InspectionSession session;

    // Tên file ảnh hoặc link ảnh gốc/ảnh kết quả sau khi AI vẽ khung
    @Column(name = "image_url")
    private String imageUrl;

    // Loại lỗi của riêng sản phẩm này (Ví dụ: "Nứt", "Móp", "OK"...)
    @Column(name = "defect_type")
    private String defectType;

    // Tọa độ các ô khung lỗi nhận diện từ Python AI
    @Column(name = "bounding_boxes", columnDefinition = "TEXT")
    private String boundingBoxes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}