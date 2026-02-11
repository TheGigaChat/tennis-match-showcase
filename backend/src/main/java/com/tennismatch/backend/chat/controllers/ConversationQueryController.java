package com.tennismatch.backend.chat.controllers;

import com.tennismatch.backend.chat.domain.dto.ConversationDetailsDto;
import com.tennismatch.backend.chat.domain.dto.ConversationListDto;
import com.tennismatch.backend.chat.repositories.ConversationParticipantRepository;
import com.tennismatch.backend.chat.services.ConversationMetaService;
import com.tennismatch.backend.chat.services.ConversationQueryService;
import com.tennismatch.backend.utils.AuthUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class ConversationQueryController {

    private final ConversationQueryService conversationQueryService;
    private final AuthUserIdResolver idResolver;
    private final ConversationMetaService metaService;
    private final ConversationParticipantRepository participantRepo;

    @GetMapping("/conversations")
    public List<ConversationListDto> myConversations(Authentication auth) {
        long me = idResolver.resolveUserId(auth);
        return conversationQueryService.getConversations(me);
    }

    @GetMapping("/conversations/{id}")
    public ConversationDetailsDto conversationById(@PathVariable("id") Long conversationId,
                                                   Authentication auth) {
        long me = idResolver.resolveUserId(auth);
        participantRepo.touchLastReadAt(conversationId, me, Instant.now());
        return metaService.loadForUser(me, conversationId);
    }
}
