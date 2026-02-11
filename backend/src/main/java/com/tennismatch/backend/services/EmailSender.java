package com.tennismatch.backend.services;

public interface EmailSender {
    void sendVerificationCodeHtml(String toEmail, String code);
    void sendNotificationEmail(String toEmail, String subject, String heading, String message, String ctaUrl);
}
