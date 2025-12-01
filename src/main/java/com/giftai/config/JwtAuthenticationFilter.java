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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String token = getTokenFromRequest(request);
        
        if (token != null) {
            log.info("🔑 Token found in request for path: {}", request.getRequestURI());
            try {
                if (tokenProvider.validateToken(token)) {
                    String email = tokenProvider.getEmailFromToken(token);
                    log.info("✅ Token validated, email extracted: {}", email);
                    
                    userRepository.findByEmail(email).ifPresentOrElse(
                        user -> {
                            log.info("✅ User found and authenticated: {} (ID: {})", email, user.getId());
                            UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(user, null, new ArrayList<>());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            log.info("✅ Authentication set in SecurityContext for user ID: {} on path: {}", 
                                    user.getId(), request.getRequestURI());
                        },
                        () -> {
                            log.warn("⚠️ User not found for email: {} from token", email);
                        }
                    );
                } else {
                    log.warn("❌ Token validation failed for path: {} - token may be expired or invalid", request.getRequestURI());
                }
            } catch (Exception e) {
                log.error("❌ Error processing token for path: {}", request.getRequestURI(), e);
            }
        } else {
            log.debug("No token found in request for path: {} - Authorization header: {}", 
                    request.getRequestURI(), request.getHeader("Authorization"));
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

