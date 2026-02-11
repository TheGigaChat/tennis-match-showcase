package com.tennismatch.backend.utils;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshCookieService {

    @Value("${app.refresh.cookie-name:TM_REFRESH}")
    private String cookieName;

    @Value("${app.refresh.cookie-path:/auth}")
    private String cookiePath;

    @Value("${app.refresh.days:7}")
    private long refreshDays;

    @Value("${app.cookies.secure:false}")
    private boolean cookieSecure;

    public String getCookieName() {
        return cookieName;
    }

    public String getCookiePath() {
        return cookiePath;
    }

    public void setRefreshCookie(HttpServletResponse response, String tokenPlaintext) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, tokenPlaintext)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path(cookiePath)
                .maxAge(Duration.ofDays(refreshDays))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path(cookiePath)
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
