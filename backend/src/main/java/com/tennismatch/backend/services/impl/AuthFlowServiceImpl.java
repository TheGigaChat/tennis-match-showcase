package com.tennismatch.backend.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resend.Resend;
import com.tennismatch.backend.domain.dto.auth.AuthFlowDto;
import com.tennismatch.backend.domain.dto.responses.NextStepResponse;
import com.tennismatch.backend.services.AuthFlowService;
import com.tennismatch.backend.services.EmailSender;
import com.tennismatch.backend.services.FlowStore;
import jakarta.mail.MessagingException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.UUID;
import java.time.Instant;
import java.util.Objects;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthFlowServiceImpl implements AuthFlowService {


    private final FlowStore store;
    private final EmailSender emailSender;

    @Value("${app.mail.from}") private String from;
    @Value("${app.mail.projectName}") private String projectName;
    @Value("${localhost.boolean:false}") private boolean localhostIsActive;
//    @Value("${resend.api-key}") private String resendApiKey;

    private final ObjectMapper mapper = new ObjectMapper();
    private static final Duration FLOW_TTL = Duration.ofMinutes(10);

    private String key(String flowId) { return "auth:flow:" + flowId; }
    private String resendCooldownKey(String flowId) { return "auth:resend:cooldown:" + flowId; }
    private String resendCountKey(String flowId){ return "auth:resend:count:" + flowId; }

    @Override
    public NextStepResponse start(String email) {
        String flowId = UUID.randomUUID().toString();
        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));

        AuthFlowDto flow = AuthFlowDto.builder()
                .email(email)
                .code(code)
                .attempts(0)
                .expiresAtEpochSec(Instant.now().plus(FLOW_TTL).getEpochSecond())
                .resendCount(0)
                .resendCooldownUntilEpochSec(Instant.now().getEpochSecond())
                .build();

        store.save(flowId, flow, FLOW_TTL);

        if (!localhostIsActive) {
            try {
                emailSender.sendVerificationCodeHtml(email, code);
            } catch (RuntimeException ex) {
                store.delete(flowId);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email service unavailable");
            }
        } else {
            System.out.println("[AUTH] email=" + flow.getEmail() + " code=" + code);
        }

        return new NextStepResponse(flowId, "VERIFY_CODE");
    }

    @Override
    public String verifyAndGetEmail(String flowId, String code) {
        AuthFlowDto flow = store.find(flowId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.GONE, "Flow not found or expired"));

        if (Instant.now().getEpochSecond() > flow.getExpiresAtEpochSec()) {
            store.delete(flowId);
            throw new ResponseStatusException(HttpStatus.GONE, "Flow expired");
        }

        if (!flow.getCode().equals(code)) {
            flow.setAttempts(flow.getAttempts() + 1);
            // keep same ttl “approximately”; simplest is to just save again with remaining ttl
            long remainingSec = flow.getExpiresAtEpochSec() - Instant.now().getEpochSecond();
            if (remainingSec <= 0) remainingSec = 1;
            store.save(flowId, flow, Duration.ofSeconds(remainingSec));
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid code");
        }

        store.delete(flowId);
        return flow.getEmail();
    }

    @Override
    public NextStepResponse resend(String flowId) {
        AuthFlowDto flow = store.find(flowId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flow expired"));

        long now = Instant.now().getEpochSecond();

        // expired flow
        if (now > flow.getExpiresAtEpochSec()) {
            store.delete(flowId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flow expired");
        }

        // cooldown: not more often than once per 30s
        if (flow.getResendCooldownUntilEpochSec() > now) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Try again shortly");
        }

        // count limit: max 3 resends per flow lifetime (or per 10 min TTL window)
        if (flow.getResendCount() >= 3) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many resends");
        }

        // generate NEW code
        String newCode = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        flow.setCode(newCode);

        // anti-spam state updates
        flow.setResendCount(flow.getResendCount() + 1);
        flow.setResendCooldownUntilEpochSec(now + 30);

        // extend TTL (same as your previous logic)
        long newExpires = Instant.now().plus(FLOW_TTL).getEpochSecond();
        flow.setExpiresAtEpochSec(newExpires);

        // save with TTL = FLOW_TTL (DB store will persist; Redis store will set ttl)
        store.save(flowId, flow, FLOW_TTL);

        if (!localhostIsActive) {
            try {
                emailSender.sendVerificationCodeHtml(flow.getEmail(), newCode);
            } catch (RuntimeException ex) {
                store.delete(flowId);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Email service unavailable");
            }
        } else {
            System.out.println("[AUTH] email=" + flow.getEmail() + " code=" + newCode);
        }

        return new NextStepResponse(flowId, "VERIFY_CODE");
    }

//    private void sendVerificationCodeHtml(String toEmail, String code) {
//        Resend resend = new Resend(resendApiKey);
//        var mime = mailSender.createMimeMessage();
//        var helper = new MimeMessageHelper(mime, "UTF-8");
//        try {
//        helper.setFrom(from);
//        helper.setTo(toEmail);
//        helper.setSubject("[" + projectName + "] Verification code");
//            helper.setText("""
//            <div style="font-family:Arial,sans-serif">
//              <p>Hello!</p>
//              <p>Your verification code:</p>
//              <p style="font-size:22px;font-weight:700;letter-spacing:2px">%s</p>
//              <p>This code expires in <b>10 minutes</b>.</p>
//              <p>— %s Team</p>
//            </div>
//        """.formatted(code, projectName), true);
//        } catch (MessagingException e) {
//            throw new RuntimeException(e);
//        }
//        mailSender.send(mime);
//        System.out.println("Code via email has been sent.");
//    }
}
