package com.giftai.service;

import com.giftai.entity.AnnouncementEntity;
import com.giftai.model.AnnouncementRequest;
import com.giftai.model.AnnouncementResponse;
import com.giftai.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {
    
    private final AnnouncementRepository announcementRepository;
    
    public List<AnnouncementResponse> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public AnnouncementResponse getActiveAnnouncement(String type) {
        try {
            return announcementRepository.findByTypeAndIsActiveTrueOrderByUpdatedAtDesc(type)
                    .map(this::toResponse)
                    .orElse(null);
        } catch (Exception e) {
            log.warn("Error retrieving active announcement for type {}: {}", type, e.getMessage());
            // Return null if table doesn't exist or other error occurs
            return null;
        }
    }
    
    @Transactional
    public AnnouncementResponse createOrUpdateAnnouncement(AnnouncementRequest request) {
        // Deactivate all announcements of the same type
        List<AnnouncementEntity> existing = announcementRepository.findByTypeAndIsActiveTrue(request.getType());
        for (AnnouncementEntity ann : existing) {
            ann.setIsActive(false);
            announcementRepository.save(ann);
        }
        
        // Create new announcement
        AnnouncementEntity announcement = AnnouncementEntity.builder()
                .type(request.getType())
                .message(request.getMessage())
                .icon(request.getIcon() != null ? request.getIcon() : "📢")
                .isActive(request.getIsActive())
                .build();
        
        announcement = announcementRepository.save(announcement);
        log.info("Announcement created/updated: {} - {}", request.getType(), request.getMessage());
        
        return toResponse(announcement);
    }
    
    @Transactional
    public void deleteAnnouncement(Long id) {
        AnnouncementEntity announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        announcementRepository.delete(announcement);
        log.info("Announcement deleted: {}", id);
    }
    
    @Transactional
    public AnnouncementResponse toggleAnnouncement(Long id) {
        AnnouncementEntity announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));
        
        // If activating, deactivate others of the same type
        if (!announcement.getIsActive()) {
            List<AnnouncementEntity> existing = announcementRepository.findByTypeAndIsActiveTrue(announcement.getType());
            for (AnnouncementEntity ann : existing) {
                ann.setIsActive(false);
                announcementRepository.save(ann);
            }
        }
        
        announcement.setIsActive(!announcement.getIsActive());
        announcement = announcementRepository.save(announcement);
        
        return toResponse(announcement);
    }
    
    private AnnouncementResponse toResponse(AnnouncementEntity entity) {
        return AnnouncementResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .message(entity.getMessage())
                .icon(entity.getIcon())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

