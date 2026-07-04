package com.ankitha.chime.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimiterService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String RATE_LIMIT_PREFIX = "ratelimit:";
    private static final int MAX_REQUESTS = 60;
    private static final long WINDOW_SECONDS = 60;

    public boolean isAllowed(String identifier) {
        try {
            String key = RATE_LIMIT_PREFIX + identifier;
            long now = Instant.now().toEpochMilli();
            long windowStart = now - (WINDOW_SECONDS * 1000);

            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
            Long count = redisTemplate.opsForZSet().zCard(key);

            if (count != null && count >= MAX_REQUESTS) {
                log.warn("Rate limit exceeded for: {}", identifier);
                return false;
            }

            redisTemplate.opsForZSet().add(key, String.valueOf(System.nanoTime()), now);
            redisTemplate.expire(key, WINDOW_SECONDS, TimeUnit.SECONDS);
            return true;

        } catch (Exception e) {
            // If Redis is unavailable, fail open (allow request) rather than blocking all traffic
            log.error("Rate limiter Redis error — failing open: {}", e.getMessage());
            return true;
        }
    }
}
