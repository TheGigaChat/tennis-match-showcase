// com.tennismatch.backend.services.impl.DecisionServiceImpl
package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.cache.CacheVersionService;
import com.tennismatch.backend.chat.services.ChatService;
import com.tennismatch.backend.domain.entries.Match;
import com.tennismatch.backend.domain.entries.UserAction;
import com.tennismatch.backend.repositories.MatchRepository;
import com.tennismatch.backend.repositories.UserActionRepository;
import com.tennismatch.backend.services.DecisionOutcome;
import com.tennismatch.backend.services.DecisionService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DecisionServiceImpl implements DecisionService {

    private final UserActionRepository actionRepo;
    private final MatchRepository matchRepo;
    private final ChatService chatService;
    private final CacheVersionService cacheVersionService;

    @Override
    @Transactional
    public DecisionOutcome applyDecision(Long actorId, Long targetUserId, String decisionStr,
                                         Instant at, String idempotencyKey, Integer position) {

        UserAction.Decision decision = UserAction.Decision.valueOf(decisionStr);

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            if (actionRepo.findByIdempotencyKey(idempotencyKey).isPresent()) return DecisionOutcome.noMatch();
        }

        if (actionRepo.existsByActorIdAndTargetId(actorId, targetUserId)) return DecisionOutcome.noMatch();

        UserAction ua = UserAction.builder()
                .actorId(actorId)
                .targetId(targetUserId)
                .decision(decision)
                .position(position)
                .atUtc(at != null ? at : Instant.now())
                .idempotencyKey(idempotencyKey)
                .build();
        actionRepo.save(ua);
        cacheVersionService.bumpDeckVersion(actorId);

        if (decision == UserAction.Decision.YES) {
            boolean mutualYes = actionRepo.existsByActorIdAndTargetIdAndDecision(
                    targetUserId, actorId, UserAction.Decision.YES);

            if (mutualYes) {
                long u1 = Math.min(actorId, targetUserId);
                long u2 = Math.max(actorId, targetUserId);

                Match match = matchRepo.findByUser1IdAndUser2Id(u1, u2)
                        .orElseGet(() -> {
                            try {
                                return matchRepo.save(Match.builder()
                                        .user1Id(u1)
                                        .user2Id(u2)
                                        .createdAt(Instant.now())
                                        .build());
                            } catch (DataIntegrityViolationException e) {
                                return matchRepo.findByUser1IdAndUser2Id(u1, u2)
                                        .orElseThrow(() -> e);
                            }
                        });

                var conversation = chatService.createForMatch(match.getId(), u1, u2);
                return new DecisionOutcome(true, match.getId(), conversation.getId());
            }
        }

        return DecisionOutcome.noMatch();
    }
}
