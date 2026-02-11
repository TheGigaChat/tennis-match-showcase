package com.tennismatch.backend.chat.repositories;

import com.tennismatch.backend.chat.domain.entries.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long beforeId, Pageable pageable);
    List<Message> findByConversationIdOrderByIdDesc(Long conversationId, Pageable pageable);
    Optional<Message> findByConversationIdAndClientId(Long conversationId, String clientId);
    long countByConversationId(Long conversationId);

    interface UnreadCountRow {
        Long getConversationId();
        Long getUnreadCount();
    }

    @Query("""
        select m.conversationId as conversationId,
               count(m) as unreadCount
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.conversationId in :conversationIds
           and m.senderId <> :userId
           and m.createdAt > coalesce(p.lastReadAt, :epoch)
         group by m.conversationId
    """)
    List<UnreadCountRow> countUnreadForConversations(@Param("userId") Long userId,
                                                     @Param("conversationIds") List<Long> conversationIds,
                                                     @Param("epoch") Instant epoch);

    @Query("""
        select count(m)
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.senderId <> :userId
           and m.createdAt > coalesce(p.lastReadAt, :epoch)
    """)
    long countUnreadForUser(@Param("userId") Long userId, @Param("epoch") Instant epoch);

    @Query("""
        select count(distinct m.senderId)
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.senderId <> :userId
           and m.createdAt > coalesce(p.lastReadAt, :epoch)
    """)
    long countUnreadSendersForUser(@Param("userId") Long userId, @Param("epoch") Instant epoch);

    @Query("""
        select count(m)
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.senderId <> :userId
           and m.createdAt > (case
                                when p.lastReadAt is null or p.lastReadAt < :since
                                  then :since
                                else p.lastReadAt
                              end)
    """)
    long countUnreadForUserSince(@Param("userId") Long userId,
                                 @Param("since") Instant since);

    @Query("""
        select count(distinct m.senderId)
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.senderId <> :userId
           and m.createdAt > (case
                                when p.lastReadAt is null or p.lastReadAt < :since
                                  then :since
                                else p.lastReadAt
                              end)
    """)
    long countUnreadSendersForUserSince(@Param("userId") Long userId,
                                        @Param("since") Instant since);

    @Query("""
        select distinct m.senderId
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.senderId <> :userId
           and m.createdAt > (case
                                when p.lastReadAt is null or p.lastReadAt < :since
                                  then :since
                                else p.lastReadAt
                              end)
    """)
    List<Long> findUnreadSenderIdsForUserSince(@Param("userId") Long userId,
                                               @Param("since") Instant since,
                                               Pageable pageable);

    @Query("""
        select count(m)
          from Message m
          join ConversationParticipant p
            on p.conversationId = m.conversationId
           and p.userId = :userId
         where m.conversationId = :conversationId
           and m.senderId <> :userId
           and m.createdAt > coalesce(p.lastReadAt, :epoch)
    """)
    long countUnreadForConversation(@Param("conversationId") Long conversationId,
                                    @Param("userId") Long userId,
                                    @Param("epoch") Instant epoch);
}
