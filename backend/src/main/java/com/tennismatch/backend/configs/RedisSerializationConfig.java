package com.tennismatch.backend.configs;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.TypeResolverBuilder;
import com.tennismatch.backend.chat.domain.dto.ConversationListDto;
import com.tennismatch.backend.domain.dto.DeckCandidateDto;
import com.tennismatch.backend.domain.dto.responses.MeProfileResponse;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisSerializationConfig {

  @Bean
  public RedisSerializer<Object> redisValueSerializer(ObjectMapper baseMapper) {
    ObjectMapper redisObjectMapper = createRedisObjectMapper(baseMapper);
    return new GenericJackson2JsonRedisSerializer(redisObjectMapper);
  }

  @Bean
  public RedisSerializer<MeProfileResponse> profileMeCacheSerializer(ObjectMapper baseMapper) {
    ObjectMapper mapper = createCacheObjectMapper(baseMapper);
    Jackson2JsonRedisSerializer<MeProfileResponse> serializer =
        new Jackson2JsonRedisSerializer<>(MeProfileResponse.class);
    serializer.setObjectMapper(mapper);
    return serializer;
  }

  @Bean
  public RedisSerializer<List<ConversationListDto>> conversationsCacheSerializer(
      ObjectMapper baseMapper) {
    ObjectMapper mapper = createCacheObjectMapper(baseMapper);
    JavaType type = mapper.getTypeFactory()
        .constructCollectionType(List.class, ConversationListDto.class);
    Jackson2JsonRedisSerializer<List<ConversationListDto>> serializer =
        new Jackson2JsonRedisSerializer<>(type);
    serializer.setObjectMapper(mapper);
    return serializer;
  }

  @Bean
  public RedisSerializer<List<DeckCandidateDto>> deckCacheSerializer(ObjectMapper baseMapper) {
    ObjectMapper mapper = createCacheObjectMapper(baseMapper);
    JavaType type = mapper.getTypeFactory()
        .constructCollectionType(List.class, DeckCandidateDto.class);
    Jackson2JsonRedisSerializer<List<DeckCandidateDto>> serializer =
        new Jackson2JsonRedisSerializer<>(type);
    serializer.setObjectMapper(mapper);
    return serializer;
  }

  static ObjectMapper createCacheObjectMapper(ObjectMapper baseMapper) {
    ObjectMapper mapper = baseMapper.copy().findAndRegisterModules();
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return mapper;
  }

  static ObjectMapper createRedisObjectMapper(ObjectMapper baseMapper) {
    ObjectMapper mapper = baseMapper.copy().findAndRegisterModules();
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
        .allowIfSubType("com.tennismatch.")
        .build();

    TypeResolverBuilder<?> typer = new ObjectMapper.DefaultTypeResolverBuilder(
        ObjectMapper.DefaultTyping.NON_FINAL, ptv) {
      @Override
      public boolean useForType(JavaType type) {
        if (type.isArrayType() || type.isCollectionLikeType() || type.isMapLikeType()) {
          return false;
        }
        Class<?> rawClass = type.getRawClass();
        if (rawClass.equals(Object.class)) {
          return true;
        }
        return rawClass.getName().startsWith("com.tennismatch.");
      }
    };
    typer = typer.init(JsonTypeInfo.Id.CLASS, null);
    typer = typer.inclusion(JsonTypeInfo.As.PROPERTY);
    typer = typer.typeProperty("@class");
    mapper.setDefaultTyping(typer);

    return mapper;
  }

  @Bean
  public RedisTemplate<String, Object> redisTemplate(
      RedisConnectionFactory connectionFactory,
      RedisSerializer<Object> redisValueSerializer) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);
    StringRedisSerializer stringSerializer = new StringRedisSerializer();
    template.setKeySerializer(stringSerializer);
    template.setHashKeySerializer(stringSerializer);
    template.setValueSerializer(redisValueSerializer);
    template.setHashValueSerializer(redisValueSerializer);
    template.afterPropertiesSet();
    return template;
  }
}
