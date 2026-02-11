package com.tennismatch.backend.services.impl;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.tennismatch.backend.services.EmailSender;
import com.tennismatch.backend.services.EmailTemplates;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResendEmailSender implements EmailSender {

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.projectName}")
    private String projectName;

    @Value("${app.mail.resend.max-attempts:3}")
    private int maxAttempts;

    @Override
    public void sendVerificationCodeHtml(String toEmail, String code) {
        var resend = new Resend(apiKey);

        String html = """
            <div style="font-family:Arial,sans-serif">
              <p>Hello!</p>
              <p>Your verification code:</p>
              <p style="font-size:22px;font-weight:700;letter-spacing:2px">%s</p>
              <p>This code expires in <b>10 minutes</b>.</p>
              <p>— %s Team</p>
            </div>
        """.formatted(code, projectName);

        sendWithRetry(resend, CreateEmailOptions.builder()
                .from(from)
                .to(toEmail)
                .subject("[TennisMatch] Verification code")
                .html(html)
                .build());
    }

    @Override
    public void sendNotificationEmail(String toEmail,
                                      String subject,
                                      String heading,
                                      String message,
                                      String ctaUrl) {
        var resend = new Resend(apiKey);
        String html = EmailTemplates.notificationHtml(projectName, heading, message, ctaUrl, "Continue");

        sendWithRetry(resend, CreateEmailOptions.builder()
                .from(from)
                .to(toEmail)
                .subject("[TennisMatch] " + subject)
                .html(html)
                .build());
    }

    private void sendWithRetry(Resend resend, CreateEmailOptions options) {
        int attempts = Math.max(1, maxAttempts);
        long delayMs = 1000L;
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                resend.emails().send(options);
                return;
            } catch (Exception e) {
                if (attempt == attempts) {
                    throw new RuntimeException(e);
                }
                try {
                    Thread.sleep(delayMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
                delayMs = Math.min(delayMs * 3, 30000L);
            }
        }
    }
}
