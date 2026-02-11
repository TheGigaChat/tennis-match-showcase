package com.tennismatch.backend.domain.entries;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "auth_flow")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthFlowEntity {
    @Id
    @Column(name="flow_id", nullable=false, length=64)
    private String flowId;

    @Column(nullable=false)
    private String email;

    @Column(nullable=false, length=6)
    private String code;

    @Column(nullable=false)
    private int attempts;

    @Column(name="expires_at", nullable=false)
    private Instant expiresAt;

    @Column(name = "resend_count", nullable = false)
    private int resendCount;

    @Column(name = "resend_cooldown_until", nullable = false)
    private Instant resendCooldownUntil;
}
