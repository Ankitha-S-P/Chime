package com.ankitha.chime.dto.response;

import com.ankitha.chime.entity.RoomMember;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RoomMemberResponse {
    private UUID userId;
    private String username;
    private String avatarUrl;
    private RoomMember.MemberRole role;
    private LocalDateTime joinedAt;
}