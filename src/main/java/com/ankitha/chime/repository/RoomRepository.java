package com.ankitha.chime.repository;

import com.ankitha.chime.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    @Query("""
        SELECT r FROM Room r
        JOIN RoomMember rm ON rm.room = r
        WHERE rm.user.id = :userId
        ORDER BY r.updatedAt DESC
    """)
    List<Room> findAllByMemberId(UUID userId);

    @Query("""
        SELECT CASE WHEN COUNT(rm) > 0 THEN true ELSE false END
        FROM RoomMember rm
        WHERE rm.room.id = :roomId AND rm.user.id = :userId
    """)
    boolean isMember(UUID roomId, UUID userId);
}