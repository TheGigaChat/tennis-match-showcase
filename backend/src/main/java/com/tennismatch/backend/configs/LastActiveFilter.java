package com.tennismatch.backend.configs;

import com.tennismatch.backend.services.UserActivityService;
import com.tennismatch.backend.utils.AuthUserIdResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

public class LastActiveFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LastActiveFilter.class);

    private final AuthUserIdResolver authUserIdResolver;
    private final UserActivityService userActivityService;
    private final Duration minInterval;

    public LastActiveFilter(AuthUserIdResolver authUserIdResolver,
                            UserActivityService userActivityService,
                            Duration minInterval) {
        this.authUserIdResolver = authUserIdResolver;
        this.userActivityService = userActivityService;
        this.minInterval = minInterval;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        if (path == null) return true;
        return path.startsWith("/auth")
                || path.startsWith("/ws")
                || path.startsWith("/websocket")
                || path.startsWith("/csrf")
                || path.startsWith("/actuator")
                || path.startsWith("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            try {
                Long userId = authUserIdResolver.resolveUserId(auth);
                userActivityService.touchLastActive(userId, minInterval);
            } catch (RuntimeException ex) {
                log.warn("LAST_ACTIVE_UPDATE_FAILED path={} message={}", request.getRequestURI(), ex.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }
}
