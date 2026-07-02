package com.ankitha.chime.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "ratelimit:";
    private static final int MAX_REQUESTS = 60;
    private static final long WINDOW_SECONDS = 60;

    public boolean isAllowed(String identifier) {
        String key = RATE_LIMIT_PREFIX + identifier;
        long now = Instant.now().toEpochMilli();
        long windowStart = now - (WINDOW_SECONDS * 1000);

        // Remove entries older than the window
        redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);

        // Count remaining requests in window
        Long count = redisTemplate.opsForZSet().zCard(key);

        if (count != null && count >= MAX_REQUESTS) {
            return false;
        }

        // Add current request timestamp as both score and value
        // Using nano time as value to ensure uniqueness
        redisTemplate.opsForZSet().add(key, String.valueOf(System.nanoTime()), now);

        // Reset TTL on every request
        redisTemplate.expire(key, WINDOW_SECONDS, TimeUnit.SECONDS);

        return true;
    }
}