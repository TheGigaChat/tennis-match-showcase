package com.tennismatch.backend.configs;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandlerImpl;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.*;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.tennismatch.backend.services.UserActivityService;
import com.tennismatch.backend.utils.AuthUserIdResolver;
import com.tennismatch.backend.observability.RequestIdFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository csrfRepo = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepo.setHeaderName("X-XSRF-TOKEN");
        csrfRepo.setCookieCustomizer(c -> c
                .sameSite(cookieSecure ? "None" : "Lax")
                .secure(cookieSecure)
                .path("/")
        );
        return csrfRepo;
    }

    @Value("${app.cookies.secure:false}")
    private boolean cookieSecure;

    @Bean
    SecurityFilterChain security(HttpSecurity http,
                                 SecurityContextRepository ctxRepo,
                                 RequestIdFilter requestIdFilter,
                                 Optional<LastActiveFilter> lastActiveFilter,
                                 CookieCsrfTokenRepository csrfRepo) throws Exception {

        CsrfTokenRequestAttributeHandler handler = new CsrfTokenRequestAttributeHandler();
        handler.setCsrfRequestAttributeName("_csrf");

        List<String> csrfIgnored = new ArrayList<>(List.of("/ws/**", "/websocket/**", "/auth/**"));

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepo)
                        .csrfTokenRequestHandler(handler)
                        // allow websocket + auth endpoints without CSRF
                        .ignoringRequestMatchers(csrfIgnored.toArray(String[]::new))
                )
                .securityContext(sc -> sc.securityContextRepository(ctxRepo))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(a -> {
                    a.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    a.requestMatchers("/", "/error").permitAll();
                    a.requestMatchers("/csrf").permitAll();
                    a.requestMatchers("/actuator/health").permitAll();
                    a.requestMatchers("/auth/**").permitAll();
                    a.requestMatchers("/ws", "/ws/**").permitAll();
                    a.anyRequest().authenticated();
                })
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((req, res, ex) ->
                                new AccessDeniedHandlerImpl().handle(req, res, (AccessDeniedException) ex)
                        )
                );

        http.addFilterBefore(requestIdFilter, SecurityContextHolderFilter.class);
        lastActiveFilter.ifPresent(filter -> http.addFilterAfter(filter, SecurityContextHolderFilter.class));

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        // Placeholder origins for public showcase; replace for local/dev.
        cfg.setAllowedOrigins(List.of(
                "https://your-frontend.example.com",
                "https://www.your-frontend.example.com",
                "http://localhost:3000"));
        cfg.setAllowedMethods(List.of("GET","POST","PATCH","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of(
                "Content-Type",
                "Accept",
                "X-XSRF-TOKEN",
                "X-CSRF-TOKEN",
                "X-TM-Refresh",
                "X-REFRESH-RETRIED",
                "Idempotency-Key",
                "x-csrf-retried"
        ));
        cfg.setExposedHeaders(List.of("Server-Timing", "X-Request-Id"));
        cfg.setAllowCredentials(true);
        var src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    // In-memory example — replace with your UserDetailsService in production
    @Bean
    UserDetailsService uds() {
        return new InMemoryUserDetailsManager(); // empty — login handled manually
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    RequestIdFilter requestIdFilter() {
        return new RequestIdFilter();
    }


    @Bean
    LastActiveFilter lastActiveFilter(UserActivityService userActivityService,
                                      AuthUserIdResolver authUserIdResolver) {
        return new LastActiveFilter(authUserIdResolver, userActivityService, Duration.ofMinutes(15));
    }

}
