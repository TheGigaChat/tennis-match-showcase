package com.tennismatch.backend.domain.entries;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "onboarding_status")
public class OnboardingStatus {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserProfile user;

    @Builder.Default
    @Column(name = "name_completed", nullable = false)
    private Boolean nameCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "about_completed", nullable = false)
    private Boolean aboutCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "age_completed", nullable = false)
    private Boolean ageCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "gender_completed", nullable = false)
    private Boolean genderCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "tennis_level_completed", nullable = false)
    private Boolean tennisLevelCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "profile_photo_completed", nullable = false)
    private Boolean profilePhotoCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "preferences_completed", nullable = false)
    private Boolean preferencesCompleted = Boolean.FALSE;

    @Builder.Default
    @Column(name = "location_completed", nullable = false)
    private Boolean locationCompleted = Boolean.FALSE;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
