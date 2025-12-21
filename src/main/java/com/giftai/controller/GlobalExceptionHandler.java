package com.giftai.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        // Log full error for debugging (server-side only)
        log.error("Internal server error occurred", e);
        
        // Return user-friendly message (don't expose internal details)
        Map<String, String> error = new HashMap<>();
        error.put("error", "An unexpected error occurred. Please try again later.");
        error.put("message", "We're sorry, but something went wrong. Our team has been notified.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage != null ? errorMessage : "Invalid value");
        });
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Validation failed");
        response.put("message", "Please check your input and try again");
        response.put("errors", errors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        log.error("Runtime error occurred", e);
        
        // Check if it's a known business exception with user-friendly message
        String message = e.getMessage();
        if (message != null && (message.contains("not found") || 
                                message.contains("unauthorized") || 
                                message.contains("invalid"))) {
            Map<String, String> error = new HashMap<>();
            error.put("error", message);
            error.put("message", message);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        
        // Generic error for unknown runtime exceptions
        Map<String, String> error = new HashMap<>();
        error.put("error", "An error occurred while processing your request");
        error.put("message", "Please try again or contact support if the problem persists");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("Invalid argument: {}", e.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid request");
        error.put("message", e.getMessage() != null ? e.getMessage() : "Please check your input and try again");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}

