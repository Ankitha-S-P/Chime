package com.ankitha.chime.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateRoomRequest {

    @Size(max = 100)
    private String name;

    private String description;
}