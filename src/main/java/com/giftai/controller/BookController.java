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
    
    @GetMapping("/{id}")
    @Operation(summary = "Get book by ID", description = "Retrieves a specific book by its ID")
    public ResponseEntity<BookResponse> getBookById(@PathVariable Long id, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        BookResponse book = bookService.getBookById(id, user.getId());
        return ResponseEntity.ok(book);
    }
    
    @GetMapping("/{id}/pdf")
    @Operation(summary = "Download PDF", description = "Downloads the PDF file for a book")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        BookResponse book = bookService.getBookById(id, user.getId());
        
        if (book.getPdfPath() == null || !book.getPdfReady()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
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
    
    @GetMapping("/{id}/status")
    @Operation(summary = "Check PDF status", description = "Checks if PDF is ready for download")
    public ResponseEntity<Map<String, Object>> checkPdfStatus(@PathVariable Long id, Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        BookResponse book = bookService.getBookById(id, user.getId());
        return ResponseEntity.ok(Map.of(
            "pdfReady", book.getPdfReady(),
            "pdfPath", book.getPdfPath() != null ? book.getPdfPath() : ""
        ));
    }
}

