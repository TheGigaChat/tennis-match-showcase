package com.tennismatch.backend.services;

import com.tennismatch.backend.repositories.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.refresh.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class RefreshTokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanupScheduler.class);

    private final RefreshTokenRepository repository;
    private final Clock clock;

    @Value("${app.refresh.cleanup.retention-days:30}")
    private long retentionDays;

    @Scheduled(cron = "${app.refresh.cleanup.cron:0 0 4 * * *}")
    @Transactional
    public void cleanup() {
        Instant now = Instant.now(clock);
        int expired = repository.deleteExpired(now);
        Instant cutoff = now.minus(Duration.ofDays(retentionDays));
        int revoked = repository.deleteRevokedBefore(cutoff);
        log.info("Refresh token cleanup: expiredDeleted={}, revokedDeleted={}, retentionDays={}",
                expired, revoked, retentionDays);
    }
}
