package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.domain.dto.PreferenceDto;
import com.tennismatch.backend.domain.entries.Preference;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.cache.CacheVersionService;
import com.tennismatch.backend.repositories.PreferenceRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.OnboardingStatusService;
import com.tennismatch.backend.services.PreferenceService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PreferenceServiceImpl implements PreferenceService {

    private final PreferenceRepository prefRepo;
    private final UserProfileRepository userRepo;
    private final OnboardingStatusService onboardingStatusService;
    private final CacheVersionService cacheVersionService;

    // ====================== by username (auth.getName()) ======================

    @Transactional
    @Override
    public PreferenceDto getForUser(String username) {
        UserProfile user = resolveUser(username);
        return prefRepo.findByUser(user).map(this::toDto).orElse(null);
    }

    @Transactional
    @Override
    public PreferenceDto upsertPatch(String username, PreferenceDto patch) {
        UserProfile user = resolveUser(username);
        Preference pref = prefRepo.findByUser(user).orElseGet(() ->
                Preference.builder()
                        .user(user)
                        .game(Preference.Game.TENNIS)
                        .partnerGender(Preference.PartnerGender.ANY)
                        .sessionType(Preference.SessionType.MATCH)
                        .maxDistanceKm(20)
                        .build()
        );
        applyPatch(pref, patch);
        Preference saved = prefRepo.save(pref);
        onboardingStatusService.markPreferencesCompleted(user);
        cacheVersionService.bumpDeckVersion(user.getId());
        return toDto(saved);
    }

    @Transactional
    @Override
    public void deleteForUser(String username) {
        UserProfile user = resolveUser(username);
        prefRepo.deleteByUser(user);
        cacheVersionService.bumpDeckVersion(user.getId());
    }

    // ====================== helpers ======================

    private UserProfile resolveUser(String username) {
        return userRepo.findByEmail(username)
                .orElseThrow(() -> new NoSuchElementException("Пользователь не найден: " + username));
    }

    private PreferenceDto toDto(Preference p) {
        PreferenceDto dto = new PreferenceDto();
        dto.setGame(p.getGame().name());
        dto.setPartnerGender(p.getPartnerGender().name());
        dto.setSessionType(p.getSessionType().name());
        dto.setMaxDistanceKm(p.getMaxDistanceKm());
        return dto;
    }

    private void applyPatch(Preference p, PreferenceDto patch) {
        if (patch == null) return;

        if (patch.getGame() != null) {
            p.setGame(Preference.Game.valueOf(patch.getGame()));
        }
        if (patch.getPartnerGender() != null) {
            p.setPartnerGender(Preference.PartnerGender.valueOf(patch.getPartnerGender()));
        }
        if (patch.getSessionType() != null) {
            p.setSessionType(Preference.SessionType.valueOf(patch.getSessionType()));
        }
        if (patch.getMaxDistanceKm() != null) {
            Integer v = patch.getMaxDistanceKm();
            if (v == null || v < 1) {
                throw new IllegalArgumentException("maxDistanceKm must be >= 1");
            }
            p.setMaxDistanceKm(v);
        }
    }
}
