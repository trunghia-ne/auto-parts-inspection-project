package com.tnd.auto_parts.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
public class VNPayService {
    // Bác lấy các biến từ file properties vào đây...
    @Value("${vnpay.vnp_Url}")
    private String vnp_Url;
    @Value("${vnpay.vnp_TmnCode}")
    private String vnp_TmnCode;
    @Value("${vnpay.vnp_HashSecret}")
    private String vnp_HashSecret;

    public String createPaymentUrl(Long sessionId, Double amount, HttpServletRequest request) throws Exception {
        String vnp_TxnRef = String.valueOf(sessionId) + "_" + System.currentTimeMillis(); // Mã giao dịch
        String vnp_OrderInfo = "Thanh toan don hang kiem dinh so: " + sessionId;
        long vnp_Amount = (long) (amount * 100); // VNPay yêu cầu nhân 100

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(vnp_Amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_ReturnUrl", "http://localhost:5173/payment-result"); // Link Frontend nhận kết quả hiển thị
        vnp_Params.put("vnp_IpAddr", request.getRemoteAddr());

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build HashData
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString())).append('&');
                // Build Query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString())).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString())).append('&');
            }
        }

        hashData.deleteCharAt(hashData.length() - 1);
        query.deleteCharAt(query.length() - 1);

        // Ký số bảo mật HMAC SHA512
        Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(vnp_HashSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        sha512_HMAC.init(secretKey);
        byte[] macData = sha512_HMAC.doFinal(hashData.toString().getBytes(StandardCharsets.UTF_8));

        StringBuilder sb = new StringBuilder(macData.length * 2);
        for (byte b : macData) {
            sb.append(String.format("%02x", b & 0xff));
        }
        String vnp_SecureHash = sb.toString();

        return vnp_Url + "?" + query.toString() + "&vnp_SecureHash=" + vnp_SecureHash;
    }
}