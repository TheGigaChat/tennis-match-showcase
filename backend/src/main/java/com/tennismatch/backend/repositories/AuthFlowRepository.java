package com.tennismatch.backend.repositories;

import com.tennismatch.backend.domain.entries.AuthFlowEntity;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;

public interface AuthFlowRepository extends JpaRepository<AuthFlowEntity, String> {
    @Modifying
    @Query("delete from AuthFlowEntity f where f.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
