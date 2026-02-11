package com.tennismatch.backend.domain.dto.responses;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwipeResponse {
    private boolean success;
    private boolean mutualLike; // whether a match occurred
}
