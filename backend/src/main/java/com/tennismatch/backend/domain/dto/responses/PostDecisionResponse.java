package com.tennismatch.backend.domain.dto.responses;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDecisionResponse {
    @Singular
    private List<DecisionResult> results;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DecisionResult {
        private String candidateId;
        private Long targetUserId;
        private boolean matched;
        private MatchSummary match;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MatchSummary {
        private Long matchId;
        private Long conversationId;
        private String name;
        private Integer age;
        private String photoUrl;
    }
}
