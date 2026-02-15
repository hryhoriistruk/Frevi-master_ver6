package com.frevi.announcement.mapper;

import com.frevi.announcement.dto.AnnouncementRequest;
import com.frevi.announcement.dto.AnnouncementResponse;
import com.frevi.announcement.entity.Announcement;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AnnouncementMapper {
    
    public Announcement fromRequest(AnnouncementRequest announcementRequest) {
        Announcement announcement = new Announcement();
        announcement.setTitle(announcementRequest.title());
        announcement.setContent(announcementRequest.content());
        announcement.setCreatorId(announcementRequest.creatorId());
        announcement.setCreatedAt(LocalDateTime.now());
        return announcement;
    }

    public AnnouncementResponse toResponse(Announcement announcement) {
        return new AnnouncementResponse(
            announcement.getId(),
            announcement.getTitle(),
            announcement.getContent(),
            announcement.getCreatedAt(),
            announcement.getCreatorId()
        );
    }
}
