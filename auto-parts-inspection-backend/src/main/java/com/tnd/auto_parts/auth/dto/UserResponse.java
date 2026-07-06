package com.tnd.auto_parts.auth.dto;

import java.util.Set;

public record UserResponse(
        Long id,
        String username,
        String fullName,
        String companyName,
        String email,
        String phoneNumber,
        String taxCode,
        String address,
        Set<String> roles
) {
}