package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.auth.AuthFlowDto;

import java.time.Duration;
import java.util.Optional;

public interface FlowStore {
    void save(String flowId, AuthFlowDto flow, Duration ttl);
    Optional<AuthFlowDto> find(String flowId);
    void delete(String flowId);
}
