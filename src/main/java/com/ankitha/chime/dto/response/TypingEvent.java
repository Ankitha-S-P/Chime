package com.ankitha.chime.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class TypingEvent {
    private UUID userId;
    private String username;
    private UUID roomId;
    private boolean typing;
}