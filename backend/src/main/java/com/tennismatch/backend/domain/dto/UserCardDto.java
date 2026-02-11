package com.tennismatch.backend.domain.dto;

import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.domain.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCardDto {
    private Long userId;
    private String name;
    private Integer age;
    private UserProfile.Gender gender;
    private SkillLevel skillLevel;
    private double distanceMeters;
    private Double distanceKm;
    private String bio;
}
