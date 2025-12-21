package com.giftai.controller;

import com.giftai.model.AnnouncementResponse;
import com.giftai.service.AnnouncementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
@Tag(name = "Announcement API", description = "API for public announcement access")
public class AnnouncementController {
    
    private final AnnouncementService announcementService;
    
    @GetMapping("/active/{type}")
    @Operation(summary = "Get active announcement", description = "Retrieves the active announcement for a given type (bar or popup)")
    public ResponseEntity<?> getActiveAnnouncement(@PathVariable String type) {
        try {
            AnnouncementResponse announcement = announcementService.getActiveAnnouncement(type);
            if (announcement == null) {
                // Return inactive response if no announcement found (table might not exist yet)
                return ResponseEntity.ok(Map.of("active", false));
            }
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            log.warn("Error retrieving active announcement for type {}: {}", type, e.getMessage());
            // Return inactive response instead of error to prevent frontend issues
            return ResponseEntity.ok(Map.of("active", false));
        }
    }
}

