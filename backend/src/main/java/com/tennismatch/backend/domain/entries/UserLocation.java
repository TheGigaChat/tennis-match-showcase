package com.tennismatch.backend.domain.entries;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "user_location")
public class UserLocation {

    /** PK = FK to user_profile.id (strict 1:1) */
    @Id
    @Column(name = "user_id")
    private Long userId;

    /** 1:1 relationship, share primary key with profile */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserProfile user;

    /** Point in SRID 4326 (geography(Point,4326)) */
    @NotNull
    @Column(name = "location", columnDefinition = "geography(Point,4326)", nullable = false)
    private Point location;

    /** Measurement accuracy in meters (may be omitted by frontend) */
    @PositiveOrZero
    @Column(name = "accuracy_m")
    private Double accuracyM;

    /** Human-readable place name (for UI) */
    @Column(name = "place_name")
    private String placeName;

    /** Last location update time (UTC) */
    @NotNull
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
