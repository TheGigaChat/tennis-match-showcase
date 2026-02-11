package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.domain.dto.responses.OnboardingStatusResponse;
import com.tennismatch.backend.domain.dto.responses.OnboardingStepsResponse;
import com.tennismatch.backend.domain.entries.OnboardingStatus;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.repositories.OnboardingStatusRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.OnboardingStatusService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class OnboardingStatusServiceImpl implements OnboardingStatusService {
    private final OnboardingStatusRepository statusRepo;
    private final UserProfileRepository userRepo;

    @Transactional
    @Override
    public OnboardingStatus getOrCreate(UserProfile user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User is required to resolve onboarding status");
        }
        return statusRepo.findById(user.getId())
                .orElseGet(() -> statusRepo.save(OnboardingStatus.builder().user(user).build()));
    }

    @Transactional
    @Override
    public void markNameCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setNameCompleted(true);
    }

    @Transactional
    @Override
    public void markAboutCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setAboutCompleted(true);
    }

    @Transactional
    @Override
    public void markAgeCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setAgeCompleted(true);
    }

    @Transactional
    @Override
    public void markGenderCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setGenderCompleted(true);
    }

    @Transactional
    @Override
    public void markTennisLevelCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setTennisLevelCompleted(true);
    }

    @Transactional
    @Override
    public void markProfilePhotoCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setProfilePhotoCompleted(true);
    }

    @Transactional
    @Override
    public void markPreferencesCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setPreferencesCompleted(true);
    }

    @Transactional
    @Override
    public void markLocationCompleted(UserProfile user) {
        OnboardingStatus status = getOrCreate(user);
        status.setLocationCompleted(true);
    }

    @Transactional
    @Override
    public OnboardingStatusResponse getStatusForUser(String email) {
        UserProfile user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        OnboardingStatus status = getOrCreate(user);

        OnboardingStepsResponse steps = new OnboardingStepsResponse(
                truthy(status.getNameCompleted()),
                truthy(status.getAboutCompleted()),
                truthy(status.getAgeCompleted()),
                truthy(status.getGenderCompleted()),
                truthy(status.getTennisLevelCompleted()),
                truthy(status.getProfilePhotoCompleted()),
                truthy(status.getPreferencesCompleted()),
                truthy(status.getLocationCompleted())
        );

        return new OnboardingStatusResponse(true, steps, resolveNextStep(steps));
    }

    @Transactional
    @Override
    public void resetForUser(String email) {
        UserProfile user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        OnboardingStatus status = getOrCreate(user);
        status.setNameCompleted(false);
        status.setAboutCompleted(false);
        status.setAgeCompleted(false);
        status.setGenderCompleted(false);
        status.setTennisLevelCompleted(false);
        status.setProfilePhotoCompleted(false);
        status.setPreferencesCompleted(false);
        status.setLocationCompleted(false);
    }

    @Transactional
    @Override
    public void markStepCompleted(String email, String step) {
        UserProfile user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        OnboardingStatus status = getOrCreate(user);
        String key = step == null ? "" : step.trim().toLowerCase();
        switch (key) {
            case "name":
                status.setNameCompleted(true);
                break;
            case "about":
                status.setAboutCompleted(true);
                break;
            case "age":
                status.setAgeCompleted(true);
                break;
            case "gender":
                status.setGenderCompleted(true);
                break;
            case "tennislevel":
                status.setTennisLevelCompleted(true);
                break;
            case "profilephoto":
                status.setProfilePhotoCompleted(true);
                break;
            case "preferences":
                status.setPreferencesCompleted(true);
                break;
            case "location":
                status.setLocationCompleted(true);
                break;
            default:
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown onboarding step");
        }
    }

    private boolean truthy(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private String resolveNextStep(OnboardingStepsResponse steps) {
        if (!steps.isName()) return "name";
        if (!steps.isAbout()) return "about";
        if (!steps.isAge()) return "age";
        if (!steps.isGender()) return "gender";
        if (!steps.isTennisLevel()) return "tennisLevel";
        if (!steps.isProfilePhoto()) return "profilePhoto";
        if (!steps.isPreferences()) return "preferences";
        if (!steps.isLocation()) return "location";
        return "complete";
    }
}
