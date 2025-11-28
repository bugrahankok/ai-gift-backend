package com.giftai.service;

import com.giftai.entity.BookEntity;
import com.giftai.entity.UserEntity;
import com.giftai.model.BookRequest;
import com.giftai.model.BookResponse;
import com.giftai.provider.BookProvider;
import com.giftai.repository.BookRepository;
import com.giftai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {
    
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookProvider bookProvider;
    private final PdfGenerationService pdfGenerationService;
    
    @Transactional
    public BookResponse generateBook(BookRequest request, Long userId) {
        log.info("Generating book for: {} by {} for user: {}", request.getName(), request.getGiver(), userId);
        
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        String content = bookProvider.generateBook(request);
        
        BookEntity entity = BookEntity.builder()
                .name(request.getName())
                .age(request.getAge())
                .theme(request.getTheme())
                .tone(request.getTone())
                .giver(request.getGiver())
                .appearance(request.getAppearance())
                .content(content)
                .pdfReady(false)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .user(user)
                .build();
        
        entity = bookRepository.save(entity);
        log.info("Book saved with ID: {} for user: {}", entity.getId(), userId);
        
        pdfGenerationService.generatePdfAsync(entity.getId(), content, request.getName());
        
        return toResponse(entity);
    }
    
    public List<BookResponse> getUserBooks(Long userId) {
        log.info("Retrieving books for user: {}", userId);
        return bookRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public BookResponse getBookById(Long id) {
        log.info("Retrieving book with ID: {}", id);
        BookEntity entity = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        
        return toResponse(entity);
    }
    
    public BookResponse getBookById(Long id, Long userId) {
        log.info("Retrieving book with ID: {} for user: {}", id, userId);
        BookEntity entity = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        
        if (!entity.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied: This book does not belong to you");
        }
        
        return toResponse(entity);
    }
    
    public List<BookResponse> getPublicBooks() {
        log.info("Retrieving all public books");
        return bookRepository.findByIsPublicTrueOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public BookResponse updateBookVisibility(Long id, Long userId, Boolean isPublic) {
        log.info("Updating book visibility: id={}, userId={}, isPublic={}", id, userId, isPublic);
        BookEntity entity = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        
        if (!entity.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied: This book does not belong to you");
        }
        
        entity.setIsPublic(isPublic);
        entity = bookRepository.save(entity);
        
        log.info("Book visibility updated successfully: id={}, isPublic={}", id, isPublic);
        return toResponse(entity);
    }
    
    @Transactional
    public void incrementViewCount(Long id) {
        log.info("Incrementing view count for book: {}", id);
        BookEntity entity = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        
        entity.setViewCount(entity.getViewCount() + 1);
        bookRepository.save(entity);
    }
    
    @Transactional
    public void incrementDownloadCount(Long id) {
        log.info("Incrementing download count for book: {}", id);
        BookEntity entity = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        
        entity.setDownloadCount(entity.getDownloadCount() + 1);
        bookRepository.save(entity);
    }
    
    private BookResponse toResponse(BookEntity entity) {
        return BookResponse.builder()
                .bookId(entity.getId())
                .name(entity.getName())
                .age(entity.getAge())
                .theme(entity.getTheme())
                .tone(entity.getTone())
                .giver(entity.getGiver())
                .appearance(entity.getAppearance())
                .content(entity.getContent())
                .pdfPath(entity.getPdfPath())
                .pdfReady(entity.getPdfReady())
                .isPublic(entity.getIsPublic())
                .authorName(entity.getUser() != null ? entity.getUser().getName() : null)
                .viewCount(entity.getViewCount() != null ? entity.getViewCount() : 0L)
                .downloadCount(entity.getDownloadCount() != null ? entity.getDownloadCount() : 0L)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

