package com.ankitha.chime.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String PRESENCE_PREFIX = "presence:";
    private static final long PRESENCE_TTL_SECONDS = 60;

    public void markOnline(UUID userId) {
        redisTemplate.opsForValue().set(
                PRESENCE_PREFIX + userId,
                "online",
                PRESENCE_TTL_SECONDS,
                TimeUnit.SECONDS
        );
    }

    public void markOffline(UUID userId) {
        redisTemplate.delete(PRESENCE_PREFIX + userId);
    }

    public boolean isOnline(UUID userId) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(PRESENCE_PREFIX + userId)
        );
    }

    public List<UUID> getOnlineUserIds(List<UUID> userIds) {
        // Check presence for each member — only return those with an active Redis key
        return userIds.stream()
                .filter(this::isOnline)
                .toList();
    }
}