package com.giftai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(nullable = false)
    private Integer age;
    
    @Column(nullable = false, length = 200)
    private String theme;
    
    @Column(nullable = false, length = 200)
    private String tone;
    
    @Column(nullable = false, length = 200)
    private String giver;
    
    @Column(length = 500)
    private String appearance;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(length = 500)
    private String pdfPath;
    
    @Column(nullable = false)
    private Boolean pdfReady;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (pdfReady == null) {
            pdfReady = false;
        }
    }
}

