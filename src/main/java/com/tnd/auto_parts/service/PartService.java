package com.tnd.auto_parts.service;

import com.tnd.auto_parts.part.dto.PartRequest;
import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.repository.PartRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PartService {

    private final PartRepository partRepository;

    public PartService(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    public List<Part> getAllParts() {
        return partRepository.findAll();
    }

    public Part createPart(PartRequest request) {
        if (partRepository.existsByPartCode(request.getPartCode())) {
            throw new RuntimeException("Part code already exists: " + request.getPartCode());
        }
        Part part = new Part();
        part.setPartCode(request.getPartCode());
        part.setPartName(request.getPartName());
        part.setSpecifications(request.getSpecifications());

        return partRepository.save(part);
    }

    public Part updatePart(Long id, PartRequest request) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Part not found with ID: " + id));

        if (!part.getPartCode().equals(request.getPartCode()) && partRepository.existsByPartCode(request.getPartCode())) {
            throw new RuntimeException("Part code already exists: " + request.getPartCode());
        }

        part.setPartCode(request.getPartCode());
        part.setPartName(request.getPartName());
        part.setSpecifications(request.getSpecifications());

        return partRepository.save(part);
    }

    public void deletePart(Long id) {
        partRepository.deleteById(id);
    }
}