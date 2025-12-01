package com.giftai.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookUpdateRequest {
    private String name;
    private Integer age;
    private String gender;
    private String language;
    private String theme;
    private String mainTopic;
    private String tone;
    private String giver;
    private String appearance;
    private List<CharacterInfo> characters;
    private Boolean isPublic;
}

