package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.NotificationDigestState;
import com.tennismatch.backend.domain.enums.NotificationDigestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationDigestStateRepository extends JpaRepository<NotificationDigestState, Long> {
    Optional<NotificationDigestState> findByUserIdAndType(Long userId, NotificationDigestType type);
}
