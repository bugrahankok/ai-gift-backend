package com.giftai.controller;

import com.giftai.entity.UserEntity;
import com.giftai.model.BookRequest;
import com.giftai.model.BookResponse;
import com.giftai.service.BookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/book")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Book API", description = "API for generating personalized e-books")
public class BookController {
    
    private final BookService bookService;
    
    @PostMapping("/generate")
    @Operation(summary = "Generate a new personalized book", description = "Generates a personalized e-book based on recipient information")
    public ResponseEntity<?> generateBook(@Valid @RequestBody BookRequest request, Authentication authentication) {
        try {
            UserEntity user = (UserEntity) authentication.getPrincipal();
            BookResponse response = bookService.generateBook(request, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage(), "message", "An error occurred while creating the book"));
        }
    }
    
    @GetMapping("/history")
    @Operation(summary = "Get book history", description = "Retrieves all generated books for the authenticated user")
    public ResponseEntity<List<BookResponse>> getBookHistory(Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
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
        BookResponse book = bookService.getBookById(id);
        
        // Check if book is public or belongs to authenticated user
        if (authentication != null) {
            UserEntity user = (UserEntity) authentication.getPrincipal();
            if (!book.getIsPublic() && (book.getAuthorName() == null || !book.getAuthorName().equals(user.getName()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        } else {
            // If not authenticated, only allow public books
            if (!book.getIsPublic()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        
        // Increment view count (async, don't wait for it)
        try {
            bookService.incrementViewCount(id);
        } catch (Exception e) {
            // Log but don't fail the request
        }
        
        return ResponseEntity.ok(book);
    }
    
    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download PDF", description = "Downloads the PDF file for a book")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id, Authentication authentication) {
        BookResponse book = bookService.getBookById(id);
        
        // Check access: public book or owner
        if (authentication != null) {
            UserEntity user = (UserEntity) authentication.getPrincipal();
            if (!book.getIsPublic() && (book.getAuthorName() == null || !book.getAuthorName().equals(user.getName()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        } else {
            if (!book.getIsPublic()) {
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
    public ResponseEntity<BookResponse> updateBookVisibility(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request,
            Authentication authentication) {
        try {
            UserEntity user = (UserEntity) authentication.getPrincipal();
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
        
        // Check access: public book or owner
        if (authentication != null) {
            UserEntity user = (UserEntity) authentication.getPrincipal();
            if (!book.getIsPublic() && (book.getAuthorName() == null || !book.getAuthorName().equals(user.getName()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        } else {
            if (!book.getIsPublic()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(Map.of(
            "pdfReady", book.getPdfReady(),
            "pdfPath", book.getPdfPath() != null ? book.getPdfPath() : ""
        ));
    }
}

