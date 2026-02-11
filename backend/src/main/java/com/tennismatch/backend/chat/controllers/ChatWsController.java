package com.tennismatch.backend.chat.controllers;

import com.tennismatch.backend.chat.repositories.ConversationParticipantRepository;
import com.tennismatch.backend.chat.services.ChatService;
import com.tennismatch.backend.chat.utils.ChatEvent;
import com.tennismatch.backend.chat.utils.ChatSendPayload;
import com.tennismatch.backend.chat.utils.ReadPayload;
import com.tennismatch.backend.chat.utils.TypingPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.Instant;

@RestController
@RequiredArgsConstructor
@MessageMapping
public class ChatWsController {

    private final ChatService chatService;
    private final SimpMessagingTemplate ws;
    private final ConversationParticipantRepository participantRepo;

    @MessageMapping("/chat.{conversationId}.send")
    public void send(@DestinationVariable long conversationId,
                     ChatSendPayload payload,
                     Principal principal) {
        long userId = Long.parseLong(principal.getName());
        var dto = chatService.sendMessage(userId, conversationId, payload.getBody(), payload.getClientId());
        ws.convertAndSend("/topic/conversations." + conversationId, ChatEvent.message(dto));
    }

    @MessageMapping("/chat.{conversationId}.typing")
    public void typing(@DestinationVariable long conversationId,
                       TypingPayload payload,
                       Principal principal) {
        long userId = Long.parseLong(principal.getName());
        ws.convertAndSend("/topic/conversations." + conversationId, ChatEvent.typing(userId, payload.isTyping()));
    }

    @MessageMapping("/chat.{conversationId}.read")
    public void read(@DestinationVariable long conversationId,
                     ReadPayload payload,
                     Principal principal) {
        long userId = Long.parseLong(principal.getName());
        // (optional) update message statuses in DB
        participantRepo.touchLastReadAt(conversationId, userId, Instant.now());
        ws.convertAndSend("/topic/conversations." + conversationId, ChatEvent.read(userId, payload.getLastSeenId()));
    }
}

