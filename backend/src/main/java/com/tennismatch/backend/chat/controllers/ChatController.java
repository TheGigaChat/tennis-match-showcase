package com.tennismatch.backend.chat.controllers;

import com.tennismatch.backend.chat.domain.dto.MessageDto;
import com.tennismatch.backend.chat.domain.dto.requests.SendMessageRequest;
import com.tennismatch.backend.chat.domain.dto.responses.HistoryResponse;
import com.tennismatch.backend.chat.domain.entries.Conversation;
import com.tennismatch.backend.chat.repositories.ConversationParticipantRepository;
import com.tennismatch.backend.chat.services.ChatService;
import com.tennismatch.backend.cache.CacheVersionService;
import com.tennismatch.backend.utils.AuthUserIdResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthUserIdResolver idResolver;
    private final ConversationParticipantRepository participantRepo;
    private final CacheVersionService cacheVersionService;

    /** Create chat by match (called from match flow) */
    @PostMapping("/by-match/{matchId}")
    public ResponseEntity<Long> createByMatch(@PathVariable long matchId,
                                              @RequestParam long userA,
                                              @RequestParam long userB) {
        Conversation c = chatService.createForMatch(matchId, userA, userB);
        return ResponseEntity.ok(c.getId());
    }

    /** Send message */
    @PostMapping("/{conversationId}/messages")
    public MessageDto send(@PathVariable long conversationId,
                           @RequestBody SendMessageRequest req,
                           Authentication auth) {
        long userId = idResolver.resolveUserId(auth);
        return chatService.sendMessage(userId, conversationId, req.getBody(), req.getClientId());
    }

    /** Message history (back-scroll pagination) */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<HistoryResponse> history(@PathVariable long conversationId,
                                                   @RequestParam(required = false, name = "before_id") Long beforeId,
                                                   @RequestParam(defaultValue = "50") int limit,
                                                   Authentication auth) {
        if (beforeId == null && auth != null) {
            long userId = idResolver.resolveUserId(auth);
            participantRepo.touchLastReadAt(conversationId, userId, Instant.now());
            cacheVersionService.bumpInboxVersion(userId);
        }
        var dto = chatService.getMessages(conversationId, beforeId, limit);
        return ResponseEntity.ok(dto);
    }
}

