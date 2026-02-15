package com.frevi.announcement.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record AnnouncementResponse(Long id,
                                   String title,
                                   String content,
                                   @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
                                   LocalDateTime createdAt,
                                   String creatorId) {
}
