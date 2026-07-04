package com.ankitha.chime.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String PRESENCE_PREFIX = "presence:";
    private static final long PRESENCE_TTL_SECONDS = 60;

    public void markOnline(UUID userId) {
        try {
            redisTemplate.opsForValue().set(
                    PRESENCE_PREFIX + userId,
                    "online",
                    PRESENCE_TTL_SECONDS,
                    TimeUnit.SECONDS
            );
        } catch (Exception e) {
            log.warn("Presence markOnline failed (Redis unavailable): {}", e.getMessage());
        }
    }

    public void markOffline(UUID userId) {
        try {
            redisTemplate.delete(PRESENCE_PREFIX + userId);
        } catch (Exception e) {
            log.warn("Presence markOffline failed (Redis unavailable): {}", e.getMessage());
        }
    }

    public boolean isOnline(UUID userId) {
        try {
            return Boolean.TRUE.equals(
                    redisTemplate.hasKey(PRESENCE_PREFIX + userId)
            );
        } catch (Exception e) {
            log.warn("Presence isOnline failed (Redis unavailable): {}", e.getMessage());
            return false;
        }
    }

    public List<UUID> getOnlineUserIds(List<UUID> userIds) {
        try {
            return userIds.stream()
                    .filter(this::isOnline)
                    .toList();
        } catch (Exception e) {
            log.warn("Presence getOnlineUserIds failed (Redis unavailable): {}", e.getMessage());
            return List.of();
        }
    }
}