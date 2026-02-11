package com.tennismatch.backend.controllers;

import com.tennismatch.backend.domain.dto.requests.ProfilePatchRequest;
import com.tennismatch.backend.domain.dto.responses.MeProfileResponse;
import com.tennismatch.backend.domain.dto.responses.ProfileResponse;
import com.tennismatch.backend.services.ProfileCompletionService;
import com.tennismatch.backend.services.ProfileReadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileCompletionService service;
    private final ProfileReadService readService;

    /** Read current profile (prefill/edit) */
    @GetMapping
    public ProfileResponse getProfile(Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return service.getProfile(auth.getName());
    }

    /** Partial update: send any subset of fields */
    @PatchMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MeProfileResponse> patchProfile(@Valid @RequestBody ProfilePatchRequest req,
                                             Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        service.patchProfile(auth.getName(), req); // applies only non-null fields
        // Return updated profile data
        MeProfileResponse updatedProfile = readService.readMe(auth.getName());
        return ResponseEntity.ok(updatedProfile);
    }

    @GetMapping("/me")
    public ResponseEntity<MeProfileResponse> getMe(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(readService.readMe(auth.getName()));
    }
}