package com.tennismatch.backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class GeocodeRateLimiter {
    private static final int LIMIT_PER_HOUR = 10;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final ObjectProvider<StringRedisTemplate> redisProvider;

    private final ConcurrentHashMap<String, Window> memory = new ConcurrentHashMap<>();

    public boolean allow(String userKey) {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis != null) {
            try {
                String key = "geocode:rate:" + userKey;
                Long count = redis.opsForValue().increment(key);
                if (count != null && count == 1L) {
                    redis.expire(key, WINDOW);
                }
                return count != null && count <= LIMIT_PER_HOUR;
            } catch (Exception e) {
                // Fall through to in-memory if Redis is unavailable or errors.
            }
        }
        return allowInMemory(userKey);
    }

    private boolean allowInMemory(String userKey) {
        Instant now = Instant.now();
        Window w = memory.compute(userKey, (k, existing) -> {
            if (existing == null || now.isAfter(existing.resetAt)) {
                return new Window(1, now.plus(WINDOW));
            }
            existing.count++;
            return existing;
        });
        return w.count <= LIMIT_PER_HOUR;
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
