package com.tennismatch.backend.chat.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@RequiredArgsConstructor
@Configuration
class WsEndpointCustomizer implements WebSocketMessageBrokerConfigurer {
    private final AuthHandshakeInterceptor interceptor;
    private final UserPrincipalHandshakeHandler principal;

//    @Override
//    public void registerStompEndpoints(StompEndpointRegistry registry) {
//        registry.addEndpoint("/ws")
//                .addInterceptors(interceptor)
//                .setHandshakeHandler(principal)
//                .setAllowedOriginPatterns("*")
//                .withSockJS();
//    }
}