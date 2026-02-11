package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.responses.OnboardingStatusResponse;
import com.tennismatch.backend.domain.entries.OnboardingStatus;
import com.tennismatch.backend.domain.entries.UserProfile;

public interface OnboardingStatusService {
    OnboardingStatus getOrCreate(UserProfile user);

    void markNameCompleted(UserProfile user);
    void markAboutCompleted(UserProfile user);
    void markAgeCompleted(UserProfile user);
    void markGenderCompleted(UserProfile user);
    void markTennisLevelCompleted(UserProfile user);
    void markProfilePhotoCompleted(UserProfile user);
    void markPreferencesCompleted(UserProfile user);
    void markLocationCompleted(UserProfile user);

    OnboardingStatusResponse getStatusForUser(String email);

    void resetForUser(String email);

    void markStepCompleted(String email, String step);
}
