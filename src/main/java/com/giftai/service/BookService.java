package com.giftai.service;

import com.giftai.entity.BookEntity;
import com.giftai.model.BookRequest;
import com.giftai.model.BookResponse;
import com.giftai.provider.BookProvider;
import com.giftai.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {
    
    private final BookRepository bookRepository;
    private final BookProvider bookProvider;
    private final PdfGenerationService pdfGenerationService;
    
    @Transactional
    public BookResponse generateBook(BookRequest request) {
        log.info("Generating book for: {} by {}", request.getName(), request.getGiver());
        
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
                .build();
        
        entity = bookRepository.save(entity);
        log.info("Book saved with ID: {}", entity.getId());
        
        pdfGenerationService.generatePdfAsync(entity.getId(), content, request.getName());
        
        return toResponse(entity);
    }
    
    public List<BookResponse> getAllBooks() {
        log.info("Retrieving all books");
        return bookRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    public BookResponse getBookById(Long id) {
        log.info("Retrieving book with ID: {}", id);
        BookEntity entity = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found with id: " + id));
        return toResponse(entity);
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
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

