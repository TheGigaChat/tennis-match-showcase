package com.tennismatch.backend.domain.dto.requests;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostDecisionRequest {

    @JsonProperty("deck_token")
    @NotBlank
    private String deckToken;

    @Singular
    @Valid
    @NotEmpty
    private List<Item> items;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        @JsonProperty("candidate_id")
        @NotBlank
        private String candidateId;

        @NotNull
        private Decision decision; // YES | NOPE

        /** ISO timestamp (client). If missing, server will use now() */
        private Instant at;

        /** Card position in the deck (optional) */
        private Integer position;

        /** Idempotency. Can also be accepted from a header. */
        @JsonProperty("idempotency_key")
        private String idempotencyKey;
    }

    public enum Decision { YES, NOPE }
}
