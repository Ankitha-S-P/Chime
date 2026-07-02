package com.ankitha.chime.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMember {

    @EmbeddedId
    private RoomMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomId")
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private MemberRole role;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    @Column(name = "is_muted", nullable = false)
    private boolean muted = false;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    public enum MemberRole {
        ADMIN, MEMBER
    }
}