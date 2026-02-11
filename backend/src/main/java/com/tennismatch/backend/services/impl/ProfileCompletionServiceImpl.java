package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.configs.CacheConfig;
import com.tennismatch.backend.cache.CacheVersionService;
import com.tennismatch.backend.domain.dto.requests.ProfilePatchRequest;
import com.tennismatch.backend.domain.dto.responses.ProfileResponse;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.OnboardingStatusService;
import com.tennismatch.backend.services.PhotoService;
import com.tennismatch.backend.services.ProfileCompletionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProfileCompletionServiceImpl implements ProfileCompletionService {
    private final UserProfileRepository userRepo;
    private final PhotoService photoService;
    private final OnboardingStatusService onboardingStatusService;
    private final CacheVersionService cacheVersionService;

    @Transactional
    @Override
    public ProfileResponse getProfile(String email) {
        var u = userRepo.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return ProfileResponse.builder()
                .email(u.getEmail())
                .name(u.getName())
                .age(u.getAge())
                .gender(u.getGender())
                .skillLevel(u.getSkillLevel())
                .description(u.getDescription())
                .visible(u.getVisible())
                .build();
    }

    @Transactional
    @Override
    @CacheEvict(cacheNames = CacheConfig.PROFILE_ME_CACHE, key = "#username")
    public void patchProfile(String username, ProfilePatchRequest req) {
        var u = userRepo.findByEmail(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean deckParamsChanged = false;

        if (req.getName() != null) {
            u.setName(req.getName());
            onboardingStatusService.markNameCompleted(u);
        }
        if (req.getAge() != null) {
            u.setAge(req.getAge());
            onboardingStatusService.markAgeCompleted(u);
        }
        if (req.getGender() != null) {
            u.setGender(req.getGender());
            onboardingStatusService.markGenderCompleted(u);
            deckParamsChanged = true;
        }
        if (req.getSkillLevel() != null) {
            u.setSkillLevel(req.getSkillLevel());
            onboardingStatusService.markTennisLevelCompleted(u);
            deckParamsChanged = true;
        }
        if (req.getDescription() != null) {
            u.setDescription(req.getDescription());
            onboardingStatusService.markAboutCompleted(u);
        }
        if (req.getPhotoUrl() != null) {
            photoService.setUserPhotoUrl(username, req.getPhotoUrl());
            onboardingStatusService.markProfilePhotoCompleted(u);
        }
        if (req.getVisible() != null) {
            u.setVisible(req.getVisible());
        }

        if (deckParamsChanged) {
            cacheVersionService.bumpDeckVersion(u.getId());
        }

        // JPA dirty checking will persist changes when exiting @Transactional
    }
}


