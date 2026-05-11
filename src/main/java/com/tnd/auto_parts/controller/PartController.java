package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.part.dto.PartRequest;
import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.service.PartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// Tùy thuộc vào cách bạn config Role (ví dụ @PreAuthorize)
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
public class PartController {

    private final PartService partService;

    public PartController(PartService partService) {
        this.partService = partService;
    }

    // Ai đã đăng nhập cũng xem được danh sách
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partService.getAllParts());
    }

    // Chỉ Manager hoặc Admin mới được thêm/sửa/xóa
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Part> createPart(@Valid @RequestBody PartRequest request) {
        return new ResponseEntity<>(partService.createPart(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Part> updatePart(@PathVariable Long id, @Valid @RequestBody PartRequest request) {
        return ResponseEntity.ok(partService.updatePart(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> deletePart(@PathVariable Long id) {
        partService.deletePart(id);
        return ResponseEntity.ok().body("Xóa phụ tùng thành công");
    }
}
