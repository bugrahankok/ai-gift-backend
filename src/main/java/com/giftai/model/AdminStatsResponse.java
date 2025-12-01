package com.giftai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private Long totalUsers;
    private Long totalBooks;
    private Long publicBooks;
    private Long privateBooks;
    private Long totalViews;
    private Long totalDownloads;
    private Map<String, Long> booksByTheme;
    private Map<String, Long> booksByLanguage;
    private Map<String, Long> booksByTone;
    private Map<String, Long> booksCreatedByDay;
    private Map<String, Long> usersCreatedByDay;
}

