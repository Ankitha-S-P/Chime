package com.ankitha.chime.service;

import com.ankitha.chime.dto.request.SendMessageRequest;
import com.ankitha.chime.dto.response.MessageResponse;
import com.ankitha.chime.dto.response.PagedMessagesResponse;
import com.ankitha.chime.entity.Message;
import com.ankitha.chime.entity.Room;
import com.ankitha.chime.entity.User;
import com.ankitha.chime.exception.AppException;
import com.ankitha.chime.repository.MessageRepository;
import com.ankitha.chime.repository.RoomMemberRepository;
import com.ankitha.chime.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SanitizationService sanitizationService;
    private final AuditService auditService;

    private static final int PAGE_SIZE = 50;

    @Transactional
    public MessageResponse sendMessage(UUID roomId, SendMessageRequest request, User sender) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new AppException("Room not found", HttpStatus.NOT_FOUND));

        boolean isMember = roomMemberRepository
                .findByRoomIdAndUserId(roomId, sender.getId()).isPresent();

        if (!isMember) {
            throw new AppException("You are not a member of this room", HttpStatus.FORBIDDEN);
        }

        Message replyTo = null;
        if (request.getReplyToId() != null) {
            replyTo = messageRepository.findById(request.getReplyToId())
                    .orElseThrow(() -> new AppException("Reply target not found", HttpStatus.NOT_FOUND));
        }

        String sanitizedContent = sanitizationService.sanitize(request.getContent());
        Message message = Message.builder()
                .room(room)
                .sender(sender)
                .content(sanitizedContent)
                .type(request.getType() != null ? request.getType() : Message.MessageType.TEXT)
                .replyTo(replyTo)
                .deleted(false)
                .build();

        message = messageRepository.save(message);

        MessageResponse response = toMessageResponse(message);

        // Broadcast to all subscribers of this room via WebSocket
        messagingTemplate.convertAndSend("/topic/room." + roomId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public PagedMessagesResponse getMessages(UUID roomId, LocalDateTime before, User currentUser) {
        boolean isMember = roomMemberRepository
                .findByRoomIdAndUserId(roomId, currentUser.getId()).isPresent();

        if (!isMember) {
            throw new AppException("You are not a member of this room", HttpStatus.FORBIDDEN);
        }

        List<Message> messages;

        if (before == null) {
            // First page — no cursor
            messages = messageRepository.findFirstPage(
                    roomId, PageRequest.of(0, PAGE_SIZE + 1));
        } else {
            // Subsequent pages — use cursor
            messages = messageRepository.findWithCursor(
                    roomId, before, PageRequest.of(0, PAGE_SIZE + 1));
        }

        boolean hasMore = messages.size() > PAGE_SIZE;
        if (hasMore) {
            messages = messages.subList(0, PAGE_SIZE);
        }

        LocalDateTime nextCursor = hasMore
                ? messages.get(messages.size() - 1).getCreatedAt()
                : null;

        return PagedMessagesResponse.builder()
                .messages(messages.stream().map(this::toMessageResponse).toList())
                .nextCursor(nextCursor)
                .hasMore(hasMore)
                .build();
    }

    @Transactional
    public void deleteMessage(UUID roomId, UUID messageId, User currentUser) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new AppException("Message not found", HttpStatus.NOT_FOUND));

        if (!message.getRoom().getId().equals(roomId)) {
            throw new AppException("Message not in this room", HttpStatus.BAD_REQUEST);
        }

        boolean isOwner = message.getSender().getId().equals(currentUser.getId());
        boolean isAdmin = roomMemberRepository.isAdmin(roomId, currentUser.getId());

        if (!isOwner && !isAdmin) {
            throw new AppException("You cannot delete this message", HttpStatus.FORBIDDEN);
        }

        // Soft delete — never hard delete messages
        message.setDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        message.setContent("[This message was deleted]");
        messageRepository.save(message);

        // Broadcast the deletion event
        messagingTemplate.convertAndSend("/topic/room." + roomId,
                toMessageResponse(message));
        auditService.log("MESSAGE_DELETE", "MESSAGE", messageId, currentUser,
                Map.of("roomId", roomId.toString(), "deletedBy", currentUser.getUsername()));
    }

    private MessageResponse toMessageResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoom().getId())
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderUsername(message.getSender() != null ? message.getSender().getUsername() : "System")
                .content(message.isDeleted() ? "[This message was deleted]" : message.getContent())
                .type(message.getType())
                .replyToId(message.getReplyTo() != null ? message.getReplyTo().getId() : null)
                .replyToContent(message.getReplyTo() != null ? message.getReplyTo().getContent() : null)
                .deleted(message.isDeleted())
                .editedAt(message.getEditedAt())
                .createdAt(message.getCreatedAt())
                .build();
    }
}