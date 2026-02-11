package com.tennismatch.backend.domain.dto.requests;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResendRequest {
    @NotBlank
    private String flowId;
}
