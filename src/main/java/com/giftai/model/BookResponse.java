package com.giftai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private Long bookId;
    private String name;
    private Integer age;
    private String gender;
    private String theme;
    private String tone;
    private String giver;
    private String appearance;
    private List<CharacterInfo> characters;
    private String content;
    private String pdfPath;
    private Boolean pdfReady;
    private Boolean isPublic;
    private String authorName;
    private Long viewCount;
    private Long downloadCount;
    private LocalDateTime createdAt;
}

