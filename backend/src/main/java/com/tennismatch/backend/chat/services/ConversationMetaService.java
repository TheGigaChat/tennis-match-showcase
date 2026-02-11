package com.tennismatch.backend.chat.services;

import com.tennismatch.backend.chat.domain.dto.ConversationDetailsDto;


public interface ConversationMetaService {

    ConversationDetailsDto loadForUser(long meId, long conversationId);
}
