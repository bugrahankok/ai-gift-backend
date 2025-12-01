package com.giftai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.giftai.entity.BookEntity;
import com.giftai.entity.UserEntity;
import com.giftai.model.BookRequest;
import com.giftai.model.BookResponse;
import com.giftai.model.CharacterInfo;
import com.giftai.provider.BookProvider;
import com.giftai.repository.BookRepository;
import com.giftai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Transactional
    public BookResponse generateBook(BookRequest request, Long userId) {
        log.info("Generating book for: {} by {} for user: {}", request.getName(), request.getGiver(), userId);
        
        // CRITICAL: Load user entity to ensure it's available for authorId
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        log.info("User loaded - ID: {}, Email: {}, Name: {}", user.getId(), user.getEmail(), user.getName());
        
        String content = bookProvider.generateBook(request);
        
        // Serialize characters to JSON
        String charactersJson = null;
        if (request.getCharacters() != null && !request.getCharacters().isEmpty()) {
            try {
                charactersJson = objectMapper.writeValueAsString(request.getCharacters());
            } catch (Exception e) {
                log.error("Error serializing characters: {}", e.getMessage());
            }
        }
        
        BookEntity entity = BookEntity.builder()
                .name(request.getName())
                .age(request.getAge())
                .gender(request.getGender())
                .language(request.getLanguage())
                .theme(request.getTheme())
                .mainTopic(request.getMainTopic())
                .tone(request.getTone())
                .giver(request.getGiver())
                .appearance(request.getAppearance())
                .characters(charactersJson)
                .content(content)
                .pdfReady(false)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .user(user) // CRITICAL: Set user entity - this will be used for authorId
                .build();
        
        entity = bookRepository.save(entity);
        
        // Verify user is set correctly
        if (entity.getUser() == null) {
            log.error("CRITICAL ERROR: User is null after save for book ID: {}", entity.getId());
        } else {
            log.info("✅ Book saved with ID: {} for user: {} (authorId will be: {})", 
                    entity.getId(), userId, entity.getUser().getId());
        }
        
        pdfGenerationService.generatePdfAsync(entity.getId(), content, request.getName(), 
                request.getLanguage() != null ? request.getLanguage() : "English");
        
        BookResponse response = toResponse(entity);
        
        // Double-check authorId is set
        if (response.getAuthorId() == null) {
            log.error("CRITICAL ERROR: AuthorId is null in response for book ID: {}", entity.getId());
            // Rebuild response with authorId
            response = BookResponse.builder()
                    .bookId(response.getBookId())
                    .name(response.getName())
                    .age(response.getAge())
                    .gender(response.getGender())
                    .language(response.getLanguage())
                    .theme(response.getTheme())
                    .mainTopic(response.getMainTopic())
                    .tone(response.getTone())
                    .giver(response.getGiver())
                    .appearance(response.getAppearance())
                    .characters(response.getCharacters())
                    .content(response.getContent())
                    .pdfPath(response.getPdfPath())
                    .pdfReady(response.getPdfReady())
                    .isPublic(response.getIsPublic())
                    .authorName(user.getName())
                    .authorId(user.getId()) // CRITICAL: Set authorId from user
                    .viewCount(response.getViewCount())
                    .downloadCount(response.getDownloadCount())
                    .createdAt(response.getCreatedAt())
                    .build();
            log.info("✅ AuthorId manually set to: {} for book ID: {}", user.getId(), entity.getId());
        }
        
        return response;
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
        
        // Force load user to avoid lazy loading issues
        if (entity.getUser() != null) {
            Long userId = entity.getUser().getId();
            log.debug("Book {} belongs to user {}", id, userId);
        } else {
            log.warn("Book {} has no user assigned!", id);
        }
        
        BookResponse response = toResponse(entity);
        
        // Ensure authorId is set correctly - CRITICAL for access control
        if (response.getAuthorId() == null) {
            if (entity.getUser() != null) {
                log.warn("AuthorId was null for book {}, setting it from entity user {}", id, entity.getUser().getId());
                response = BookResponse.builder()
                        .bookId(response.getBookId())
                        .name(response.getName())
                        .age(response.getAge())
                        .gender(response.getGender())
                        .language(response.getLanguage())
                        .theme(response.getTheme())
                        .mainTopic(response.getMainTopic())
                        .tone(response.getTone())
                        .giver(response.getGiver())
                        .appearance(response.getAppearance())
                        .characters(response.getCharacters())
                        .content(response.getContent())
                        .pdfPath(response.getPdfPath())
                        .pdfReady(response.getPdfReady())
                        .isPublic(response.getIsPublic())
                        .authorName(response.getAuthorName())
                        .authorId(entity.getUser().getId())
                        .viewCount(response.getViewCount())
                        .downloadCount(response.getDownloadCount())
                        .createdAt(response.getCreatedAt())
                        .build();
            } else {
                log.error("CRITICAL: Book {} has no user and no authorId!", id);
            }
        }
        
        log.debug("Book {} response - AuthorId: {}, IsPublic: {}", id, response.getAuthorId(), response.getIsPublic());
        return response;
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
        // Deserialize characters from JSON
        List<CharacterInfo> characters = new ArrayList<>();
        if (entity.getCharacters() != null && !entity.getCharacters().trim().isEmpty()) {
            try {
                characters = objectMapper.readValue(entity.getCharacters(), new TypeReference<List<CharacterInfo>>() {});
            } catch (Exception e) {
                log.error("Error deserializing characters: {}", e.getMessage());
            }
        }
        
        // CRITICAL: Get authorId from user entity
        Long authorId = null;
        String authorName = null;
        
        if (entity.getUser() != null) {
            authorId = entity.getUser().getId();
            authorName = entity.getUser().getName();
            log.debug("Book {} - AuthorId: {}, AuthorName: {}", entity.getId(), authorId, authorName);
        } else {
            log.warn("⚠️ Book {} has no user entity! AuthorId will be null!", entity.getId());
        }
        
        return BookResponse.builder()
                .bookId(entity.getId())
                .name(entity.getName())
                .age(entity.getAge())
                .gender(entity.getGender())
                .language(entity.getLanguage())
                .theme(entity.getTheme())
                .mainTopic(entity.getMainTopic())
                .tone(entity.getTone())
                .giver(entity.getGiver())
                .appearance(entity.getAppearance())
                .characters(characters.isEmpty() ? null : characters)
                .content(entity.getContent())
                .pdfPath(entity.getPdfPath())
                .pdfReady(entity.getPdfReady())
                .isPublic(entity.getIsPublic())
                .authorName(authorName)
                .authorId(authorId) // CRITICAL: This must be set for access control
                .viewCount(entity.getViewCount() != null ? entity.getViewCount() : 0L)
                .downloadCount(entity.getDownloadCount() != null ? entity.getDownloadCount() : 0L)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

