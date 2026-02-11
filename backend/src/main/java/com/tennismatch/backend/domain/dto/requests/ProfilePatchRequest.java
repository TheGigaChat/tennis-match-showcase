package com.tennismatch.backend.domain.dto.requests;

import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.domain.enums.SkillLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfilePatchRequest {
    @Size(max = 50)
    private String name;

    @Min(18) @Max(99)
    private Integer age;

    private UserProfile.Gender gender;

    private SkillLevel skillLevel;

    @Size(max = 200)
    private String description;

    @Size(max = 1000)
    private String photoUrl;

    // If you want to allow changing visibility:
    private Boolean visible;
}
