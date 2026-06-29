package com.tnd.auto_parts.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final String uploadPreset;

    public CloudinaryService(
            @Value("${cloudinary.cloud-name}") String cloudName,
            @Value("${cloudinary.api-key}") String apiKey,
            @Value("${cloudinary.api-secret}") String apiSecret,
            @Value("${cloudinary.upload-preset}") String uploadPreset // Thêm dòng này vào application.properties
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        this.uploadPreset = uploadPreset;
    }

    public String uploadImage(MultipartFile file) {
        try {
            // Sử dụng Unsigned Upload thông qua Preset
            Map uploadResult = cloudinary.uploader().unsignedUpload(
                    file.getBytes(),
                    this.uploadPreset, // Dùng preset để cấp quyền
                    ObjectUtils.asMap("resource_type", "image")
            );

            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi Upload Cloudinary: " + e.getMessage());
        }
    }
}