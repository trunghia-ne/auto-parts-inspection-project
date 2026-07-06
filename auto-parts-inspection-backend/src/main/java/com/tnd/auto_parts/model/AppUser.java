package com.tnd.auto_parts.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    // =========================================================
    // 🔥 CÁC TRƯỜNG THÔNG TIN MỞ RỘNG (DÀNH CHO KHÁCH HÀNG B2B)
    // =========================================================

    @Column(name = "company_name", length = 255)
    private String companyName; // Tên doanh nghiệp / Xưởng

    @Column(name = "full_name", length = 150)
    private String fullName; // Tên người đại diện

    @Column(unique = true, length = 150)
    private String email; // Bắt buộc Unique để sau này gửi báo cáo, reset pass

    @Column(name = "phone_number", length = 20)
    private String phoneNumber; // Số điện thoại liên hệ

    @Column(name = "tax_code", length = 50)
    private String taxCode; // Mã số thuế (Để xuất hóa đơn)

    @Column(length = 500)
    private String address; // Địa chỉ xưởng/công ty

    // =========================================================

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();
}