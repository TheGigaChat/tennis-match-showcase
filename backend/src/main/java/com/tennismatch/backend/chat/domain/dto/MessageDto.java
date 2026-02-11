package com.tennismatch.backend.chat.domain.dto;

import com.tennismatch.backend.chat.domain.enums.MessageStatus;
import lombok.*;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageDto {
    private Long id;
    private Long senderId;
    private String body;
    private Instant createdAt;
    private MessageStatus status;
    private String clientId;
}
