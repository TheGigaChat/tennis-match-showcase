package com.tennismatch.backend.services;

import com.tennismatch.backend.repositories.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserActivityService {
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public void touchLastActive(Long userId, Duration minInterval) {
        Instant now = Instant.now();
        Instant threshold = now.minus(minInterval);
        userProfileRepository.touchLastActive(userId, now, threshold);
    }
}
