package com.tennismatch.backend.chat.services.impl;

import com.tennismatch.backend.chat.domain.dto.MessageDto;
import com.tennismatch.backend.chat.domain.dto.responses.HistoryResponse;
import com.tennismatch.backend.chat.domain.entries.Conversation;
import com.tennismatch.backend.chat.domain.entries.ConversationParticipant;
import com.tennismatch.backend.chat.domain.entries.Message;
import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import com.tennismatch.backend.chat.domain.enums.MessageStatus;
import com.tennismatch.backend.chat.repositories.ConversationParticipantRepository;
import com.tennismatch.backend.chat.repositories.ConversationRepository;
import com.tennismatch.backend.chat.repositories.MessageRepository;
import com.tennismatch.backend.chat.services.ChatService;
import com.tennismatch.backend.cache.CacheVersionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepo;
    private final ConversationParticipantRepository participantRepo;
    private final MessageRepository messageRepo;
    private final CacheVersionService cacheVersionService;
    private final Clock clock;

    @Value("${app.chat.conversation.ttl:PT24H}")
    private Duration conversationTtl;

    /** Create a conversation on match (call from match service) */
    @Transactional
    @Override
    public Conversation createForMatch(long matchId, long userA, long userB) {
        // idempotent by match
        var existing = conversationRepo.findByMatchId(matchId);
        if (existing.isPresent()) return existing.get();

        Instant now = Instant.now(clock);
        Conversation c = conversationRepo.save(Conversation.builder()
                .matchId(matchId)
                .status(ConversationStatus.ACTIVE)
                .createdAt(now)
                .expiresAt(now.plus(conversationTtl))
                .build());

        participantRepo.save(ConversationParticipant.builder().conversationId(c.getId()).userId(userA).build());
        participantRepo.save(ConversationParticipant.builder().conversationId(c.getId()).userId(userB).build());
        cacheVersionService.bumpInboxVersion(userA);
        cacheVersionService.bumpInboxVersion(userB);
        return c;
    }

    @Transactional
    @Override
    public MessageDto sendMessage(long userId, long conversationId, String body, String clientId) {
        // participant check
        if (!participantRepo.existsByConversationIdAndUserId(conversationId, userId)) {
            throw new SecurityException("User is not a participant of this conversation");
        }

        Conversation c = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found"));

        Instant now = Instant.now(clock);

        // active and not expired
        if (c.getStatus() != ConversationStatus.ACTIVE || c.getExpiresAt().isBefore(now)) {
            throw new IllegalStateException("Conversation is not active");
        }

        // idempotency
        if (clientId != null && !clientId.isBlank()) {
            var existing = messageRepo.findByConversationIdAndClientId(conversationId, clientId);
            if (existing.isPresent()) {
                var m = existing.get();
                return toDto(m);
            }
        }

        Message m = Message.builder()
                .conversationId(conversationId)
                .senderId(userId)
                .body(body)
                .createdAt(now)
                .status(MessageStatus.DELIVERED)
                .clientId(clientId)
                .build();
        m = messageRepo.save(m);

        // extend TTL
        c.setLastMessageAt(now);
        c.setExpiresAt(now.plus(conversationTtl));
        conversationRepo.save(c);

        for (Long uid : participantRepo.findUserIdsByConversationId(conversationId)) {
            cacheVersionService.bumpInboxVersion(uid);
        }

        return toDto(m);
    }

    @Transactional(readOnly = true)
    @Override
    public HistoryResponse getMessages(long conversationId, Long beforeId, int limit) {
        var page = PageRequest.of(0, Math.max(1, Math.min(limit, 100)));
        List<Message> msgs = (beforeId != null)
                ? messageRepo.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, beforeId, page)
                : messageRepo.findByConversationIdOrderByIdDesc(conversationId, page);

        boolean hasMore = msgs.size() == page.getPageSize();
        var items = msgs.stream().map(this::toDto).toList();
        // Return ascending order for frontend convenience
        var itemsAsc = new java.util.ArrayList<>(items);
        java.util.Collections.reverse(itemsAsc);

        return HistoryResponse.builder()
                .conversationId(conversationId)
                .hasMore(hasMore)
                .items(itemsAsc)
                .build();
    }

    private MessageDto toDto(Message m) {
        return MessageDto.builder()
                .id(m.getId())
                .senderId(m.getSenderId())
                .body(m.getBody())
                .createdAt(m.getCreatedAt())
                .status(m.getStatus())
                .clientId(m.getClientId())
                .build();
    }
}
