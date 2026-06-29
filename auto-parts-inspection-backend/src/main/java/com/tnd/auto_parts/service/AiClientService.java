package com.tnd.auto_parts.service;

import com.tnd.auto_parts.inspection.dto.AiResultDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
public class AiClientService {

    // Cổng 8000 của Uvicorn FastAPI
    private static final String PYTHON_AI_URL = "http://localhost:8000/api/predict";

    public AiResultDTO analyzeImage(MultipartFile file) {
        RestTemplate restTemplate = new RestTemplate();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            // .getResource() sẽ giúp RestTemplate tự đọc file byte array để gửi đi
            body.add("file", file.getResource());

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("🚀 Đang gửi ảnh sang Python AI Server...");
            AiResultDTO result = restTemplate.postForObject(PYTHON_AI_URL, requestEntity, AiResultDTO.class);

            if (result != null) {
                log.info("✅ Nhận kết quả AI: Class ID = {}, Confidence = {}", result.getClassId(), result.getConfidence());
            }
            return result;

        } catch (Exception e) {
            log.error("❌ Lỗi khi gọi Python AI: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối đến máy chủ AI (Có thể chưa bật Server Python).");
        }
    }
}