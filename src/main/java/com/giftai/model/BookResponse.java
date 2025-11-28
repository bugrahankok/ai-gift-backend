package com.giftai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long bookId;
    private String name;
    private Integer age;
    private String theme;
    private String tone;
    private String giver;
    private String appearance;
    private String content;
    private String pdfPath;
    private Boolean pdfReady;
    private LocalDateTime createdAt;
}

