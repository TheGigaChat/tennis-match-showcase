// src/main/java/com/tennismatch/backend/chat/repositories/ConversationRepository.java
package com.tennismatch.backend.chat.repositories;

import com.tennismatch.backend.chat.domain.entries.Conversation;
import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByMatchId(Long matchId);

    // ---- user chat list (MVP: partner, sorted by activity) ----
    interface ConversationListRow {
        Long getConversationId();
        Long getPartnerId();
        Instant getLastMessageAt();
        Instant getCreatedAt();
        ConversationStatus getStatus();
    }

    @Query("""
      select c.id as conversationId,
             p2.userId as partnerId,
             c.lastMessageAt as lastMessageAt,
             c.createdAt as createdAt,
             c.status as status
        from Conversation c
        join ConversationParticipant p1 on p1.conversationId = c.id and p1.userId = :me
        join ConversationParticipant p2 on p2.conversationId = c.id and p2.userId <> :me
       order by coalesce(c.lastMessageAt, c.createdAt) desc
    """)
    List<ConversationListRow> findAllForUser(@Param("me") Long me);

    @Query(value = """
        select c.id as conversationId,
               p2.user_id as partnerId,
               c.last_message_at as lastMessageAt,
               c.created_at as createdAt,
               c.status as status,
               coalesce(nullif(up.name, ''), 'Player ' || cast(up.id as text)) as partnerName,
               ph.url as partnerPhoto,
               coalesce(unread.unread_count, 0) as unreadCount,
               lm.body as lastMessageSnippet
          from conversation c
          join conversation_participant p1
            on p1.conversation_id = c.id and p1.user_id = :me
          join conversation_participant p2
            on p2.conversation_id = c.id and p2.user_id <> :me
          join user_profile up on up.id = p2.user_id
          left join lateral (
              select m.body as body
                from message m
               where m.conversation_id = c.id
               order by m.created_at desc
               limit 1
          ) lm on true
          left join lateral (
              select p.url
                from photo p
               where p.user_id = p2.user_id
               order by p.id desc
               limit 1
          ) ph on true
          left join lateral (
              select count(*) as unread_count
                from message m
               where m.conversation_id = c.id
                 and m.sender_id <> :me
                 and m.created_at > coalesce(p1.last_read_at, :epoch)
          ) unread on true
         order by coalesce(c.last_message_at, c.created_at) desc
        """, nativeQuery = true)
    List<ConversationListView> findAllForUserWithMeta(@Param("me") Long me, @Param("epoch") Instant epoch);

    // ---- bulk updates (variant 2 — enum params) ----
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
      update Conversation c
         set c.status = :toStatus
       where c.status = :fromStatus
         and c.expiresAt < :now
    """)
    int expireOverdue(Instant now, ConversationStatus fromStatus, ConversationStatus toStatus);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
      update Conversation c
         set c.status = :toStatus,
             c.archivedAt = :now
       where c.status = :fromStatus
         and c.expiresAt < :threshold
    """)
    int archiveExpired(Instant threshold, Instant now, ConversationStatus fromStatus, ConversationStatus toStatus);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
      delete from Conversation c
       where c.status = :status
         and c.archivedAt < :threshold
    """)
    int purgeArchived(Instant threshold, ConversationStatus status);


    interface ConversationOneRow {
        Long getConversationId();
        Long getPartnerId();
        Instant getLastMessageAt();
        Instant getCreatedAt();
        ConversationStatus getStatus();
    }

    @Query("""
      select c.id as conversationId,
             p2.userId as partnerId,
             c.lastMessageAt as lastMessageAt,
             c.createdAt as createdAt,
             c.status as status
        from Conversation c
        join ConversationParticipant p1 on p1.conversationId = c.id and p1.userId = :me
        join ConversationParticipant p2 on p2.conversationId = c.id and p2.userId <> :me
       where c.id = :cid
    """)
    Optional<ConversationOneRow> findOneForUser(@Param("me") Long me, @Param("cid") Long conversationId);

}
