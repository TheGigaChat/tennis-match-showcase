package com.tennismatch.backend.chat.repositories;

import com.tennismatch.backend.chat.domain.entries.ConversationParticipant;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, ConversationParticipant.PK> {
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);

    @Query("""
        select p.userId
          from ConversationParticipant p
         where p.conversationId = :conversationId
    """)
    java.util.List<Long> findUserIdsByConversationId(@Param("conversationId") Long conversationId);

    @Modifying
    @Transactional
    @Query("""
        update ConversationParticipant p
           set p.lastReadAt = :now
         where p.conversationId = :conversationId
           and p.userId = :userId
    """)
    int touchLastReadAt(@Param("conversationId") Long conversationId,
                        @Param("userId") Long userId,
                        @Param("now") Instant now);
}
