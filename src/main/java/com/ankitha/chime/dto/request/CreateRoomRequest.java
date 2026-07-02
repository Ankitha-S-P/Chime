package com.ankitha.chime.dto.request;

import com.ankitha.chime.entity.Room;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRoomRequest {

    @Size(max = 100, message = "Room name cannot exceed 100 characters")
    private String name;

    private String description;

    @NotNull(message = "Room type is required")
    private Room.RoomType type;
}