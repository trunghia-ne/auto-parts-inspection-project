package com.tnd.auto_parts.inspection.dto;

import com.tnd.auto_parts.model.InspectionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class UpdateInspectionStatusRequest {

    @NotNull(message = "Status is required")
    private InspectionStatus status;
    private String defectType;
    private List<Map<String, Object>> boundingBoxes;
}
