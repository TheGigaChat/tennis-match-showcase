package com.tennismatch.backend.utils;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Lightweight endpoint that issues the XSRF-TOKEN cookie.
 * IMPORTANT: injecting CsrfToken triggers Spring to generate
 * the token and set the cookie.
 */
@RestController
public class CsrfController {

    @GetMapping(value = "/csrf", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> csrf(CsrfToken token) {
        // token.getToken() "touches" the token so CookieCsrfTokenRepository adds Set-Cookie XSRF-TOKEN
        String value = token.getToken();

        return ResponseEntity.ok()
                .header("Cache-Control", "no-store")
                .body(Map.of(
                        "token", value,
                        "headerName", token.getHeaderName()
                ));
    }
}
