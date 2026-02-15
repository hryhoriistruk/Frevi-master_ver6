package com.frevi.announcement.dto;

public record AnnouncementRequest(String title,
                                  String content,
                                  String creatorId) {
}
