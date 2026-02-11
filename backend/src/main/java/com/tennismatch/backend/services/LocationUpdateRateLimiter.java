package com.tennismatch.backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class LocationUpdateRateLimiter {
    private static final ZoneOffset ZONE = ZoneOffset.UTC;

    private final ObjectProvider<StringRedisTemplate> redisProvider;

    @Value("${app.location.update.daily-limit:10}")
    private int dailyLimit;

    private final ConcurrentHashMap<String, Window> memory = new ConcurrentHashMap<>();

    public boolean allow(String userKey) {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        Instant now = Instant.now();
        if (redis != null) {
            try {
                String date = LocalDate.now(ZONE).toString();
                String key = "location:update:" + userKey + ":" + date;
                Long count = redis.opsForValue().increment(key);
                if (count != null && count == 1L) {
                    redis.expire(key, ttlUntilNextDay(now));
                }
                return count != null && count <= dailyLimit;
            } catch (Exception e) {
                // Fall through to in-memory if Redis is unavailable or errors.
            }
        }
        return allowInMemory(userKey, now);
    }

    private boolean allowInMemory(String userKey, Instant now) {
        Window w = memory.compute(userKey, (k, existing) -> {
            if (existing == null || now.isAfter(existing.resetAt)) {
                return new Window(1, nextResetAt(now));
            }
            existing.count++;
            return existing;
        });
        return w.count <= dailyLimit;
    }

    private static Duration ttlUntilNextDay(Instant now) {
        return Duration.between(now, nextResetAt(now));
    }

    private static Instant nextResetAt(Instant now) {
        LocalDate nextDay = LocalDate.now(ZONE).plusDays(1);
        return nextDay.atStartOfDay().toInstant(ZONE);
    }

    private static final class Window {
        private int count;
        private Instant resetAt;

        private Window(int count, Instant resetAt) {
            this.count = count;
            this.resetAt = resetAt;
        }
    }
}
