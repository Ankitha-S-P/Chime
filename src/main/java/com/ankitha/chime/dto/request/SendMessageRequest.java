package com.ankitha.chime.dto.request;

import com.ankitha.chime.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class SendMessageRequest {

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 10000, message = "Message too long")
    private String content;

    private Message.MessageType type = Message.MessageType.TEXT;

    private UUID replyToId;
}