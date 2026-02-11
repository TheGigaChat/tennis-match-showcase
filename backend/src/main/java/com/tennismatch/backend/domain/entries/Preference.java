package com.tennismatch.backend.domain.entries;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "preference")
public class Preference {

    public enum Game { TENNIS, PICKLEBALL }
    public enum PartnerGender { MALE, FEMALE, ANY }
    public enum SessionType { MATCH, PRIVATE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "game", nullable = false, length = 16)
    private Game game;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "partner_gender", nullable = false, length = 16)
    private PartnerGender partnerGender = PartnerGender.ANY;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 16)
    private SessionType sessionType = SessionType.MATCH;

    @NotNull
    @Min(1)
    @Column(name = "max_distance_km", nullable = false)
    private Integer maxDistanceKm = 20;

    /** 1:1 with profile (owner preferences holder) */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserProfile user;
}
