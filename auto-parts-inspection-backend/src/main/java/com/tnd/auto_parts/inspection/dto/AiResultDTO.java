package com.tnd.auto_parts.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResultDTO {

    // Ánh xạ đúng tên biến từ Python gửi về
    @JsonProperty("class_id")
    private Long classId;

    private Float confidence;
}