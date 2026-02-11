package com.tennismatch.backend.domain.dto.responses;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GetDeckResponse {
    @NotBlank
    private String deckToken;

    @Singular
    @NotNull
    private List<Card> cards;

    /** optional, ms until token expiration */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long ttlMs;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Card {
        @NotBlank
        private String id;             // candidate stable id (string/UUID)
        @NotNull
        private Long targetId;
        @NotBlank
        private String name;
        @NotNull @Min(18) @Max(120)
        private Integer age;
        @NotBlank
        private String skillLevel;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private Double distanceKm;
        @NotBlank
        private String photo;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private String bio;
    }
}
