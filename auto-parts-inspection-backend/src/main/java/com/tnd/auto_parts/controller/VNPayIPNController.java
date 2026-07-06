package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.model.InspectionSession;
import com.tnd.auto_parts.model.PaymentStatus;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/public/vnpay")
public class VNPayIPNController {

    private final InspectionSessionRepository sessionRepository;

    public VNPayIPNController(InspectionSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @GetMapping("/ipn")
    public Map<String, String> receiveIPN(@RequestParam Map<String, String> params) {
        // 💡 Chỗ này thực tế cần viết hàm kiểm tra lại vnp_SecureHash xem có đúng VNPay gọi không (để tránh hack)

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef"); // Định dạng: {sessionId}_{timestamp}
        Long sessionId = Long.parseLong(txnRef.split("_")[0]);

        if ("00".equals(responseCode)) { // 00 = Thành công hoàn toàn
            InspectionSession session = sessionRepository.findById(sessionId).orElse(null);
            if (session != null && session.getPaymentStatus() == PaymentStatus.UNPAID) {

                // 🔥 TỰ ĐỘNG ĐỔI TRẠNG THÁI THANH TOÁN THÀNH PAID
                session.setPaymentStatus(PaymentStatus.PAID);
                sessionRepository.save(session);

                return Map.of("RspCode", "00", "Message", "Confirm Success");
            }
        }
        return Map.of("RspCode", "99", "Message", "Payment Failed");
    }
}