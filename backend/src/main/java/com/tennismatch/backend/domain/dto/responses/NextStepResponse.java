package com.tennismatch.backend.domain.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NextStepResponse {
    private String flowId;        // /verify can return null
    private String next;          // VERIFY_CODE | COMPLETE_PROFILE | GO_TO_PROFILE
}
