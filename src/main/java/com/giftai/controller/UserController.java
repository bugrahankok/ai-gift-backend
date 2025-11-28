package com.giftai.controller;

import com.giftai.entity.UserEntity;
import com.giftai.model.UserProfileResponse;
import com.giftai.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "User API", description = "API for user profile management")
public class UserController {
    
    private final UserService userService;
    
    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Retrieves the authenticated user's profile with their books")
    public ResponseEntity<UserProfileResponse> getUserProfile(Authentication authentication) {
        UserEntity user = (UserEntity) authentication.getPrincipal();
        UserProfileResponse profile = userService.getUserProfile(user.getId());
        return ResponseEntity.ok(profile);
    }
}

