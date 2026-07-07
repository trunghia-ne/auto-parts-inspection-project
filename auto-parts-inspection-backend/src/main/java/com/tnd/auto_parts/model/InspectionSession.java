package com.tnd.auto_parts.model;

import jakarta.persistence.*;
import lombok.*; // Dùng import tinh gọn

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inspection_sessions")
@Getter // THAY CHO @Data
@Setter // THAY CHO @Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"customer", "part"}) // Không in 2 trường LAZY này ra log để tránh lỗi hiệu năng
public class InspectionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String lotCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InspectionStatus status;

    @Column(nullable = false, updatable = false) // Đảm bảo thời gian tạo không bị update đè
    private LocalDateTime createdAt;

    private LocalDateTime cancelledAt;


    private String pdfReportUrl;
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<InspectionDetail> details = new ArrayList<>();

    @Column(name = "package_type", length = 50)
    private String packageType;

    // TỰ ĐỘNG ĐIỀN THỜI GIAN KHI TẠO ĐƠN
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = InspectionStatus.PENDING; // Mặc định đơn mới tạo là PENDING
        }
    }

    // Thêm cột này vào file InspectionSession.java
    @Column(name = "service_fee")
    private Double serviceFee;

    // Thêm vào file InspectionSession.java
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID; // Mặc định khi tạo đơn là Chưa thanh toán

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

}