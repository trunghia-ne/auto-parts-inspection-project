package com.tnd.auto_parts.auth.dto;

import java.util.Set;

public record AuthResponse(
        String token,
        String tokenType,
        String username,
        Set<String> roles
) {
}
