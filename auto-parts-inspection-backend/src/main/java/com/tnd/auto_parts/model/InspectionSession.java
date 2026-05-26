package com.tnd.auto_parts.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String lotCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InspectionStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime cancelledAt;

    @Column(length = 100)
    private String createdBy;

    // -----------------------------------------------------------------
    // 🔥 BỔ SUNG 2 TRƯỜNG NÀY ĐỂ LƯU KẾT QUẢ TỪ AI PYTHON VÀO DATABASE
    // -----------------------------------------------------------------

    @Column(name = "defect_type")
    private String defectType;

    // Dùng kiểu TEXT để chứa được chuỗi JSON mảng tọa độ dài
    @Column(name = "bounding_boxes", columnDefinition = "TEXT")
    private String boundingBoxes;
}