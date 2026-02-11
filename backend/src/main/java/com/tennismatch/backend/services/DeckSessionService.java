package com.tennismatch.backend.services;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

public interface DeckSessionService {
    String create(Long actorId, Map<String, Long> cardToUser, Instant expiresAt);
    Optional<DeckSession> get(String token);

    record DeckSession(String token, Long actorId, Map<String, Long> cardToUser, Instant expiresAt) {}
}
