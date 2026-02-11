// com.tennismatch.backend.domain.entries.UserAction
package com.tennismatch.backend.domain.entries;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "user_action",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_user_action_idem", columnNames = {"idempotency_key"}),
                @UniqueConstraint(name="uk_user_action_pair", columnNames = {"actor_id", "target_id"})
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAction {

    public enum Decision { YES, NOPE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", nullable = false)
    private Long actorId;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Decision decision;

    @Column(name = "position")
    private Integer position;

    @Column(name = "at_utc", nullable = false)
    private Instant atUtc;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;
}
