package com.tnd.auto_parts.auth.dto;

import java.util.Set;

public record UserUpdateRequest(
        String fullName,
        String companyName,
        String email,
        String phoneNumber,
        String taxCode,
        String address,
        Set<String> roles // Danh sách các quyền mới (VD: ["CUSTOMER"], ["QC", "ADMIN"])
) {
}