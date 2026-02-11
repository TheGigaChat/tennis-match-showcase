package com.tennismatch.backend.domain.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyRequest {
    @NotBlank
    private String flowId;

    @Pattern(regexp="\\d{6}", message="Code must be 6 digits")
    private String code;
}