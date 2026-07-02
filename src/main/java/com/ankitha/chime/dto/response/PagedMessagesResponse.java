package com.ankitha.chime.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PagedMessagesResponse {
    private List<MessageResponse> messages;
    private LocalDateTime nextCursor;
    private boolean hasMore;
}