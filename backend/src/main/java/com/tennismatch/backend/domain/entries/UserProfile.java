package com.tennismatch.backend.domain.entries;

import com.tennismatch.backend.domain.enums.SkillLevel;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import org.locationtech.jts.geom.Point;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.time.Instant;

@Entity
@Table(
        name = "user_profile",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_profile_email", columnNames = "email")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile implements Serializable {

    public enum Gender { MALE, FEMALE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 50)
    private String name;

    @Min(18) @Max(99)
    private Integer age;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_skill_level")
    private SkillLevel skillLevel;

    @Min(1) @Max(5)
    private Integer rating;

//    // Recommend naming the field the same as in DB to avoid confusion
//    @Size(max = 20)
//    @Pattern(regexp = "^\\+[1-9]\\d{7,14}$", message = "Phone in E.164 format, e.g. +37251234567")
//    @Column(name = "phone")               // WITHOUT nullable=false
//    private String phone;                 // <-- renamed from telephone -> phone

    // --- required ---
    @NotBlank @Email @Size(max = 320)
    @Column(name = "email", nullable = false)
    private String email;

    @NotNull
    @Column(nullable = false)
    private Boolean visible = Boolean.TRUE;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Photo> photos = new ArrayList<>();
}

