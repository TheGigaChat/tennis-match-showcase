package com.tennismatch.backend.services;

public record DecisionOutcome(boolean matched, Long matchId, Long conversationId) {
    public static DecisionOutcome noMatch() {
        return new DecisionOutcome(false, null, null);
    }
}
