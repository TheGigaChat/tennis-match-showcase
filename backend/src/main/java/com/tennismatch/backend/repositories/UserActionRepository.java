package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.UserAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;
import java.util.List;

public interface UserActionRepository extends JpaRepository<UserAction, Long> {
    Optional<UserAction> findByIdempotencyKey(String idempotencyKey);
    Optional<UserAction> findByActorIdAndTargetId(Long actorId, Long targetId);
    boolean existsByActorIdAndTargetIdAndDecision(Long actorId, Long targetId, UserAction.Decision decision);
    boolean existsByActorIdAndTargetId(Long actorId, Long targetId);
    List<Long> findTargetIdsByActorIdAndTargetIdIn(Long actorId, Collection<Long> targetIds);
}
