package com.ankitha.chime.controller;

import com.ankitha.chime.dto.request.CreateRoomRequest;
import com.ankitha.chime.dto.request.InviteMemberRequest;
import com.ankitha.chime.dto.request.UpdateRoomRequest;
import com.ankitha.chime.dto.response.RoomMemberResponse;
import com.ankitha.chime.dto.response.RoomResponse;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.ankitha.chime.repository.RoomMemberRepository;
import com.ankitha.chime.service.PresenceService;
import com.ankitha.chime.exception.AppException;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final PresenceService presenceService;
    private final RoomMemberRepository roomMemberRepository;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody CreateRoomRequest request,
                                                   @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.createRoom(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getMyRooms(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(roomService.getMyRooms(currentUser));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable UUID roomId,
                                                @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(roomService.getRoom(roomId, currentUser));
    }

    @PatchMapping("/{roomId}")
    public ResponseEntity<RoomResponse> updateRoom(@PathVariable UUID roomId,
                                                   @Valid @RequestBody UpdateRoomRequest request,
                                                   @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(roomService.updateRoom(roomId, request, currentUser));
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<RoomMemberResponse>> getMembers(@PathVariable UUID roomId,
                                                               @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(roomService.getMembers(roomId, currentUser));
    }

    @PostMapping("/{roomId}/members")
    public ResponseEntity<RoomMemberResponse> inviteMember(@PathVariable UUID roomId,
                                                           @Valid @RequestBody InviteMemberRequest request,
                                                           @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.inviteMember(roomId, request, currentUser));
    }

    @DeleteMapping("/{roomId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID roomId,
                                             @PathVariable UUID userId,
                                             @AuthenticationPrincipal User currentUser) {
        roomService.removeMember(roomId, userId, currentUser);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{roomId}/members/online")
    public ResponseEntity<List<UUID>> getOnlineMembers(
            @PathVariable UUID roomId,
            @AuthenticationPrincipal User currentUser) {

        // Verify requester is a member
        roomMemberRepository.findByRoomIdAndUserId(roomId, currentUser.getId())
                .orElseThrow(() -> new AppException(
                        "You are not a member of this room", HttpStatus.FORBIDDEN));

        List<UUID> memberIds = roomMemberRepository.findByRoomId(roomId)
                .stream()
                .map(rm -> rm.getUser().getId())
                .toList();

        return ResponseEntity.ok(presenceService.getOnlineUserIds(memberIds));
    }
}