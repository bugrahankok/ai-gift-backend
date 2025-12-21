package com.giftai.config;

import com.giftai.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String requestPath = request.getRequestURI();
        
        // Only process API endpoints - skip everything else
        if (!requestPath.startsWith("/api/")) {
            return true; // Skip filter
        }
        
        // Skip auth endpoints (they don't need JWT validation)
        if (requestPath.startsWith("/api/auth/")) {
            return true;
        }
        
        return false; // Process this request
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        String token = getTokenFromRequest(request);
        
        if (token != null) {
            log.trace("🔑 Token found in request for path: {}", requestPath);
            try {
                if (tokenProvider.validateToken(token)) {
                    String email = tokenProvider.getEmailFromToken(token);
                    log.debug("✅ Token validated, email extracted: {}", email);
                    
                    userRepository.findByEmail(email).ifPresentOrElse(
                        user -> {
                            log.debug("✅ User found and authenticated: {} (ID: {})", email, user.getId());
                            UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(user, null, new ArrayList<>());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            log.trace("✅ Authentication set in SecurityContext for user ID: {} on path: {}", 
                                    user.getId(), requestPath);
                        },
                        () -> {
                            log.debug("⚠️ User not found for email: {} from token", email);
                        }
                    );
                } else {
                    // Invalid token - silently ignore (user might not be logged in)
                    log.trace("Token validation failed for path: {} - token may be expired or invalid", requestPath);
                }
            } catch (Exception e) {
                // Silently handle token validation errors - don't log as error for invalid tokens
                log.trace("Token processing error for path: {} - {}", requestPath, e.getMessage());
            }
        } else {
            log.trace("No token found in request for path: {}", requestPath);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        
        String cookieToken = getTokenFromCookie(request);
        if (cookieToken != null) {
            return cookieToken;
        }
        
        return null;
    }
    
    private String getTokenFromCookie(HttpServletRequest request) {
        jakarta.servlet.http.Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (jakarta.servlet.http.Cookie cookie : cookies) {
                if ("authToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}

