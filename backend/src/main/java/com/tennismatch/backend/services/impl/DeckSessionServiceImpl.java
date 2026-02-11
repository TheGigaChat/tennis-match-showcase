// com.tennismatch.backend.services.impl.RedisDeckSessionService
package com.tennismatch.backend.services.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tennismatch.backend.services.DeckSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeckSessionServiceImpl implements DeckSessionService {

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    private static final String KEY = "deck:session:"; // deck:session:{token}

    @Override
    public String create(Long actorId, Map<String, Long> cardToUser, Instant expiresAt) {
        try {
            String token = UUID.randomUUID().toString();
            DeckSession dto = new DeckSession(token, actorId, Map.copyOf(cardToUser), expiresAt);
            String json = mapper.writeValueAsString(dto);
            Duration ttl = Duration.between(Instant.now(), expiresAt).isNegative()
                    ? Duration.ofSeconds(1)
                    : Duration.between(Instant.now(), expiresAt);
            redis.opsForValue().set(KEY + token, json, ttl);
            return token;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create deck session", e);
        }
    }

    @Override
    public Optional<DeckSession> get(String token) {
        try {
            String json = redis.opsForValue().get(KEY + token);
            if (json == null) return Optional.empty();
            DeckSession s = mapper.readValue(json, new TypeReference<DeckSession>() {});
            // Soft expiry check (TTL should clean it anyway)
            if (s.expiresAt().isBefore(Instant.now())) {
                redis.delete(KEY + token);
                return Optional.empty();
            }
            return Optional.of(s);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

}
