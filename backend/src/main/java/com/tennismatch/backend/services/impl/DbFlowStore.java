package com.tennismatch.backend.services.impl;

import com.tennismatch.backend.domain.dto.auth.AuthFlowDto;
import com.tennismatch.backend.domain.entries.AuthFlowEntity;
import com.tennismatch.backend.repositories.AuthFlowRepository;
import com.tennismatch.backend.services.FlowStore;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "auth.flow.store", havingValue = "db", matchIfMissing = true)
public class DbFlowStore implements FlowStore {

    private final AuthFlowRepository repo;

    @Override
    public void save(String flowId, AuthFlowDto flow, Duration ttl) {
        AuthFlowEntity e = new AuthFlowEntity();
        e.setFlowId(flowId);
        e.setEmail(flow.getEmail());
        e.setCode(flow.getCode());
        e.setAttempts(flow.getAttempts());
        e.setExpiresAt(Instant.now().plus(ttl));
        e.setResendCount(flow.getResendCount());
        e.setResendCooldownUntil(Instant.ofEpochSecond(flow.getResendCooldownUntilEpochSec()));
        repo.save(e);
    }

    @Override
    public Optional<AuthFlowDto> find(String flowId) {
        return repo.findById(flowId).map(e -> AuthFlowDto.builder()
                .email(e.getEmail())
                .code(e.getCode())
                .attempts(e.getAttempts())
                .expiresAtEpochSec(e.getExpiresAt().getEpochSecond())
                .resendCount(e.getResendCount())
                .resendCooldownUntilEpochSec(e.getResendCooldownUntil().getEpochSecond())
                .build()
        );
    }

    @Override
    public void delete(String flowId) {
        repo.deleteById(flowId);
    }
}
