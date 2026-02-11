package com.tennismatch.backend.domain.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStepsResponse {
    private boolean name;
    private boolean about;
    private boolean age;
    private boolean gender;
    private boolean tennisLevel;
    private boolean profilePhoto;
    private boolean preferences;
    private boolean location;
}
