package com.tennismatch.backend.chat.domain.dto;

import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import lombok.*;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConversationDetailsDto implements java.io.Serializable {
    private Long id;
    private ConversationStatus status;
    private Instant lastMessageAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class PartnerDto implements java.io.Serializable {
        private Long userId;
        private String name;
        private String avatarUrl;
    }

    private PartnerDto partner;
}
