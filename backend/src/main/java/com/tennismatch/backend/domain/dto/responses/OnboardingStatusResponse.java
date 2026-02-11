package com.tennismatch.backend.domain.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingStatusResponse {
    private boolean isAuthenticated;
    private OnboardingStepsResponse steps;
    private String nextStep;
}
