package com.tennismatch.backend.cache;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class CacheVersionService {

    private static final String INBOX_PREFIX = "cache:inbox:version:";
    private static final String DECK_PREFIX = "cache:deck:version:";
    private static final java.time.Duration VERSION_TTL = java.time.Duration.ofDays(1);

    private final ObjectProvider<StringRedisTemplate> redisProvider;

    public CacheVersionService(ObjectProvider<StringRedisTemplate> redisProvider) {
        this.redisProvider = redisProvider;
    }

    public long getInboxVersion(long userId) {
        return getVersion(INBOX_PREFIX + userId);
    }

    public long getDeckVersion(long userId) {
        return getVersion(DECK_PREFIX + userId);
    }

    public void bumpInboxVersion(long userId) {
        increment(INBOX_PREFIX + userId);
    }

    public void bumpDeckVersion(long userId) {
        increment(DECK_PREFIX + userId);
    }

    private long getVersion(String key) {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis == null) return 0L;
        String value = redis.opsForValue().get(key);
        if (value == null) return 0L;
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private void increment(String key) {
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis == null) return;
        Long value = redis.opsForValue().increment(key);
        if (value != null && value == 1L) {
            redis.expire(key, VERSION_TTL);
        }
    }
}
