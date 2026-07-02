package com.ankitha.chime.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class InviteMemberRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;
}