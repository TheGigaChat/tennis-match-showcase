package com.tennismatch.backend.services;

import com.tennismatch.backend.domain.dto.requests.ProfilePatchRequest;
import com.tennismatch.backend.domain.dto.responses.ProfileResponse;
import jakarta.transaction.Transactional;

public interface ProfileCompletionService {
    @Transactional
    ProfileResponse getProfile(String email);

    @Transactional
    void patchProfile(String email, ProfilePatchRequest req);
}
