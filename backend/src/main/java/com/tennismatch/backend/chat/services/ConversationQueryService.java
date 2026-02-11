package com.tennismatch.backend.chat.services;

import com.tennismatch.backend.chat.domain.dto.ConversationListDto;
import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import com.tennismatch.backend.chat.repositories.ConversationRepository;
import com.tennismatch.backend.configs.CacheConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationQueryService {

    private final ConversationRepository conversationRepo;

    @Cacheable(cacheNames = CacheConfig.CONVERSATIONS_CACHE,
            key = "#userId + ':' + @cacheVersionService.getInboxVersion(#userId)")
    public List<ConversationListDto> getConversations(long userId) {
        var rows = conversationRepo.findAllForUserWithMeta(userId, Instant.EPOCH);
        if (rows.isEmpty()) return List.of();

        return rows.stream().map(r -> {
            Long pid = r.getPartnerId();
            String name = r.getPartnerName();
            if (name == null || name.isBlank()) {
                name = pid != null ? "Player " + pid : "Player";
            }
            String avatar = r.getPartnerPhoto();
            long unreadCountLong = r.getUnreadCount() != null ? r.getUnreadCount() : 0L;
            int unreadCount = (int) Math.min(unreadCountLong, Integer.MAX_VALUE);
            String snippet = r.getLastMessageSnippet();
            if (snippet != null && snippet.isBlank()) {
                snippet = null;
            }

            var lastMessageAt = r.getLastMessageAt();
            var createdAt = r.getCreatedAt();

            return ConversationListDto.builder()
                    .id(r.getConversationId())
                    .status(parseStatus(r.getStatus()))
                    .lastMessageAt(lastMessageAt != null ? lastMessageAt : createdAt)
                    .lastMessageSnippet(snippet)
                    .partner(new ConversationListDto.PartnerDto(pid, name, avatar))
                    .unreadCount(unreadCount)
                    .build();
        }).toList();
    }

    private static ConversationStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return ConversationStatus.valueOf(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
