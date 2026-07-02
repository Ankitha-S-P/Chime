package com.ankitha.chime.service;

import com.ankitha.chime.entity.AuditLog;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, UUID entityId,
                    User actor, Map<String, Object> metadata) {
        try {
            AuditLog entry = AuditLog.builder()
                    .actor(actor)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .metadata(metadata)
                    .build();

            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Audit failures must never break the main flow
            log.error("Failed to write audit log: action={}, entity={}/{}",
                    action, entityType, entityId, e);
        }
    }
}