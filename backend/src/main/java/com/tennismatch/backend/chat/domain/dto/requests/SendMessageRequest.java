package com.tennismatch.backend.chat.domain.dto.requests;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SendMessageRequest {
    private String body;
    private String clientId; // for idempotency
}
