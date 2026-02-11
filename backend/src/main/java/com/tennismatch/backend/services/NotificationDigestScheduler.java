package com.tennismatch.backend.services;

import com.tennismatch.backend.chat.repositories.MessageRepository;
import com.tennismatch.backend.domain.entries.NotificationDigestState;
import com.tennismatch.backend.domain.enums.NotificationDigestType;
import com.tennismatch.backend.repositories.MatchRepository;
import com.tennismatch.backend.repositories.NotificationDigestStateRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationDigestScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationDigestScheduler.class);
    private static final ZoneId SAN_DIEGO_TZ = ZoneId.of("America/Los_Angeles");

    private final UserProfileRepository userProfileRepository;
    private final NotificationDigestStateRepository digestStateRepository;
    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final EmailSender emailSender;
    private final Clock clock;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.notifications.daily.enabled:false}")
    private boolean dailyEnabled;

    @Value("${app.notifications.weekly.enabled:false}")
    private boolean weeklyEnabled;

    @Value("${app.notifications.max-per-run:500}")
    private int maxPerRun;

    // Dev option: uncomment to send every minute.
    // Make sure the backend is running.
    // Make sure you have unread messages in the DB for a user.
    // Make sure that user’s last_active_at is within 14 days.
    // Wait for 9:00 AM LA time.
