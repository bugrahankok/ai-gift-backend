package com.giftai.service;

import com.giftai.config.JwtTokenProvider;
import com.giftai.entity.UserEntity;
import com.giftai.model.AuthResponse;
import com.giftai.model.LoginRequest;
import com.giftai.model.RegisterRequest;
import com.giftai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        UserEntity user = UserEntity.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        
        user = userRepository.save(user);
        log.info("User registered: {}", user.getEmail());
        
        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getId())
                .isAdmin(user.getIsAdmin() != null ? user.getIsAdmin() : false)
                .message("Registration successful")
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        
        log.info("User logged in: {}", user.getEmail());
        
        String token = tokenProvider.generateToken(user.getEmail(), user.getId());
        
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .userId(user.getId())
                .isAdmin(user.getIsAdmin() != null ? user.getIsAdmin() : false)
                .message("Login successful")
                .build();
    }
}

