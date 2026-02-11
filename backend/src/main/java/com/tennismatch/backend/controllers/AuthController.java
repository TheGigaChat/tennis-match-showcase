package com.tennismatch.backend.controllers;
// api/AuthController.java

import com.tennismatch.backend.domain.dto.requests.RegisterRequest;
import com.tennismatch.backend.domain.dto.requests.ResendRequest;
import com.tennismatch.backend.domain.dto.requests.VerifyRequest;
import com.tennismatch.backend.domain.dto.responses.MeProfileResponse;
import com.tennismatch.backend.domain.dto.responses.NextStepResponse;
import com.tennismatch.backend.domain.entries.OnboardingStatus;
import com.tennismatch.backend.domain.entries.UserProfile;
import com.tennismatch.backend.repositories.OnboardingStatusRepository;
import com.tennismatch.backend.repositories.UserProfileRepository;
import com.tennismatch.backend.services.AuthFlowService;
import com.tennismatch.backend.services.ProfileReadService;
import com.tennismatch.backend.services.RefreshTokenService;
import com.tennismatch.backend.utils.RefreshCookieService;
import jakarta.transaction.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    // Placeholder allowlist for public showcase; replace with real frontend origins for local/dev.
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "https://your-frontend.example.com",
            "https://www.your-frontend.example.com",
            "http://localhost:3000"
    );

    private final AuthFlowService flows;
    private final OnboardingStatusRepository onboardingStatusRepository;
    private final UserProfileRepository userRepo; // already available in your repo
    private final SecurityContextRepository securityContextRepository;
    private final RefreshTokenService refreshTokenService;
    private final RefreshCookieService refreshCookieService;
    private final ProfileReadService profileReadService;
    private final CsrfTokenRepository csrfTokenRepository;

    @Value("${app.cookies.secure:false}")
    private boolean cookieSecure;

    @PostMapping("/register")
    public NextStepResponse register(@RequestBody @Valid RegisterRequest req) {
        return flows.start(req.getEmail()); // do not create a session here!
    }

    @PostMapping("/verify")
    @Transactional
    public NextStepResponse verify(@RequestBody @Valid VerifyRequest req,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        String email = flows.verifyAndGetEmail(req.getFlowId(), req.getCode());

        UserProfile user;
        var existing = userRepo.findByEmail(email);
        if (existing.isPresent()) {
            user = existing.get();
        } else {
            UserProfile u = new UserProfile();
            u.setEmail(email);
            u.setVisible(true);
            user = userRepo.save(u);

            OnboardingStatus status = OnboardingStatus.builder()
                    .user(user)
                    .createdAt(OffsetDateTime.now())
                    .build();
            onboardingStatusRepository.save(status);
        }

        var auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        saveSession(auth, request, response);
        String refreshToken = refreshTokenService.issueToken(user.getId());
        refreshCookieService.setRefreshCookie(response, refreshToken);

        // Decide next step
        String next = (user.getName() == null || user.getName().isBlank())
                ? "COMPLETE_PROFILE" : "GO_TO_PROFILE";

        return new NextStepResponse(null, next);
    }

    @PostMapping("/resend")
    public NextStepResponse resend(@RequestBody @Valid ResendRequest req) {
        // Important: do NOT create a session here. This is a pre-auth phase.
        return flows.resend(req.getFlowId());
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        UserProfile user = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of("email", user.getEmail(), "name", user.getName());
    }

    @PostMapping("/refresh")
    public ResponseEntity<MeProfileResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        requireRefreshHeaderAndOrigin(request);

        String token = getCookieValue(request, refreshCookieService.getCookieName());
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing refresh token");
        }

        RefreshTokenService.RefreshRotation rotation = refreshTokenService.rotate(token);
        UserProfile user = userRepo.findById(rotation.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        var auth = new UsernamePasswordAuthenticationToken(
                user.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        saveSession(auth, request, response);
        refreshCookieService.setRefreshCookie(response, rotation.newToken());
        ensureCsrfCookie(request, response);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(profileReadService.readMe(user.getEmail()));
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request, HttpServletResponse response) {
        requireRefreshHeaderAndOrigin(request);

        String token = getCookieValue(request, refreshCookieService.getCookieName());
        if (StringUtils.hasText(token)) {
            refreshTokenService.revoke(token);
        }

        var session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();

        refreshCookieService.clearRefreshCookie(response);
        clearSessionCookie(response);

        return Map.of("ok", true);
    }

//    @PostMapping("/logout")
//    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
//        var session = request.getSession(false);
//        if (session != null) {
//            session.invalidate();
//        }
//        SecurityContextHolder.clearContext();
//        // Optionally expire JSESSIONID for clients that honor it
//        // ResponseCookie expired = ResponseCookie.from("JSESSIONID", "")
//        //         .path("/")
//        //         .maxAge(0)
//        //         .httpOnly(true)
//        //         .build();
//        // return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, expired.toString()).build();
//        return ResponseEntity.noContent().build();
//    }

    private void saveSession(UsernamePasswordAuthenticationToken auth,
                             HttpServletRequest request,
                             HttpServletResponse response) {
        // Ensure a session exists and rotate the ID before saving the context (session fixation protection)
        request.getSession(true);
        request.changeSessionId();

        // Create + save context to session
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        securityContextRepository.saveContext(context, request, response);
    }

    private void requireRefreshHeaderAndOrigin(HttpServletRequest request) {
        String header = request.getHeader("X-TM-Refresh");
        if (!"1".equals(header)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing X-TM-Refresh");
        }
        String origin = request.getHeader("Origin");
        if (!StringUtils.hasText(origin) || !ALLOWED_ORIGINS.contains(origin)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Origin not allowed");
        }
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        var cookies = request.getCookies();
        if (cookies == null) return null;
        for (var cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private void clearSessionCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void ensureCsrfCookie(HttpServletRequest request, HttpServletResponse response) {
        CsrfToken token = csrfTokenRepository.loadToken(request);
        if (token == null) {
            token = csrfTokenRepository.generateToken(request);
        }
        csrfTokenRepository.saveToken(token, request, response);
    }
}

