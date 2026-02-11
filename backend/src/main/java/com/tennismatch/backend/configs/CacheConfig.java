package com.tennismatch.backend.configs;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

  public static final String PROFILE_ME_CACHE = "profile:me";
  public static final String CONVERSATIONS_CACHE = "me:conversations";
  public static final String DECK_CACHE = "me:deck";

  public static final String CACHE_KEY_PREFIX = "tinder:v8:";
}
