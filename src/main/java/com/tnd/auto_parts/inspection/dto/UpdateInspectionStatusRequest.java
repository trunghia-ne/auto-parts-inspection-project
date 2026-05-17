package com.tnd.auto_parts.inspection.dto;

import com.tnd.auto_parts.model.InspectionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateInspectionStatusRequest {

    @NotNull(message = "Status is required")
    private InspectionStatus status;
}
