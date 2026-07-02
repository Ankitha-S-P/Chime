package com.ankitha.chime.dto.response;

import com.ankitha.chime.entity.Message;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private UUID roomId;
    private UUID senderId;
    private String senderUsername;
    private String content;
    private Message.MessageType type;
    private UUID replyToId;
    private String replyToContent;
    private boolean deleted;
    private LocalDateTime editedAt;
    private LocalDateTime createdAt;
}