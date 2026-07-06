package com.tnd.auto_parts.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 100) String username,
        @NotBlank @Size(min = 6, max = 100) String password,
        String role,

        // 🔥 CÁC TRƯỜNG THÔNG TIN B2B BỔ SUNG
        String companyName,
        String fullName,

        @Email(message = "Định dạng email không hợp lệ")
        String email,

        String phoneNumber,
        String taxCode,
        String address
) {
}