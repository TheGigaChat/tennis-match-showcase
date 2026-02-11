package com.tennismatch.backend.chat.domain.entries;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "conversation_participant")
@IdClass(ConversationParticipant.PK.class)
public class ConversationParticipant {

    @Id
    @Column(name = "conversation_id")
    private Long conversationId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class PK implements java.io.Serializable {
        private Long conversationId;
        private Long userId;
    }
}
