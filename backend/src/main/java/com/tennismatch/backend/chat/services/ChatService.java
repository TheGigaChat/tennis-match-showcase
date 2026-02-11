package com.tennismatch.backend.chat.services;

import com.tennismatch.backend.chat.domain.dto.MessageDto;
import com.tennismatch.backend.chat.domain.dto.responses.HistoryResponse;
import com.tennismatch.backend.chat.domain.entries.Conversation;
import org.springframework.transaction.annotation.Transactional;

public interface ChatService {
    @Transactional
    Conversation createForMatch(long matchId, long userA, long userB);

    @Transactional
    MessageDto sendMessage(long userId, long conversationId, String body, String clientId);

    @Transactional(readOnly = true)
    HistoryResponse getMessages(long conversationId, Long beforeId, int limit);
}
