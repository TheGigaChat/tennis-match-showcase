package com.tennismatch.backend.chat.domain.dto.responses;

import com.tennismatch.backend.chat.domain.dto.MessageDto;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryResponse {
    private Long conversationId;
    private boolean hasMore;
    private List<MessageDto> items;
}
