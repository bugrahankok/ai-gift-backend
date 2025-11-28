package com.giftai.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotNull(message = "Age is required")
    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;
    
    @NotBlank(message = "Theme is required")
    private String theme;
    
    @NotBlank(message = "Tone is required")
    private String tone;
    
    @NotBlank(message = "Giver is required")
    private String giver;
    
    private String appearance;
    
    private Boolean isPublic;
}

