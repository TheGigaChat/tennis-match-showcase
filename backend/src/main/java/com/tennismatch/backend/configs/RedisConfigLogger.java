package com.tennismatch.backend.configs;

import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class RedisConfigLogger {

    private static final Logger log = LoggerFactory.getLogger(RedisConfigLogger.class);

    private final RedisProperties redisProperties;

    public RedisConfigLogger(RedisProperties redisProperties) {
        this.redisProperties = redisProperties;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logRedisConfig() {
        String url = sanitizeRedisUrl(redisProperties.getUrl());
        boolean sslEnabled = redisProperties.getSsl() != null && redisProperties.getSsl().isEnabled();
        String resolvedHostPort = resolveHostPort(redisProperties.getUrl(), redisProperties.getHost(), redisProperties.getPort());
        boolean redisUrlPresent = hasEnv("REDIS_URL");
        boolean springRedisUrlPresent = hasEnv("SPRING_DATA_REDIS_URL");
        log.info(
                "Redis config: url={}, resolvedHostPort={}, sslEnabled={}, env.REDIS_URL.present={}, env.SPRING_DATA_REDIS_URL.present={}",
                url,
                resolvedHostPort,
                sslEnabled,
                redisUrlPresent,
                springRedisUrlPresent
        );
    }

    private static String resolveHostPort(String url, String fallbackHost, int fallbackPort) {
        if (url != null && !url.isBlank()) {
            try {
                URI uri = URI.create(url);
                if (uri.getHost() != null) {
                    String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
                    return uri.getHost() + port;
                }
            } catch (Exception ignored) {
                // Fall back to explicit host/port when URL parsing fails.
            }
        }
        String host = (fallbackHost == null || fallbackHost.isBlank()) ? "localhost" : fallbackHost;
        return host + ":" + fallbackPort;
    }

    private static String sanitizeRedisUrl(String url) {
        if (url == null || url.isBlank()) {
            return "unset";
        }
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme() != null ? uri.getScheme() : "redis";
            String host = uri.getHost() != null ? uri.getHost() : "";
            String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
            String path = uri.getPath() != null ? uri.getPath() : "";
            String auth = uri.getUserInfo() != null ? "***:***@" : "";
            return scheme + "://" + auth + host + port + path;
        } catch (Exception ex) {
            return "invalid";
        }
    }

    private static boolean hasEnv(String name) {
        String value = System.getenv(name);
        return value != null && !value.isBlank();
    }
}
