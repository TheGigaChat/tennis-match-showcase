package com.tennismatch.backend.domain.entries;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name="match",
        uniqueConstraints = {
                @UniqueConstraint(name="uk_match", columnNames = {"user1_id", "user2_id"})
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user1_id", nullable = false)
    private Long user1Id;

    @Column(name="user2_id", nullable = false)
    private Long user2Id;

    @Column(name="created_at", nullable = false)
    private Instant createdAt;
}