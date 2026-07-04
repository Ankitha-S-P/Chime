package com.ankitha.chime.repository;

import com.ankitha.chime.entity.RoomMember;
import com.ankitha.chime.entity.RoomMemberId;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    @Query("SELECT rm FROM RoomMember rm JOIN FETCH rm.user WHERE rm.room.id = :roomId")
    List<RoomMember> findByRoomId(UUID roomId);

    @Query("SELECT rm FROM RoomMember rm JOIN FETCH rm.user WHERE rm.room.id = :roomId AND rm.user.id = :userId")
    Optional<RoomMember> findByRoomIdAndUserId(UUID roomId, UUID userId);

    @Query("""
        SELECT CASE WHEN COUNT(rm) > 0 THEN true ELSE false END
        FROM RoomMember rm
        WHERE rm.room.id = :roomId
        AND rm.user.id = :userId
        AND rm.role = com.ankitha.chime.entity.RoomMember$MemberRole.ADMIN
    """)
    boolean isAdmin(UUID roomId, UUID userId);
}
