package com.tennismatch.backend.chat.websocket;

import com.tennismatch.backend.utils.AuthUserIdResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuthHandshakeInterceptor implements HandshakeInterceptor {

    private final AuthUserIdResolver idResolver;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {

        // 1) Get Authentication from the HTTP handshake request
        var servletReq = ((ServletServerHttpRequest) request).getServletRequest();
        var principal = servletReq.getUserPrincipal(); // Spring Security already ran for this HTTP request
        if (!(principal instanceof Authentication auth)) {
            return false; // not authenticated — reject WS
        }

        // 2) Use the same resolver as REST
        long userId = idResolver.resolveUserId(auth);

        // 3) Store userId in session attributes — HandshakeHandler will build Principal
        attributes.put("userId", userId);
        return true;
    }

    @Override public void afterHandshake(ServerHttpRequest r, ServerHttpResponse s, WebSocketHandler h, Exception e) {}
}
