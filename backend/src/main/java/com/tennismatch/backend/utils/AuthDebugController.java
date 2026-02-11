package com.tennismatch.backend.utils;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthDebugController {

    private final AuthUserIdResolver idResolver;

    @GetMapping("/whoami")
    public Map<String, Object> whoami(Authentication auth) {
        long me = idResolver.resolveUserId(auth); // return numeric userId
        return Map.of("userId", me);
    }
}
