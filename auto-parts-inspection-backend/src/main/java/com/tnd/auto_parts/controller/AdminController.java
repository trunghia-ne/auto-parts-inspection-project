package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.auth.dto.UserResponse;
import com.tnd.auto_parts.auth.dto.UserUpdateRequest;
import com.tnd.auto_parts.inspection.dto.ReportSessionResponse;
import com.tnd.auto_parts.model.*;
import com.tnd.auto_parts.repository.InspectionSessionRepository;
import com.tnd.auto_parts.repository.PartRepository;
import com.tnd.auto_parts.repository.RoleRepository;
import com.tnd.auto_parts.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PartRepository partRepository;
    private final InspectionSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    // Gộp Injection cho cả 4 Repository
    public AdminController(
            PartRepository partRepository,
            InspectionSessionRepository sessionRepository,
            UserRepository userRepository,
            RoleRepository roleRepository) {
        this.partRepository = partRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    // ==========================================
    // QUẢN LÝ DANH MỤC PHỤ TÙNG
    // ==========================================

    @GetMapping("/parts")
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partRepository.findAll());
    }

    @PostMapping("/parts")
    public ResponseEntity<?> createPart(@RequestBody Part part) {
        if (partRepository.existsByPartCode(part.getPartCode())) {
            return ResponseEntity.badRequest().body("Mã phụ tùng đã tồn tại!");
        }
        return ResponseEntity.ok(partRepository.save(part));
    }

    @PutMapping("/parts/{id}")
    public ResponseEntity<?> updatePart(@PathVariable Long id, @RequestBody Part partDetails) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phụ tùng"));

        part.setPartName(partDetails.getPartName());
        part.setSpecifications(partDetails.getSpecifications());
        part.setAiClassId(partDetails.getAiClassId());
        part.setPrice(partDetails.getPrice());

        return ResponseEntity.ok(partRepository.save(part));
    }

    @DeleteMapping("/parts/{id}")
    public ResponseEntity<?> deletePart(@PathVariable Long id) {
        partRepository.deleteById(id);
        return ResponseEntity.ok("Xóa danh mục phụ tùng thành công!");
    }

    // ==========================================
    // THỐNG KÊ DASHBOARD & THANH TOÁN
    // ==========================================

    // ==========================================
    // THỐNG KÊ DASHBOARD & THANH TOÁN
    // ==========================================

    @GetMapping("/dashboard/statistics")
    public ResponseEntity<?> getDashboardStats() {
        Double totalRevenue = sessionRepository.calculateTotalRevenue();
        long totalUsers = userRepository.count();
        long totalSessions = sessionRepository.count();

        // Đếm thủ công số đơn PENDING (hoặc bác có thể viết thêm hàm countByStatus trong Repository sau)
        long pendingSessions = sessionRepository.findAll().stream()
                .filter(s -> "PENDING".equals(s.getStatus()) || "PENDING_EXPERT".equals(s.getStatus()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("status", "SUCCESS");
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        stats.put("totalUsers", totalUsers);
        stats.put("totalSessions", totalSessions);
        stats.put("pendingSessions", pendingSessions);

        return ResponseEntity.ok(stats);
    }

    @PatchMapping("/sessions/{id}/payment")
    public ResponseEntity<?> updatePaymentStatus(@PathVariable Long id, @RequestParam PaymentStatus status) {
        InspectionSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng"));

        session.setPaymentStatus(status);
        sessionRepository.save(session);

        return ResponseEntity.ok("Cập nhật trạng thái thanh toán thành công thành: " + status);
    }

    // ==========================================
    // QUẢN LÝ NGƯỜI DÙNG (USERS)
    // ==========================================

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> responses = userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng mang ID: " + id));
        return ResponseEntity.ok(mapToUserResponse(user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng mang ID: " + id));

        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.companyName() != null) user.setCompanyName(request.companyName());
        if (request.email() != null) user.setEmail(request.email());
        if (request.phoneNumber() != null) user.setPhoneNumber(request.phoneNumber());
        if (request.taxCode() != null) user.setTaxCode(request.taxCode());
        if (request.address() != null) user.setAddress(request.address());

        if (request.roles() != null && !request.roles().isEmpty()) {
            Set<Role> newRoles = request.roles().stream()
                    .map(roleStr -> {
                        try {
                            RoleName roleName = RoleName.valueOf(roleStr.trim().toUpperCase());
                            return roleRepository.findByName(roleName)
                                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Role: " + roleStr));
                        } catch (IllegalArgumentException e) {
                            throw new IllegalArgumentException("Role không hợp lệ: " + roleStr);
                        }
                    })
                    .collect(Collectors.toSet());
            user.setRoles(newRoles);
        }

        AppUser savedUser = userRepository.save(user);
        return ResponseEntity.ok(mapToUserResponse(savedUser));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("Người dùng không tồn tại!");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa người dùng thành công!");
    }

    // Hàm tiện ích Map Entity sang DTO
    private UserResponse mapToUserResponse(AppUser user) {
        Set<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getCompanyName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getTaxCode(),
                user.getAddress(),
                roles
        );
    }
// ==========================================
    // BÁO CÁO GIAO DỊCH (REPORTS)
    // ==========================================

    @GetMapping("/reports/sessions")
    public ResponseEntity<List<ReportSessionResponse>> getReportSessions(
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            @RequestParam(required = false, defaultValue = "ALL") String status) {

        // Ép thời gian: startDate lấy từ 00:00:00, endDate lấy đến 23:59:59 để bao trọn ngày
        java.time.LocalDateTime start = startDate.atStartOfDay();
        java.time.LocalDateTime end = endDate.atTime(23, 59, 59);

        List<InspectionSession> sessions;

        // Xử lý logic lọc
        if ("ALL".equalsIgnoreCase(status)) {
            sessions = sessionRepository.findByCreatedAtBetween(start, end);
        } else {
            // 🔥 ÉP KIỂU STRING SANG ENUM TẠI ĐÂY
            try {
                InspectionStatus enumStatus = InspectionStatus.valueOf(status.toUpperCase());
                sessions = sessionRepository.findByCreatedAtBetweenAndStatus(start, end, enumStatus);
            } catch (IllegalArgumentException e) {
                // Nếu Frontend gửi lên 1 status vớ vẩn không có trong Enum thì ném lỗi luôn
                throw new IllegalArgumentException("Trạng thái lọc không hợp lệ: " + status);
            }
        }

        // Map Entity sang DTO
        List<ReportSessionResponse> responses = sessions.stream().map(s -> {

            String customerName = "Khách vãng lai";
            // 🔥 ĐỔI getUser() THÀNH getCustomer() CHO KHỚP VỚI ENTITY CỦA BÁC
            if (s.getCustomer() != null) {
                if (s.getCustomer().getCompanyName() != null && !s.getCustomer().getCompanyName().isBlank()) {
                    customerName = s.getCustomer().getCompanyName();
                } else if (s.getCustomer().getFullName() != null) {
                    customerName = s.getCustomer().getFullName();
                } else {
                    customerName = s.getCustomer().getUsername();
                }
            }

            // Tính tổng tiền
            Double totalAmt = 0.0;
            if (s.getQuantity() != null && s.getPart() != null && s.getPart().getPrice() != null) {
                totalAmt = s.getQuantity() * s.getPart().getPrice();
            }

            return new ReportSessionResponse(
                    s.getId(),
                    s.getLotCode(),
                    customerName,
                    s.getCreatedAt(),
                    s.getPaymentStatus() != null ? s.getPaymentStatus().name() : "PENDING",
                    totalAmt,
                    s.getStatus() != null ? s.getStatus().name() : "PENDING"
            );
        }).toList();

        return ResponseEntity.ok(responses);
    }

    // ==========================================
    // DỮ LIỆU BIỂU ĐỒ TRỰC QUAN (CHARTS)
    // ==========================================

    @GetMapping("/dashboard/charts")
    public ResponseEntity<?> getDashboardCharts() {
        // 1. DỮ LIỆU BIỂU ĐỒ ĐƯỜNG (7 Ngày qua)
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDateTime startDate = today.minusDays(6).atStartOfDay();

        List<InspectionSession> recentSessions = sessionRepository.findByCreatedAtAfter(startDate);
        List<Map<String, Object>> revenueData = new java.util.ArrayList<>();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM");

        // Chạy vòng lặp lùi từ 6 ngày trước đến hôm nay để đảm bảo ngày nào không có đơn vẫn hiện số 0
        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate date = today.minusDays(i);
            String dateName = date.format(formatter);

            // Lọc các đơn của ngày hiện tại trong vòng lặp
            List<InspectionSession> sessionsForDate = recentSessions.stream()
                    .filter(s -> s.getCreatedAt().toLocalDate().equals(date))
                    .toList();

            long orders = sessionsForDate.size();

            // Tính tổng tiền của các đơn đã thanh toán (PAID) trong ngày
            double revenue = sessionsForDate.stream()
                    .filter(s -> s.getPaymentStatus() == PaymentStatus.PAID)
                    .mapToDouble(s -> {
                        if (s.getQuantity() != null && s.getPart() != null && s.getPart().getPrice() != null) {
                            return s.getQuantity() * s.getPart().getPrice();
                        }
                        return 0.0;
                    })
                    .sum();

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("name", dateName);
            dayData.put("revenue", revenue);
            dayData.put("orders", orders);
            revenueData.add(dayData);
        }

        // 2. DỮ LIỆU BIỂU ĐỒ TRÒN (Tỷ lệ Đạt / Lỗi)
        long passedCount = sessionRepository.countByStatus(com.tnd.auto_parts.model.InspectionStatus.PASSED);
        long failedCount = sessionRepository.countByStatus(com.tnd.auto_parts.model.InspectionStatus.FAILED);

        List<Map<String, Object>> defectData = List.of(
                Map.of("name", "Đạt (PASSED)", "value", passedCount, "color", "#10b981"),
                Map.of("name", "Lỗi (FAILED)", "value", failedCount, "color", "#ef4444")
        );

        // Đóng gói trả về Frontend
        Map<String, Object> response = new HashMap<>();
        response.put("revenueData", revenueData);
        response.put("defectData", defectData);

        return ResponseEntity.ok(response);
    }
}