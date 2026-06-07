package com.tnd.auto_parts.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    @NotBlank(message = "Username cannot be blank")
    private String username;

    private String password; // Optional on update

    @NotEmpty(message = "At least one role must be specified")
    private Set<String> roles;
}
