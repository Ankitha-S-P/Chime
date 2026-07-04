package com.ankitha.chime.repository;

import com.ankitha.chime.entity.RoomMember;
import com.ankitha.chime.entity.RoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    @Query("SELECT rm FROM RoomMember rm JOIN FETCH rm.user WHERE rm.id.roomId = :roomId")
    List<RoomMember> findByRoomId(@Param("roomId") UUID roomId);

    @Query("SELECT rm FROM RoomMember rm JOIN FETCH rm.user WHERE rm.id.roomId = :roomId AND rm.id.userId = :userId")
    Optional<RoomMember> findByRoomIdAndUserId(@Param("roomId") UUID roomId, @Param("userId") UUID userId);

    @Query("""
        SELECT CASE WHEN COUNT(rm) > 0 THEN true ELSE false END
        FROM RoomMember rm
        WHERE rm.id.roomId = :roomId
        AND rm.id.userId = :userId
        AND rm.role = com.ankitha.chime.entity.RoomMember$MemberRole.ADMIN
    """)
    boolean isAdmin(@Param("roomId") UUID roomId, @Param("userId") UUID userId);
}
