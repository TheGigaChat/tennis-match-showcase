package com.tennismatch.backend.domain.dto.auth;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthFlowDto {
    private String email;
    private String code;
    private int attempts;
    private long expiresAtEpochSec;
    private int resendCount;
    private long resendCooldownUntilEpochSec;
}
