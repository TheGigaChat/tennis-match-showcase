package com.tennismatch.backend.chat.services;

import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import com.tennismatch.backend.chat.repositories.ConversationRepository;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@RequiredArgsConstructor
@Component
public class ChatMaintenanceScheduler {

    private static final Logger log = LoggerFactory.getLogger(ChatMaintenanceScheduler.class);

    private final ConversationRepository conversationRepo;
    private final Clock clock;

    @Value("${app.chat.maintenance.enabled:true}")
    private boolean maintenanceEnabled;

    @Value("${app.chat.maintenance.expire.enabled:true}")
    private boolean expireEnabled;

    @Value("${app.chat.maintenance.archive.enabled:true}")
    private boolean archiveEnabled;

    @Value("${app.chat.maintenance.purge.enabled:false}")
    private boolean purgeEnabled;

    @PostConstruct
    void logConfig() {
        log.info("Chat maintenance enabled: global={}, expire={}, archive={}, purge={}",
                maintenanceEnabled, expireEnabled, archiveEnabled, purgeEnabled);
    }

    @Transactional
    @Scheduled(fixedDelayString = "PT15M")
    public void expire() {
        if (!maintenanceEnabled || !expireEnabled) return;
        Instant now = Instant.now(clock);
        conversationRepo.expireOverdue(
                now,
                ConversationStatus.ACTIVE,
                ConversationStatus.EXPIRED
        );
    }

    @Transactional
    @Scheduled(cron = "0 7 3 * * *")
    public void archive() {
        if (!maintenanceEnabled || !archiveEnabled) return;
        Instant now = Instant.now(clock);
        Instant threshold = now.minus(7, ChronoUnit.DAYS);
        conversationRepo.archiveExpired(
                threshold,
                now,
                ConversationStatus.EXPIRED,
                ConversationStatus.ARCHIVED
        );
    }

    @Transactional
    @Scheduled(cron = "0 17 3 * * *")
    public void purge() {
        if (!maintenanceEnabled || !purgeEnabled) return;
        Instant threshold = Instant.now(clock).minus(30, ChronoUnit.DAYS);
        int deleted = conversationRepo.purgeArchived(
                threshold,
                ConversationStatus.ARCHIVED
        );
        log.info("Chat maintenance purge deleted={}", deleted);
    }
}