//    @Scheduled(cron = "0 * * * * *", zone = "America/Los_Angeles")
    @Scheduled(
            cron = "${app.notifications.daily.cron:0 0 9 * * *}",
            zone = "${app.notifications.zone:America/Los_Angeles}"
    )
    public void sendDailyUnreadDigest() {
        if (!dailyEnabled) {
            log.info("Daily unread digest: disabled by config");
            return;
        }
        Instant runStart = Instant.now(clock);
        Instant now = Instant.now(clock);
        Instant activeCutoff = now.minus(Duration.ofDays(14));
        var users = userProfileRepository.findActiveUsersSince(activeCutoff);
        if (users.isEmpty()) {
            log.info("Daily unread digest: no active users");
            return;
        }

        Instant dayStart = ZonedDateTime.ofInstant(now, SAN_DIEGO_TZ)
                .toLocalDate()
                .atStartOfDay(SAN_DIEGO_TZ)
                .toInstant();
        String ctaUrl = frontendUrl + "/messages";

        int sentCount = 0;
        int failedCount = 0;
        int skippedCount = 0;
        boolean capReached = false;
        for (var user : users) {
            if (sentCount >= maxPerRun) {
                log.warn("Daily unread digest: cap reached (maxPerRun={})", maxPerRun);
                capReached = true;
                break;
            }
            Long userId = user.getId();
            String email = user.getEmail();
            try {
                NotificationDigestState state = digestStateRepository
                        .findByUserIdAndType(userId, NotificationDigestType.UNREAD_DAILY)
                        .orElse(null);

                if (state != null && state.getLastSentAt() != null && !state.getLastSentAt().isBefore(dayStart)) {
                    continue;
                }

                Instant since = state != null && state.getLastWindowEnd() != null
                        ? state.getLastWindowEnd()
                        : Instant.EPOCH;

                long unreadCount = messageRepository.countUnreadForUserSince(userId, since);
                if (unreadCount <= 0) {
                    saveState(state, userId, NotificationDigestType.UNREAD_DAILY, null, false, since, now, null);
                    skippedCount++;
                    continue;
                }

                long senderCount = messageRepository.countUnreadSendersForUserSince(userId, since);
                List<String> senderNames = List.of();
                if (senderCount > 0 && senderCount < 4) {
                    var senderIds = messageRepository.findUnreadSenderIdsForUserSince(
                            userId, since, PageRequest.of(0, 3));
                    if (!senderIds.isEmpty()) {
                        Map<Long, String> nameMap = userProfileRepository.findNamesByIds(senderIds).stream()
                                .collect(Collectors.toMap(UserProfileRepository.IdNameRow::getId,
                                        UserProfileRepository.IdNameRow::getName));
                        senderNames = senderIds.stream()
                                .map(nameMap::get)
                                .filter(name -> name != null && !name.isBlank())
                                .toList();
                    }
                }

                String message = buildUnreadMessage(unreadCount, senderCount, senderNames);
                emailSender.sendNotificationEmail(
                        email,
                        "You have unread messages",
                        "Unread messages",
                        message,
                        ctaUrl
                );

                String meta = buildUnreadMeta(unreadCount, senderCount, senderNames);
                saveState(state, userId, NotificationDigestType.UNREAD_DAILY, now, true, since, now, meta);
                sentCount++;
            } catch (RuntimeException ex) {
                failedCount++;
                log.warn("Daily unread digest failed: userId={} email={} message={}",
                        userId, email, ex.getMessage());
            }
        }

        long durationMs = Duration.between(runStart, Instant.now(clock)).toMillis();
        log.info("Daily unread digest: durationMs={} scanned={} sent={} failed={} skipped={} capReached={}",
                durationMs, users.size(), sentCount, failedCount, skippedCount, capReached);
    }

    // Dev option: uncomment to send every minute.
    // Backend must be running at the scheduled time (Mon 9:00 AM LA).
    // User must be active within the last 14 days (last_active_at >= now - 14 days).
    // User must have new matches since week start
    // It won’t send if it already sent a weekly digest for that user this week.
    //@Scheduled(cron = "0 * * * * *", zone = "America/Los_Angeles")
    @Scheduled(
            cron = "${app.notifications.weekly.cron:0 0 9 * * MON}",
            zone = "${app.notifications.zone:America/Los_Angeles}"
    )
    public void sendWeeklyMatchDigest() {
        if (!weeklyEnabled) {
            log.info("Weekly match digest: disabled by config");
            return;
        }
        Instant runStart = Instant.now(clock);
        Instant now = Instant.now(clock);
        Instant activeCutoff = now.minus(Duration.ofDays(14));
        var users = userProfileRepository.findActiveUsersSince(activeCutoff);
        if (users.isEmpty()) {
            log.info("Weekly match digest: no active users");
            return;
        }

        ZonedDateTime laNow = ZonedDateTime.ofInstant(now, SAN_DIEGO_TZ);
        Instant weekStart = laNow.toLocalDate().with(java.time.DayOfWeek.MONDAY)
                .atStartOfDay(SAN_DIEGO_TZ)
                .toInstant();
        String ctaUrl = frontendUrl + "/messages";

        int sentCount = 0;
        int failedCount = 0;
        int skippedCount = 0;
        boolean capReached = false;
        for (var user : users) {
            if (sentCount >= maxPerRun) {
                log.warn("Weekly match digest: cap reached (maxPerRun={})", maxPerRun);
                capReached = true;
                break;
            }
            Long userId = user.getId();
            String email = user.getEmail();
            try {
                NotificationDigestState state = digestStateRepository
                        .findByUserIdAndType(userId, NotificationDigestType.MATCH_WEEKLY)
                        .orElse(null);

                if (state != null && state.getLastSentAt() != null && !state.getLastSentAt().isBefore(weekStart)) {
                    continue;
                }

                long matchCount = matchRepository.countNewMatchesForUserSince(userId, weekStart);
                if (matchCount <= 0) {
                    saveState(state, userId, NotificationDigestType.MATCH_WEEKLY, null, false, weekStart, now, null);
                    skippedCount++;
                    continue;
                }

                String message = "You have new " + matchCount + " match(es) during this week.";
                emailSender.sendNotificationEmail(
                        email,
                        "New matches this week",
                        "New matches",
                        message,
                        ctaUrl
                );

                String meta = "{\"matchCount\":" + matchCount + "}";
                saveState(state, userId, NotificationDigestType.MATCH_WEEKLY, now, true, weekStart, now, meta);
                sentCount++;
            } catch (RuntimeException ex) {
                failedCount++;
                log.warn("Weekly match digest failed: userId={} email={} message={}",
                        userId, email, ex.getMessage());
            }
        }

        long durationMs = Duration.between(runStart, Instant.now(clock)).toMillis();
        log.info("Weekly match digest: durationMs={} scanned={} sent={} failed={} skipped={} capReached={}",
                durationMs, users.size(), sentCount, failedCount, skippedCount, capReached);
    }

    private void saveState(NotificationDigestState state,
                           Long userId,
                           NotificationDigestType type,
                           Instant lastSentAt,
                           boolean updateLastSentAt,
                           Instant lastWindowStart,
                           Instant lastWindowEnd,
                           String meta) {
        NotificationDigestState updated = state != null ? state : new NotificationDigestState();
        updated.setUserId(userId);
        updated.setType(type);
        if (updateLastSentAt) {
            updated.setLastSentAt(lastSentAt);
        }
        updated.setLastWindowStart(lastWindowStart);
        updated.setLastWindowEnd(lastWindowEnd);
        updated.setMeta(meta);
        digestStateRepository.save(updated);
    }

    private String buildUnreadMessage(long unreadCount, long senderCount, List<String> senderNames) {
        String base = "You have new " + unreadCount + " message(s) from " + senderCount + " user(s).";
        if (senderCount > 0 && senderCount < 4 && !senderNames.isEmpty()) {
            return base + " From: " + String.join(", ", senderNames) + ".";
        }
        return base;
    }

    private String buildUnreadMeta(long unreadCount, long senderCount, List<String> senderNames) {
        String names = senderNames.stream()
                .map(this::escapeJson)
                .map(name -> "\"" + name + "\"")
                .collect(Collectors.joining(","));
        return "{\"unreadCount\":" + unreadCount
                + ",\"senderCount\":" + senderCount
                + ",\"senderNames\":[" + names + "]}";
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
