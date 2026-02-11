package com.tennismatch.backend.configs;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CacheErrorHandlerConfig {

    private static final Logger log = LoggerFactory.getLogger(CacheErrorHandlerConfig.class);

    @Bean
    @ConditionalOnMissingBean(CacheErrorHandler.class)
    public CacheErrorHandler cacheErrorHandler() {
        return new SafeCacheErrorHandler();
    }

    static class SafeCacheErrorHandler implements CacheErrorHandler {

        @Override
        public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
            evictQuietly(cache, key);
            logError("GET", cache, key, exception);
        }

        @Override
        public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
            logError("PUT", cache, key, exception);
        }

        @Override
        public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
            logError("EVICT", cache, key, exception);
        }

        @Override
        public void handleCacheClearError(RuntimeException exception, Cache cache) {
            logError("CLEAR", cache, null, exception);
        }

        private static void logError(String op, Cache cache, Object key, RuntimeException ex) {
            String cacheName = cache != null ? cache.getName() : "unknown";
            String keyHash = hashKey(key);
            log.warn("Cache error op={} cache={} keyHash={} ex={} msg={}",
                    op,
                    cacheName,
                    keyHash,
                    ex.getClass().getSimpleName(),
                    safeMessage(ex.getMessage()));
        }

        private static void evictQuietly(Cache cache, Object key) {
            if (cache == null || key == null) {
                return;
            }
            try {
                cache.evict(key);
            } catch (RuntimeException ignored) {
                // ignore eviction failures on corrupt cache entries
            }
        }

        private static String hashKey(Object key) {
            if (key == null) {
                return "null";
            }
            String input = String.valueOf(key);
            try {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < 4 && i < digest.length; i++) {
                    sb.append(String.format("%02x", digest[i]));
                }
                return sb.toString();
            } catch (Exception ex) {
                return "hashErr";
            }
        }

        private static String safeMessage(String message) {
            if (message == null || message.isBlank()) {
                return "n/a";
            }
            return message
                    .replaceAll("redis://[^@/]*@", "redis://***:***@")
                    .replaceAll("rediss://[^@/]*@", "rediss://***:***@");
        }
    }
}
