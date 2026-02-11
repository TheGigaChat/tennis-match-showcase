package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.domain.entries.RefreshToken;
import com.tennismatch.backend.repositories.RefreshTokenRepository;
import com.tennismatch.backend.services.RefreshTokenService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenServiceImpl.class);
    private static final int TOKEN_BYTES = 32;
    private static final String DEV_PEPPER = "dev-refresh-pepper";

    private final RefreshTokenRepository repository;
    private final Clock clock;

    @Value("${app.refresh.days:7}")
    private long refreshDays;

    @Value("${app.refresh.pepper:}")
    private String pepper;

    @Value("${localhost.boolean:false}")
    private boolean localhostIsActive;

    private final SecureRandom random = new SecureRandom();

    @PostConstruct
    void validatePepper() {
        if (StringUtils.hasText(pepper)) {
            return;
        }
        if (localhostIsActive) {
            pepper = DEV_PEPPER;
            log.warn("app.refresh.pepper is not set; using a dev-only default.");
            return;
        }
        throw new IllegalStateException("app.refresh.pepper must be set for refresh tokens");
    }

    @Override
    public String issueToken(Long userId) {
        String tokenPlaintext = generateToken();
        Instant now = Instant.now(clock);

        RefreshToken token = RefreshToken.builder()
                .userId(userId)
                .tokenHash(hashToken(tokenPlaintext))
                .createdAt(now)
                .expiresAt(now.plus(Duration.ofDays(refreshDays)))
                .build();

        repository.save(token);
        return tokenPlaintext;
    }

    @Override
    @Transactional
    public RefreshRotation rotate(String tokenPlaintext) {
        String tokenHash = hashToken(tokenPlaintext);
        RefreshToken existing = repository.findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> unauthorized("Refresh token invalid"));

        Instant now = Instant.now(clock);
        if (existing.getRevokedAt() != null) {
            log.info("Refresh token rejected: revoked userId={}", existing.getUserId());
            throw unauthorized("Refresh token invalid");
        }
        if (!existing.getExpiresAt().isAfter(now)) {
            log.info("Refresh token rejected: expired userId={}", existing.getUserId());
            throw unauthorized("Refresh token expired");
        }

        existing.setLastUsedAt(now);
        existing.setRevokedAt(now);

        String replacementPlaintext = generateToken();
        RefreshToken replacement = RefreshToken.builder()
                .userId(existing.getUserId())
                .tokenHash(hashToken(replacementPlaintext))
                .createdAt(now)
                .expiresAt(now.plus(Duration.ofDays(refreshDays)))
                .build();

        repository.save(replacement);
        existing.setReplacedById(replacement.getId());

        log.info("Refresh token rotated userId={}", existing.getUserId());
        return new RefreshRotation(existing.getUserId(), replacementPlaintext);
    }

    @Override
    @Transactional
    public void revoke(String tokenPlaintext) {
        if (!StringUtils.hasText(tokenPlaintext)) return;

        repository.findByTokenHashForUpdate(hashToken(tokenPlaintext))
                .ifPresent(token -> {
                    if (token.getRevokedAt() == null) {
                        token.setRevokedAt(Instant.now(clock));
                        token.setLastUsedAt(Instant.now(clock));
                        log.info("Refresh token revoked userId={}", token.getUserId());
                    }
                });
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String tokenPlaintext) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(tokenPlaintext.getBytes(StandardCharsets.UTF_8));
            digest.update(pepper.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private ResponseStatusException unauthorized(String message) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, message);
    }
}
