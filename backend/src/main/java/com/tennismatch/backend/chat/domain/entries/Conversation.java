package com.tennismatch.backend.chat.domain.entries;

import com.tennismatch.backend.chat.domain.enums.ConversationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicUpdate;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity @Table(name = "conversation")
@DynamicUpdate
public class Conversation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false, unique = true)
    private Long matchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "archived_at")
    private Instant archivedAt;
}
