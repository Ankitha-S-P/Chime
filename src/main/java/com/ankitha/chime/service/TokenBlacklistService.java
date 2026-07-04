package com.ankitha.chime.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String BLACKLIST_PREFIX = "blacklist:";

    public void blacklist(String token, long ttlMillis) {
        try {
            String key = BLACKLIST_PREFIX + token;
            redisTemplate.opsForValue().set(key, "revoked", ttlMillis, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.warn("Redis unavailable — could not blacklist token: {}", e.getMessage());
        }
    }

    public boolean isBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
        } catch (Exception e) {
            // Fail-open: if Redis is down we can't check the blacklist,
            // so we allow the request through rather than blocking all users.
            log.warn("Redis unavailable — skipping blacklist check, allowing request: {}", e.getMessage());
            return false;
        }
    }
}