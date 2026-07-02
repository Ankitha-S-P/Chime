package com.ankitha.chime.controller;

import com.ankitha.chime.dto.request.SendMessageRequest;
import com.ankitha.chime.dto.response.MessageResponse;
import com.ankitha.chime.dto.response.PagedMessagesResponse;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/rooms/{roomId}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // REST endpoint — standard HTTP send
    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID roomId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendMessage(roomId, request, currentUser));
    }

    // WebSocket endpoint — STOMP message mapping
    @MessageMapping("/chat.{roomId}")
    public void sendMessageWs(
            @DestinationVariable UUID roomId,
            @Payload SendMessageRequest request,
            Principal principal) {

        if (principal == null) {
            return; // unauthenticated WebSocket connection, ignore
        }

        UsernamePasswordAuthenticationToken auth =
                (UsernamePasswordAuthenticationToken) principal;
        User sender = (User) auth.getPrincipal();

        messageService.sendMessage(roomId, request, sender);
    }

    // Get message history with cursor pagination
    @GetMapping
    public ResponseEntity<PagedMessagesResponse> getMessages(
            @PathVariable UUID roomId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(messageService.getMessages(roomId, before, currentUser));
    }

    // Soft delete a message
    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID roomId,
            @PathVariable UUID messageId,
            @AuthenticationPrincipal User currentUser) {
        messageService.deleteMessage(roomId, messageId, currentUser);
        return ResponseEntity.noContent().build();
    }
}