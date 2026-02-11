package com.tennismatch.backend.domain.entries;

import com.tennismatch.backend.domain.enums.NotificationDigestType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "notification_digest_state",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_notification_digest_state_user_type",
                        columnNames = {"user_id", "type"}
                )
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationDigestState {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationDigestType type;

    @Column(name = "last_sent_at")
    private Instant lastSentAt;

    @Column(name = "last_window_start")
    private Instant lastWindowStart;

    @Column(name = "last_window_end")
    private Instant lastWindowEnd;

    @Column(columnDefinition = "text")
    private String meta;
}
