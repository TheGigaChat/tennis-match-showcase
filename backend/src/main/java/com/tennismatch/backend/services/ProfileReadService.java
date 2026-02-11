package com.tennismatch.backend.services;


import com.tennismatch.backend.domain.dto.responses.MeProfileResponse;

public interface ProfileReadService {
    MeProfileResponse readMe(String username);
    void evictMe(String username);
}
