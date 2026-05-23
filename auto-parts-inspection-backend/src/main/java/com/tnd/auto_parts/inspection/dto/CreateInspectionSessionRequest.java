package com.tnd.auto_parts.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateInspectionSessionRequest {

    @NotBlank(message = "Lot code is required")
    private String lotCode;

    @NotNull(message = "Part id is required")
    private Long partId;
}
