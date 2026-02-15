package com.frevi.announcement.controller;

import com.frevi.announcement.dto.AnnouncementRequest;
import com.frevi.announcement.dto.AnnouncementResponse;
import com.frevi.announcement.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {
    private final AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<AnnouncementResponse> create(@RequestBody AnnouncementRequest announcementRequest) {
        AnnouncementResponse announcementResponse = announcementService.create(announcementRequest);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(announcementResponse.id())
                .toUri();

        return ResponseEntity.created(location).body(announcementResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnouncementResponse> findById(@PathVariable long id) {
        AnnouncementResponse announcementResponse = announcementService.findById(id);

        return ResponseEntity.ok(announcementResponse);
    }

    @GetMapping
    public ResponseEntity<Page<AnnouncementResponse>> findAll(Pageable pageable) {
        Page<AnnouncementResponse> page = announcementService.findAll(pageable);

        return ResponseEntity.ok(page);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable long id) {
        announcementService.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
