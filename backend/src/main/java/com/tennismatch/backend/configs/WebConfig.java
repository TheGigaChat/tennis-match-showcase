package com.tennismatch.backend.configs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    // Placeholder default CORS origins for public showcase; replace for local/dev.
    @Value("${cors.allowed.origins:https://your-frontend.example.com,https://www.your-frontend.example.com,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // CORS is handled in SecurityConfig; no MVC CORS mappings here.
            }
        };
    }
}
