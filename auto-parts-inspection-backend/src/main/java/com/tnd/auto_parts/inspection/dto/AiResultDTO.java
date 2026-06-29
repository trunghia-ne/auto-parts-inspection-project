package com.tnd.auto_parts.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResultDTO {

    @JsonProperty("class_id")
    private Long classId;

    private Float confidence;

    // --- CÁC TRƯỜNG MỚI ĐỂ HỨNG DỮ LIỆU LỖI (MOCK) TỪ PYTHON ---

    @JsonProperty("status")
    private String status;

    @JsonProperty("part_name")
    private String partName;

    @JsonProperty("defect_type")
    private String defectType;

    // Hứng mảng chứa tọa độ khung đỏ, ví dụ: [{"top": "20%", "left": "60%", ...}]
    @JsonProperty("bounding_boxes")
    private List<Map<String, String>> boundingBoxes;
}