package com.tennismatch.backend.configs;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.*;
import com.tennismatch.backend.chat.domain.dto.ConversationListDto;
import com.tennismatch.backend.domain.dto.DeckCandidateDto;
import com.tennismatch.backend.domain.dto.responses.MeProfileResponse;
import java.time.Duration;
import java.util.List;

@Configuration
@ConditionalOnClass(RedisConnectionFactory.class)
public class RedisConfig {

    // Default cache configuration (Boot will pick up and create RedisCacheManager)
    @Bean
    public RedisCacheConfiguration redisCacheConfiguration(
            @Qualifier("redisValueSerializer") RedisSerializer<Object> redisValueSerializer) {
        return RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(10))
                .computePrefixWith(name -> CacheConfig.CACHE_KEY_PREFIX + name + "::")
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(redisValueSerializer));
    }

    // Per-cache settings (TTL, etc.)
    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer(RedisCacheConfiguration base) {
        return builder -> builder
                .withCacheConfiguration("profiles", base.entryTtl(Duration.ofMinutes(30)))
                .withCacheConfiguration("searchResults", base.entryTtl(Duration.ofMinutes(5)));
    }

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            RedisCacheConfiguration base,
            RedisCacheManagerBuilderCustomizer customizer,
            @Qualifier("profileMeCacheSerializer") RedisSerializer<MeProfileResponse> profileMeCacheSerializer,
            @Qualifier("conversationsCacheSerializer") RedisSerializer<List<ConversationListDto>> conversationsCacheSerializer,
            @Qualifier("deckCacheSerializer") RedisSerializer<List<DeckCandidateDto>> deckCacheSerializer) {
        RedisCacheManager.RedisCacheManagerBuilder builder =
                RedisCacheManager.builder(connectionFactory).cacheDefaults(base);
        customizer.customize(builder);
        builder.withCacheConfiguration(
                CacheConfig.PROFILE_ME_CACHE,
                base.serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(profileMeCacheSerializer)));
        builder.withCacheConfiguration(
                CacheConfig.CONVERSATIONS_CACHE,
                base.serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(conversationsCacheSerializer)));
        RedisCacheConfiguration deckConfig = base.entryTtl(Duration.ofSeconds(5))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(deckCacheSerializer));
        builder.withCacheConfiguration(CacheConfig.DECK_CACHE, deckConfig);
        return builder.build();
    }
}

