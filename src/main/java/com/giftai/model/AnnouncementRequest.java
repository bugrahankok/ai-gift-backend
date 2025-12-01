package com.giftai.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementRequest {
    @NotBlank(message = "Type is required")
    private String type; // "bar" or "popup"
    
    @NotBlank(message = "Message is required")
    private String message;
    
    private String icon;
    
    @NotNull(message = "isActive is required")
    private Boolean isActive;
}

