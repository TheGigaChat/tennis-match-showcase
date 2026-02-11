package com.tennismatch.backend.controllers;

import com.tennismatch.backend.domain.dto.requests.OnboardingStepCompleteRequest;
import com.tennismatch.backend.domain.dto.responses.OnboardingStatusResponse;
import com.tennismatch.backend.services.OnboardingStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class OnboardingStatusController {
    private final OnboardingStatusService onboardingStatusService;

    @GetMapping("/onboarding-status")
    public ResponseEntity<OnboardingStatusResponse> getStatus(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(onboardingStatusService.getStatusForUser(auth.getName()));
    }

    @PostMapping("/onboarding-status/reset")
    public ResponseEntity<Void> reset(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        onboardingStatusService.resetForUser(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/onboarding-status/complete")
    public ResponseEntity<Void> markComplete(@RequestBody OnboardingStepCompleteRequest req,
                                             Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        onboardingStatusService.markStepCompleted(auth.getName(), req.getStep());
        return ResponseEntity.noContent().build();
    }
}
