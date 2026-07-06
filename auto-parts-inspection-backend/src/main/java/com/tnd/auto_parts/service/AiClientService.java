package com.tnd.auto_parts.service;

import com.tnd.auto_parts.inspection.dto.AiResultDTO;
import com.tnd.auto_parts.model.InspectionDetail;
import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.repository.InspectionDetailRepository;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor // Tự động tạo Constructor để Dependency Injection các Repository bên dưới
public class AiClientService {

    // Tiêm các Repository cần thiết vào để tương tác với Database
    private final InspectionSessionRepository sessionRepository;
    private final InspectionDetailRepository detailRepository;

    // Cổng 8000 của Uvicorn FastAPI
    private static final String PYTHON_AI_URL = "http://localhost:8000/api/predict";

    /**
     * 🔥 HÀM MỚI: Xử lý quét từng sản phẩm, gọi AI và lưu vào bảng chi tiết (inspection_details)
     */
    @Transactional
    public InspectionDetail scanAndSaveIndividualItem(Long sessionId, MultipartFile file) {
        // 1. Kiểm tra đơn hàng có tồn tại không
        InspectionSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn kiểm định mang ID: " + sessionId));

        // 2. Kiểm tra nghiệp vụ: Nếu đã quét đủ số lượng khách đặt thì không cho quét nữa
        if (session.getDetails().size() >= session.getQuantity()) {
            throw new IllegalStateException("Thất bại: Đơn hàng này đã quét đủ " + session.getQuantity() + " sản phẩm!");
        }

        // 3. Gọi hàm phân tích ảnh từ Python AI Server (Hàm cũ của bác ở bên dưới)
        AiResultDTO aiResult = this.analyzeImage(file);
        if (aiResult == null) {
            throw new RuntimeException("Máy chủ AI không trả về kết quả hợp lệ.");
        }

        // 4. Tạo thực thể Detail mới để lưu kết quả của riêng sản phẩm này
        InspectionDetail detail = new InspectionDetail();
        detail.setSession(session);

        // Giả lập lưu link ảnh (Bác có thể bổ sung thêm logic upload ảnh gốc lên Cloud/Thư mục cục bộ nếu cần)
        // Nếu Python AI trả về link ảnh đã vẽ khung, bác map trường đó vào đây.
        // Tạm thời em lấy thông tin từ aiResult của bác:
        detail.setDefectType("Class ID: " + aiResult.getClassId()); // Hoặc map Class ID sang chữ tiếng Việt tùy bác cấu hình
        detail.setBoundingBoxes("Confidence: " + aiResult.getConfidence()); // Lưu độ chính xác hoặc tọa độ ô nếu có
        detail.setImageUrl("Link_anh_ket_qua_hoac_anh_goc.jpg");
        detail.setCreatedAt(LocalDateTime.now());

        // 5. Lưu vào Database thông qua bảng con
        InspectionDetail savedDetail = detailRepository.save(detail);
        log.info("💾 Đã lưu kết quả quét sản phẩm thứ {}/{} vào DB thành công.", session.getDetails().size() + 1, session.getQuantity());

        return savedDetail;
    }

    /**
     * HÀM CŨ CỦA BÁC: Giữ nguyên để làm nhiệm vụ call HTTP sang Python
     */
    public AiResultDTO analyzeImage(MultipartFile file) {
        RestTemplate restTemplate = new RestTemplate();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
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