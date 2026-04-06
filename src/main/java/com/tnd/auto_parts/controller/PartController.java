package com.tnd.auto_parts.controller;

import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.repository.PartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@CrossOrigin(origins = "http://localhost:5173")// Cho phép Frontend Vite gọi vào
public class PartController {

    @Autowired
    private PartRepository partRepository;

    @GetMapping
    public List<Part> findAll() {
        return partRepository.findAll();// Trả về toàn bộ phụ tùng trong DB dưới dạng JSON
    }
}
