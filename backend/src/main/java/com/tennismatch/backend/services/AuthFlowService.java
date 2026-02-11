package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.responses.NextStepResponse;

public interface AuthFlowService {
    NextStepResponse start(String email);

    String verifyAndGetEmail(String flowId, String code);

    NextStepResponse resend(String flowId);
}
