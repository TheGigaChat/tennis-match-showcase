package com.tennismatch.backend.services;

public interface RefreshTokenService {

    String issueToken(Long userId);

    RefreshRotation rotate(String tokenPlaintext);

    void revoke(String tokenPlaintext);

    record RefreshRotation(Long userId, String newToken) {}
}
