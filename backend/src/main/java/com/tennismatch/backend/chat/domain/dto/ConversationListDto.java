package com.tennismatch.backend.chat.domain.dto;


import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import lombok.*;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConversationListDto {
    private Long id;
    private ConversationStatus status;
    private Instant lastMessageAt;
    private String lastMessageSnippet;
    private PartnerDto partner;
    private int unreadCount; // MVP: 0

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PartnerDto {
        private Long userId;
        private String name;        // optional
        private String avatarUrl;   // optional
    }
}
