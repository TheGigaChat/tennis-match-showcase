package com.tennismatch.backend.domain.dto.responses;


import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.domain.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileResponse {
    private String email;                 // read-only
    private String name;
    private Integer age;
    private UserProfile.Gender gender;
    private SkillLevel skillLevel;
    private String description;
    private String phone;
    private Boolean visible;
}
