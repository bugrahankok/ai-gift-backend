package com.giftai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giftai.entity.BookEntity;
import com.giftai.entity.UserEntity;
import com.giftai.model.AdminStatsResponse;
import com.giftai.model.BookResponse;
import com.giftai.model.CharacterInfo;
import com.giftai.model.UserProfileResponse;
import com.giftai.repository.BookRepository;
import com.giftai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {
    
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    
    public List<UserProfileResponse> getAllUsers() {
        List<UserEntity> users = userRepository.findAll();
        return users.stream()
                .map(user -> {
                    List<BookEntity> books = bookRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
                    return UserProfileResponse.builder()
                            .userId(user.getId())
                            .email(user.getEmail())
                            .name(user.getName())
                            .createdAt(user.getCreatedAt())
                            .totalBooks(books.size())
                            .isAdmin(user.getIsAdmin())
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    public List<BookResponse> getAllBooks() {
        List<BookEntity> books = bookRepository.findAllByOrderByCreatedAtDesc();
        return books.stream()
                .map(userService::toBookResponse)
                .collect(Collectors.toList());
    }
    
    public AdminStatsResponse getStatistics() {
        List<UserEntity> allUsers = userRepository.findAll();
        List<BookEntity> allBooks = bookRepository.findAll();
        
        long totalUsers = allUsers.size();
        long totalBooks = allBooks.size();
        long publicBooks = allBooks.stream().filter(BookEntity::getIsPublic).count();
        long privateBooks = totalBooks - publicBooks;
        
        long totalViews = allBooks.stream()
                .mapToLong(book -> book.getViewCount() != null ? book.getViewCount() : 0L)
                .sum();
        
        long totalDownloads = allBooks.stream()
                .mapToLong(book -> book.getDownloadCount() != null ? book.getDownloadCount() : 0L)
                .sum();
        
        // Books by theme
        Map<String, Long> booksByTheme = allBooks.stream()
                .collect(Collectors.groupingBy(
                        book -> book.getTheme() != null ? book.getTheme() : "Unknown",
                        Collectors.counting()
                ));
        
        // Books by language
        Map<String, Long> booksByLanguage = allBooks.stream()
                .filter(book -> book.getLanguage() != null && !book.getLanguage().isEmpty())
                .collect(Collectors.groupingBy(
                        BookEntity::getLanguage,
                        Collectors.counting()
                ));
        
        // Books by tone
        Map<String, Long> booksByTone = allBooks.stream()
                .collect(Collectors.groupingBy(
                        book -> book.getTone() != null ? book.getTone() : "Unknown",
                        Collectors.counting()
                ));
        
        // Books created by day (last 30 days)
        Map<String, Long> booksCreatedByDay = allBooks.stream()
                .filter(book -> book.getCreatedAt() != null)
                .filter(book -> book.getCreatedAt().toLocalDate().isAfter(LocalDate.now().minusDays(30)))
                .collect(Collectors.groupingBy(
                        book -> book.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        Collectors.counting()
                ));
        
        // Users created by day (last 30 days)
        Map<String, Long> usersCreatedByDay = allUsers.stream()
                .filter(user -> user.getCreatedAt() != null)
                .filter(user -> user.getCreatedAt().toLocalDate().isAfter(LocalDate.now().minusDays(30)))
                .collect(Collectors.groupingBy(
                        user -> user.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
                        Collectors.counting()
                ));
        
        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalBooks(totalBooks)
                .publicBooks(publicBooks)
                .privateBooks(privateBooks)
                .totalViews(totalViews)
                .totalDownloads(totalDownloads)
                .booksByTheme(booksByTheme)
                .booksByLanguage(booksByLanguage)
                .booksByTone(booksByTone)
                .booksCreatedByDay(booksCreatedByDay)
                .usersCreatedByDay(usersCreatedByDay)
                .build();
    }
    
    public void deleteUser(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
        log.info("User deleted: {}", user.getEmail());
    }
    
    public UserProfileResponse updateUser(Long userId, String name, String email, String password, Boolean isAdmin) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name);
        }
        if (email != null && !email.trim().isEmpty()) {
            // Check if email already exists for another user
            userRepository.findByEmail(email).ifPresent(existingUser -> {
                if (!existingUser.getId().equals(userId)) {
                    throw new RuntimeException("Email already exists");
                }
            });
            user.setEmail(email);
        }
        if (password != null && !password.trim().isEmpty()) {
            if (password.length() < 6) {
                throw new RuntimeException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(password));
            log.info("Password updated for user: {}", user.getEmail());
        }
        if (isAdmin != null) {
            user.setIsAdmin(isAdmin);
        }
        
        user = userRepository.save(user);
        log.info("User updated: {}", user.getEmail());
        
        List<BookEntity> books = bookRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return UserProfileResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .createdAt(user.getCreatedAt())
                .totalBooks(books.size())
                .isAdmin(user.getIsAdmin())
                .build();
    }
    
    public void deleteBook(Long bookId) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        bookRepository.delete(book);
        log.info("Book deleted: {}", book.getId());
    }
    
    public BookResponse updateBook(Long bookId, String name, Integer age, String gender, 
                                   String language, String theme, String mainTopic, 
                                   String tone, String giver, String appearance, 
                                   List<CharacterInfo> characters, Boolean isPublic) {
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));
        
        if (name != null && !name.trim().isEmpty()) {
            book.setName(name);
        }
        if (age != null) {
            book.setAge(age);
        }
        if (gender != null) {
            book.setGender(gender);
        }
        if (language != null) {
            book.setLanguage(language);
        }
        if (theme != null && !theme.trim().isEmpty()) {
            book.setTheme(theme);
        }
        if (mainTopic != null) {
            book.setMainTopic(mainTopic);
        }
        if (tone != null && !tone.trim().isEmpty()) {
            book.setTone(tone);
        }
        if (giver != null && !giver.trim().isEmpty()) {
            book.setGiver(giver);
        }
        if (appearance != null) {
            book.setAppearance(appearance);
        }
        if (characters != null) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                book.setCharacters(objectMapper.writeValueAsString(characters));
            } catch (Exception e) {
                log.error("Error serializing characters: {}", e.getMessage());
            }
        }
        if (isPublic != null) {
            book.setIsPublic(isPublic);
        }
        
        book = bookRepository.save(book);
        log.info("Book updated: {}", book.getId());
        
        return userService.toBookResponse(book);
    }
    
}

