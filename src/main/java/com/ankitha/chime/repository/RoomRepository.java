package com.ankitha.chime.repository;

import com.ankitha.chime.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    @Query("""
        SELECT r FROM Room r
        JOIN RoomMember rm ON rm.room = r
        WHERE rm.id.userId = :userId
        ORDER BY r.updatedAt DESC
    """)
    List<Room> findAllByMemberId(@Param("userId") UUID userId);

    @Query("""
        SELECT CASE WHEN COUNT(rm) > 0 THEN true ELSE false END
        FROM RoomMember rm
        WHERE rm.id.roomId = :roomId AND rm.id.userId = :userId
    """)
    boolean isMember(@Param("roomId") UUID roomId, @Param("userId") UUID userId);
}
