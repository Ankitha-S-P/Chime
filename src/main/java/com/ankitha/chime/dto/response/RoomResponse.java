package com.ankitha.chime.dto.response;

import com.ankitha.chime.entity.Room;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class RoomResponse {
    private UUID id;
    private String name;
    private String description;
    private Room.RoomType type;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}