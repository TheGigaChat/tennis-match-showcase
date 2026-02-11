package com.tennismatch.backend.utils;

import com.tennismatch.backend.repositories.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

// AuthUserIdResolver.java
@Component
@RequiredArgsConstructor
public class AuthUserIdResolver {
    private final UserProfileRepository userRepo;

    public Long resolveUserId(Authentication auth) {
        if (auth == null) throw new IllegalStateException("Unauthorized");
        String principal = auth.getName();
        if (principal == null || principal.isBlank()) {
            throw new IllegalStateException("Empty principal");
        }
        // If principal is already an id, use it
        try { return Long.parseLong(principal); }
        catch (NumberFormatException ignore) { /* fall through */ }

        // Otherwise treat principal as email (adjust if you use a different field)
        return userRepo.findIdByEmail(principal)
                .orElseThrow(() -> new IllegalStateException("User not found by principal: " + principal));
    }
}
