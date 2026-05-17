package com.tnd.auto_parts.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspection_status_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionStatusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private InspectionSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InspectionStatus status;

    @Column(length = 255)
    private String message;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
