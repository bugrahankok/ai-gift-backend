package com.giftai.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CharacterInfo {
    private String name;
    private String appearance;
    private String description;
    private String type; // Human, Animal, Object
}

