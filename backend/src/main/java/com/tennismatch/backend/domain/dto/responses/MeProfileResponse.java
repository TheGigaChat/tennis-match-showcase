package com.tennismatch.backend.domain.dto.responses;

import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.domain.enums.SkillLevel;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeProfileResponse {
    String id;
    String name;
    Integer age;
    UserProfile.Gender gender;
    SkillLevel skillLevel;
    String bio;
    String photo; // absolute or relative URL
}
