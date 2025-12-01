package com.giftai.controller;

import com.giftai.entity.UserEntity;
import com.giftai.model.BookRequest;
import com.giftai.model.BookResponse;
import com.giftai.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/book")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
@Tag(name = "Book API", description = "API for generating personalized e-books")
public class BookController {
    
    private final BookService bookService;
    
    @PostMapping("/generate")
    @Operation(summary = "Generate a new personalized book", description = "Generates a personalized e-book based on recipient information")
    public ResponseEntity<?> generateBook(@Valid @RequestBody BookRequest request, @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required", "message", "Please login to create books"));
        }
        try {
            BookResponse response = bookService.generateBook(request, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage(), "message", "An error occurred while creating the book"));
        }
    }
    
    @GetMapping("/history")
    @Operation(summary = "Get book history", description = "Retrieves all generated books for the authenticated user")
    public ResponseEntity<?> getBookHistory(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }
        List<BookResponse> books = bookService.getUserBooks(user.getId());
        return ResponseEntity.ok(books);
    }
    
    @GetMapping("/discover")
    @Operation(summary = "Discover public books", description = "Retrieves all public books that can be viewed by anyone")
    public ResponseEntity<List<BookResponse>> discoverPublicBooks() {
        List<BookResponse> books = bookService.getPublicBooks();
        return ResponseEntity.ok(books);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get book by ID", description = "Retrieves a specific book by its ID")
    public ResponseEntity<BookResponse> getBookById(@PathVariable Long id, Authentication authentication) {
        // First get the book to check its properties
        BookResponse book = bookService.getBookById(id);
        
        // Get user ID from authentication - try multiple methods
        Long userId = null;
        
        // Method 1: From Authentication parameter
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            log.debug("Authentication principal type: {}", principal != null ? principal.getClass().getName() : "null");
            if (principal instanceof UserEntity) {
                userId = ((UserEntity) principal).getId();
                log.info("✅ Got userId {} from Authentication parameter", userId);
            } else {
                log.warn("Principal is not UserEntity, type: {}, value: {}", 
                        principal != null ? principal.getClass().getName() : "null", principal);
            }
        } else {
            log.warn("Authentication parameter is null");
        }
        
        // Method 2: From SecurityContext
        if (userId == null) {
            Authentication secAuth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (secAuth != null) {
                Object secPrincipal = secAuth.getPrincipal();
                log.debug("SecurityContext principal type: {}", secPrincipal != null ? secPrincipal.getClass().getName() : "null");
                if (secPrincipal instanceof UserEntity) {
                    userId = ((UserEntity) secPrincipal).getId();
                    log.info("✅ Got userId {} from SecurityContext", userId);
                } else {
                    log.warn("SecurityContext principal is not UserEntity, type: {}", 
                            secPrincipal != null ? secPrincipal.getClass().getName() : "null");
                }
            } else {
                log.warn("SecurityContext authentication is null");
            }
        }
        
        // Method 3: Try to extract from token manually if still null
        if (userId == null) {
            log.warn("⚠️ Could not extract userId from authentication. Checking if token is being sent...");
            // This will be logged by JwtAuthenticationFilter
        }
        
        // Detailed debug logging
        log.info("Book access check - Book ID: {}, IsPublic: {}, AuthorId: {}, UserId: {}, Auth present: {}", 
                id, book.getIsPublic(), book.getAuthorId(), 
                userId != null ? userId : "null",
                authentication != null);
        
        // Check if book is public or belongs to authenticated user
        if (!book.getIsPublic()) {
            // Book is private - check if user is the owner
            if (userId == null) {
                log.warn("❌ Access denied: Private book {} accessed without authentication (userId is null)", id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .header("X-Error-Reason", "Authentication required for private books")
                        .build();
            }
            
            // Check if user is the owner by comparing authorId with userId
            if (book.getAuthorId() == null) {
                log.error("❌ CRITICAL: AuthorId is null for book {} - this should not happen!", id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .header("X-Error-Reason", "Book authorId is null")
                        .build();
            }
            
            // CRITICAL: Compare user ID with author ID - if they match, allow access
            // Use .equals() for proper Long comparison
            boolean idsMatch = book.getAuthorId().equals(userId);
            
            log.info("🔍 ID comparison for private book {} - UserId: {} (type: {}), AuthorId: {} (type: {}), Match: {}", 
                    id, userId, userId.getClass().getSimpleName(), 
                    book.getAuthorId(), book.getAuthorId().getClass().getSimpleName(), idsMatch);
            
            if (!idsMatch) {
                log.warn("❌ Access denied: User {} tried to access book {} owned by {} (IDs don't match)", 
                        userId, id, book.getAuthorId());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .header("X-Error-Reason", "User ID does not match book author ID")
                        .build();
            }
            
            log.info("✅ Access granted: User {} (ID matches authorId {}) can access private book {}", 
                    userId, book.getAuthorId(), id);
        } else {
            log.info("✅ Access granted: Book {} is public, anyone can access", id);
        }
        
        // Increment view count (async, don't wait for it)
        try {
            bookService.incrementViewCount(id);
        } catch (Exception e) {
            log.error("Failed to increment view count", e);
        }
        
        return ResponseEntity.ok(book);
    }
    
    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download PDF", description = "Downloads the PDF file for a book")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id, Authentication authentication) {
        BookResponse book = bookService.getBookById(id);
        
        // Get user ID from authentication
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserEntity) {
            userId = ((UserEntity) authentication.getPrincipal()).getId();
        }
        
        // Check access: public book or owner (user ID must match author ID)
        if (!book.getIsPublic()) {
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (book.getAuthorId() == null || !book.getAuthorId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        
        if (book.getPdfPath() == null || !book.getPdfReady()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
        // Increment download count
        bookService.incrementDownloadCount(id);
        
        File file = new File(book.getPdfPath());
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
        Resource resource = new FileSystemResource(file);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", file.getName());
        headers.add("X-Content-Type-Options", "nosniff");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(resource);
    }
    
    @PatchMapping("/{id}/visibility")
    @Operation(summary = "Update book visibility", description = "Updates the public/private visibility of a book")
    public ResponseEntity<?> updateBookVisibility(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request,
            @AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication required");
        }
        try {
            Boolean isPublic = request.get("isPublic");
            if (isPublic == null) {
                return ResponseEntity.badRequest().build();
            }
            BookResponse book = bookService.updateBookVisibility(id, user.getId(), isPublic);
            return ResponseEntity.ok(book);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    @PostMapping("/{id}/view")
    @Operation(summary = "Increment view count", description = "Increments the view count for a book")
    public ResponseEntity<Void> incrementViewCount(@PathVariable Long id) {
        try {
            bookService.incrementViewCount(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/{id}/download")
    @Operation(summary = "Increment download count", description = "Increments the download count for a book")
    public ResponseEntity<Void> incrementDownloadCount(@PathVariable Long id) {
        try {
            bookService.incrementDownloadCount(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{id}/status")
    @Operation(summary = "Check PDF status", description = "Checks if PDF is ready for download")
    public ResponseEntity<Map<String, Object>> checkPdfStatus(@PathVariable Long id, Authentication authentication) {
        BookResponse book = bookService.getBookById(id);
        
        // Get user ID from authentication
        Long userId = null;
        if (authentication != null && authentication.getPrincipal() instanceof UserEntity) {
            userId = ((UserEntity) authentication.getPrincipal()).getId();
        }
        
        // Check access: public book or owner (user ID must match author ID)
        if (!book.getIsPublic()) {
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (book.getAuthorId() == null || !book.getAuthorId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        
        return ResponseEntity.ok(Map.of(
            "pdfReady", book.getPdfReady(),
            "pdfPath", book.getPdfPath() != null ? book.getPdfPath() : ""
        ));
    }
}

