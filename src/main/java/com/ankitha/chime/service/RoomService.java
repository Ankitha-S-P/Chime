package com.ankitha.chime.service;

import com.ankitha.chime.dto.request.CreateRoomRequest;
import com.ankitha.chime.dto.request.InviteMemberRequest;
import com.ankitha.chime.dto.request.UpdateRoomRequest;
import com.ankitha.chime.dto.response.RoomMemberResponse;
import com.ankitha.chime.dto.response.RoomResponse;
import com.ankitha.chime.entity.*;
import com.ankitha.chime.exception.AppException;
import com.ankitha.chime.repository.RoomMemberRepository;
import com.ankitha.chime.repository.RoomRepository;
import com.ankitha.chime.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, User currentUser) {
        if (request.getType() == Room.RoomType.GROUP &&
                (request.getName() == null || request.getName().isBlank())) {
            throw new AppException("Group rooms must have a name", HttpStatus.BAD_REQUEST);
        }

        // Save the room
        Room room = Room.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .createdBy(currentUser)
                .build();

        room = roomRepository.save(room);

        // Atomically add creator as ADMIN — both happen or neither happens
        RoomMember member = RoomMember.builder()
                .id(new RoomMemberId(room.getId(), currentUser.getId()))
                .room(room)
                .user(currentUser)
                .role(RoomMember.MemberRole.ADMIN)
                .joinedAt(LocalDateTime.now())
                .build();

        roomMemberRepository.save(member);

        return toRoomResponse(room);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getMyRooms(User currentUser) {
        return roomRepository.findAllByMemberId(currentUser.getId())
                .stream()
                .map(room -> toRoomResponseForUser(room, currentUser.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoom(UUID roomId, User currentUser) {
        Room room = findRoomOrThrow(roomId);
        assertMember(roomId, currentUser.getId());
        return toRoomResponse(room);
    }

    @Transactional
    public RoomResponse updateRoom(UUID roomId, UpdateRoomRequest request, User currentUser) {
        Room room = findRoomOrThrow(roomId);
        assertAdmin(roomId, currentUser.getId());

        if (request.getName() != null) room.setName(request.getName());
        if (request.getDescription() != null) room.setDescription(request.getDescription());

        return toRoomResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomMemberResponse inviteMember(UUID roomId, InviteMemberRequest request,
                                           User currentUser) {
        findRoomOrThrow(roomId);
        assertAdmin(roomId, currentUser.getId());

        User invitee = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        boolean alreadyMember = roomMemberRepository
                .findByRoomIdAndUserId(roomId, invitee.getId()).isPresent();

        if (alreadyMember) {
            throw new AppException("User is already a member", HttpStatus.CONFLICT);
        }

        Room room = findRoomOrThrow(roomId);
        RoomMember member = RoomMember.builder()
                .id(new RoomMemberId(roomId, invitee.getId()))
                .room(room)
                .user(invitee)
                .role(RoomMember.MemberRole.MEMBER)
                .joinedAt(LocalDateTime.now())
                .build();

        roomMemberRepository.save(member);
        return toMemberResponse(member);
    }

    @Transactional
    public void removeMember(UUID roomId, UUID targetUserId, User currentUser) {
        findRoomOrThrow(roomId);

        boolean isSelfLeaving = currentUser.getId().equals(targetUserId);

        if (!isSelfLeaving) {
            assertAdmin(roomId, currentUser.getId());
        }

        RoomMember member = roomMemberRepository
                .findByRoomIdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new AppException("Member not found", HttpStatus.NOT_FOUND));

        roomMemberRepository.delete(member);
    }

    @Transactional(readOnly = true)
    public List<RoomMemberResponse> getMembers(UUID roomId, User currentUser) {
        findRoomOrThrow(roomId);
        assertMember(roomId, currentUser.getId());

        return roomMemberRepository.findByRoomId(roomId)
                .stream()
                .map(this::toMemberResponse)
                .toList();
    }

    @Transactional
    public RoomResponse getOrCreateDirectRoom(UUID targetUserId, User currentUser) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND));

        // Check if a DIRECT room already exists between these two users
        List<Room> myRooms = roomRepository.findAllByMemberId(currentUser.getId());
        for (Room room : myRooms) {
            if (room.getType() == Room.RoomType.DIRECT) {
                List<RoomMember> members = roomMemberRepository.findByRoomId(room.getId());
                boolean hasTarget = members.stream()
                        .anyMatch(m -> m.getUser().getId().equals(targetUserId));
                if (hasTarget && members.size() == 2) {
                    return toRoomResponse(room);
                }
            }
        }

        // Create new DIRECT room atomically
        Room room = Room.builder()
                .name(null)
                .type(Room.RoomType.DIRECT)
                .createdBy(currentUser)
                .build();
        room = roomRepository.save(room);

        roomMemberRepository.save(RoomMember.builder()
                .id(new RoomMemberId(room.getId(), currentUser.getId()))
                .room(room).user(currentUser)
                .role(RoomMember.MemberRole.ADMIN)
                .joinedAt(LocalDateTime.now()).build());

        roomMemberRepository.save(RoomMember.builder()
                .id(new RoomMemberId(room.getId(), targetUserId))
                .room(room).user(targetUser)
                .role(RoomMember.MemberRole.MEMBER)
                .joinedAt(LocalDateTime.now()).build());

        return toRoomResponseWithOther(room, targetUser.getUsername());
    }

    // ── helpers ──────────────────────────────────────────────

    private Room findRoomOrThrow(UUID roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));
    }

    private void assertMember(UUID roomId, UUID userId) {
        if (!roomRepository.isMember(roomId, userId)) {
            throw new AppException("You are not a member of this room", HttpStatus.FORBIDDEN);
        }
    }

    private void assertAdmin(UUID roomId, UUID userId) {
        if (!roomMemberRepository.isAdmin(roomId, userId)) {
            throw new AppException("Only admins can perform this action", HttpStatus.FORBIDDEN);
        }
    }

    private RoomResponse toRoomResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType())
                .createdBy(room.getCreatedBy().getId())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private RoomResponse toRoomResponseWithOther(Room room, String otherUsername) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType())
                .createdBy(room.getCreatedBy().getId())
                .otherUsername(otherUsername)
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    private RoomResponse toRoomResponseForUser(Room room, UUID currentUserId) {
        if (room.getType() == Room.RoomType.DIRECT) {
            List<RoomMember> members = roomMemberRepository.findByRoomId(room.getId());
            String otherUsername = members.stream()
                    .filter(m -> !m.getUser().getId().equals(currentUserId))
                    .map(m -> m.getUser().getUsername())
                    .findFirst()
                    .orElse("Direct Message");
            return toRoomResponseWithOther(room, otherUsername);
        }
        return toRoomResponse(room);
    }

    private RoomMemberResponse toMemberResponse(RoomMember member) {
        return RoomMemberResponse.builder()
                .userId(member.getUser().getId())
                .username(member.getUser().getUsername())
                .avatarUrl(member.getUser().getAvatarUrl())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}