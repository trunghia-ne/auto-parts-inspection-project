package com.tnd.auto_parts.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "parts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String partCode; // Mã phụ tùng

    @Column(nullable = false)
    private String partName; // Tên phụ tùng

    private String specifications; // Thông số kỹ thuật

    @Column(name = "ai_class_id", unique = true)
    private Integer aiClassId;
}
