package com.giftai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.giftai.entity.BookEntity;
import com.giftai.entity.UserEntity;
import com.giftai.model.BookResponse;
import com.giftai.model.CharacterInfo;
import com.giftai.model.UserProfileResponse;
import com.giftai.repository.BookRepository;
import com.giftai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    
    public UserProfileResponse getUserProfile(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        
        List<BookEntity> books = bookRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        List<BookResponse> bookResponses = books.stream()
                .map(this::toBookResponse)
                .collect(Collectors.toList());
        
        return UserProfileResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .createdAt(user.getCreatedAt())
                .totalBooks(books.size())
                .books(bookResponses)
                .build();
    }
    
    private BookResponse toBookResponse(BookEntity entity) {
        // Deserialize characters from JSON
        List<CharacterInfo> characters = new ArrayList<>();
        if (entity.getCharacters() != null && !entity.getCharacters().trim().isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                characters = objectMapper.readValue(entity.getCharacters(), new TypeReference<List<CharacterInfo>>() {});
            } catch (Exception e) {
                log.error("Error deserializing characters: {}", e.getMessage());
            }
        }
        
        return BookResponse.builder()
                .bookId(entity.getId())
                .name(entity.getName())
                .age(entity.getAge())
                .gender(entity.getGender())
                .theme(entity.getTheme())
                .tone(entity.getTone())
                .giver(entity.getGiver())
                .appearance(entity.getAppearance())
                .characters(characters.isEmpty() ? null : characters)
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

