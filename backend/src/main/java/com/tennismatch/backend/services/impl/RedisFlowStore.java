package com.tennismatch.backend.services.flow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tennismatch.backend.domain.dto.auth.AuthFlowDto;
import com.tennismatch.backend.services.FlowStore;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "auth.flow.store", havingValue = "redis")
public class RedisFlowStore implements FlowStore {

    private static final String KEY_PREFIX = "authflow:";

    private final StringRedisTemplate redis;
    private final ObjectMapper mapper;

    private String key(String flowId) {
        return KEY_PREFIX + flowId;
    }

    @Override
    public void save(String flowId, AuthFlowDto flow, Duration ttl) {
        try {
            String json = mapper.writeValueAsString(flow);
            redis.opsForValue().set(key(flowId), json, ttl);
        } catch (Exception e) {
            throw new RuntimeException("Redis write failed", e);
        }
    }

    @Override
    public Optional<AuthFlowDto> find(String flowId) {
        try {
            String json = redis.opsForValue().get(key(flowId));
            if (json == null) return Optional.empty();
            return Optional.of(mapper.readValue(json, AuthFlowDto.class));
        } catch (Exception e) {
            throw new RuntimeException("Redis read failed", e);
        }
    }

    @Override
    public void delete(String flowId) {
        redis.delete(key(flowId));
    }
}
