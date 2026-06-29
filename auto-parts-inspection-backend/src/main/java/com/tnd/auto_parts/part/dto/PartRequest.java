package com.tnd.auto_parts.part.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PartRequest {
    @NotBlank(message = "Mã phụ tùng không được để trống")
    private String partCode;

    @NotBlank(message = "Tên phụ tùng không được để trống")
    private String partName;

    private String specifications;
}