package com.tennismatch.backend.domain.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PreferenceDto {
    // All fields nullable: PATCH only sends what should change
    private String game;           // "TENNIS" | "PICKLEBALL"
    private String partnerGender;  // "MALE" | "FEMALE" | "ANY"
    private String sessionType;    // "MATCH" | "PRIVATE"
    private Integer maxDistanceKm; // > 0
}
