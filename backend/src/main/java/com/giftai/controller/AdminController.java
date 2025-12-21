package com.giftai.controller;

import com.giftai.entity.UserEntity;
import com.giftai.model.AdminStatsResponse;
import com.giftai.model.AnnouncementRequest;
import com.giftai.model.AnnouncementResponse;
import com.giftai.model.BookResponse;
import com.giftai.model.BookUpdateRequest;
import com.giftai.model.UserProfileResponse;
import com.giftai.model.UserUpdateRequest;
import com.giftai.service.AdminService;
import com.giftai.service.AnnouncementService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
@Tag(name = "Admin API", description = "API for admin panel management")
public class AdminController {
    
    private final AdminService adminService;
    private final AnnouncementService announcementService;
    
    @GetMapping("/users")
    @Operation(summary = "Get all users", description = "Retrieves all users. Requires admin authentication.")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            List<UserProfileResponse> users = adminService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            log.error("Error retrieving users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve users"));
        }
    }
    
    @GetMapping("/books")
    @Operation(summary = "Get all books", description = "Retrieves all books (public and private). Requires admin authentication.")
    public ResponseEntity<?> getAllBooks(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            List<BookResponse> books = adminService.getAllBooks();
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error retrieving books: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve books"));
        }
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Get admin statistics", description = "Retrieves comprehensive statistics for admin panel. Requires admin authentication.")
    public ResponseEntity<?> getStatistics(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            AdminStatsResponse stats = adminService.getStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error retrieving statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve statistics"));
        }
    }
    
    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Delete user", description = "Deletes a user by ID. Requires admin authentication.")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            adminService.deleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/users/{userId}")
    @Operation(summary = "Update user", description = "Updates user information. Requires admin authentication.")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, 
                                       @Valid @RequestBody UserUpdateRequest request,
                                       @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            UserProfileResponse updatedUser = adminService.updateUser(
                    userId, request.getName(), request.getEmail(), request.getPassword(), request.getIsAdmin());
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            log.error("Error updating user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/books/{bookId}")
    @Operation(summary = "Delete book", description = "Deletes a book by ID. Requires admin authentication.")
    public ResponseEntity<?> deleteBook(@PathVariable Long bookId, @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            adminService.deleteBook(bookId);
            return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting book: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/books/{bookId}")
    @Operation(summary = "Update book", description = "Updates book information. Requires admin authentication.")
    public ResponseEntity<?> updateBook(@PathVariable Long bookId,
                                       @Valid @RequestBody BookUpdateRequest request,
                                       @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            BookResponse updatedBook = adminService.updateBook(
                    bookId, request.getName(), request.getAge(), request.getGender(),
                    request.getLanguage(), request.getTheme(), request.getMainTopic(),
                    request.getTone(), request.getGiver(), request.getAppearance(),
                    request.getCharacters(), request.getIsPublic());
            return ResponseEntity.ok(updatedBook);
        } catch (Exception e) {
            log.error("Error updating book: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/announcements")
    @Operation(summary = "Get all announcements", description = "Retrieves all announcements. Requires admin authentication.")
    public ResponseEntity<?> getAllAnnouncements(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            List<AnnouncementResponse> announcements = announcementService.getAllAnnouncements();
            return ResponseEntity.ok(announcements);
        } catch (Exception e) {
            log.error("Error retrieving announcements: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve announcements"));
        }
    }
    
    @PostMapping("/announcements")
    @Operation(summary = "Create or update announcement", description = "Creates a new announcement or updates existing. Requires admin authentication.")
    public ResponseEntity<?> createAnnouncement(@Valid @RequestBody AnnouncementRequest request,
                                                @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            AnnouncementResponse announcement = announcementService.createOrUpdateAnnouncement(request);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            log.error("Error creating announcement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/announcements/{id}")
    @Operation(summary = "Delete announcement", description = "Deletes an announcement. Requires admin authentication.")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id, @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            announcementService.deleteAnnouncement(id);
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting announcement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PatchMapping("/announcements/{id}/toggle")
    @Operation(summary = "Toggle announcement", description = "Activates or deactivates an announcement. Requires admin authentication.")
    public ResponseEntity<?> toggleAnnouncement(@PathVariable Long id, @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }
        
        if (user.getIsAdmin() == null || !user.getIsAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required"));
        }
        
        try {
            AnnouncementResponse announcement = announcementService.toggleAnnouncement(id);
            return ResponseEntity.ok(announcement);
        } catch (Exception e) {
            log.error("Error toggling announcement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}

