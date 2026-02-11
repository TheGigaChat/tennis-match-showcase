package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.configs.CacheConfig;
import com.tennismatch.backend.domain.dto.responses.MeProfileResponse;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.domain.dto.PhotoDto;
import com.tennismatch.backend.domain.enums.SkillLevel;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.PhotoService;
import com.tennismatch.backend.services.ProfileReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class ProfileReadServiceImpl implements ProfileReadService {

    private final UserProfileRepository repo;
    private final PhotoService photoService;

    @Override
    @Cacheable(cacheNames = CacheConfig.PROFILE_ME_CACHE, key = "#username", unless = "#result == null")
    @Transactional(readOnly = true)
    public MeProfileResponse readMe(String username) {
        UserProfile p = repo.findByEmail(username).orElse(null); // adjust for your identifier

        String photoUrl = photoService.getUserPhoto(username)
                .map(PhotoDto::getUrl)
                .filter(u -> u != null && !u.isBlank())
                .orElse(null);

        if (p == null) {
            return new MeProfileResponse(
                    "me",
                    "Me",
                    18,
                    null,
                    SkillLevel.BEGINNER,
                    "A passionate tennis lover looking for local players.",
                    photoUrl
            );
        }
        return new MeProfileResponse(
                String.valueOf(p.getId()),
                emptyToDefault(p.getName(), "Me"),
                p.getAge() != null ? p.getAge() : 18,
                p.getGender(),
                p.getSkillLevel() != null ? p.getSkillLevel() : SkillLevel.BEGINNER,
                emptyToDefault(p.getDescription(), "A passionate tennis lover looking for local players."),
                photoUrl
        );
    }

    @Override
    @CacheEvict(cacheNames = CacheConfig.PROFILE_ME_CACHE, key = "#username")
    public void evictMe(String username) {
        // call after profile/photo changes
    }

    private static String emptyToDefault(String v, String def) {
        return (v == null || v.isBlank()) ? def : v;
    }

}

