package com.tennismatch.backend.services;

import java.time.Instant;

public interface DecisionService {
    DecisionOutcome applyDecision(Long actorId,
                                  Long targetUserId,
                                  String decision,      // "YES" | "NOPE"
                                  Instant at,
                                  String idempotencyKey,
                                  Integer position);
}
