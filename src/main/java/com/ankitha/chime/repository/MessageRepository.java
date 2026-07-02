package com.ankitha.chime.repository;

import com.ankitha.chime.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT m FROM Message m
        LEFT JOIN FETCH m.sender
        LEFT JOIN FETCH m.replyTo
        WHERE m.room.id = :roomId
        ORDER BY m.createdAt DESC
    """)
    List<Message> findFirstPage(UUID roomId, Pageable pageable);

    @Query("""
        SELECT m FROM Message m
        LEFT JOIN FETCH m.sender
        LEFT JOIN FETCH m.replyTo
        WHERE m.room.id = :roomId
        AND m.createdAt < :before
        ORDER BY m.createdAt DESC
    """)
    List<Message> findWithCursor(UUID roomId, LocalDateTime before, Pageable pageable);
}