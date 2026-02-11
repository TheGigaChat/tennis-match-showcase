package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.PreferenceDto;
import jakarta.transaction.Transactional;

public interface PreferenceService {
    @Transactional
    PreferenceDto getForUser(String username);

    @Transactional
    PreferenceDto upsertPatch(String username, PreferenceDto patch);

    @Transactional
    void deleteForUser(String username);
}
