package com.frevi.announcement.service;

import com.frevi.announcement.dto.AnnouncementRequest;
import com.frevi.announcement.dto.AnnouncementResponse;
import com.frevi.announcement.entity.Announcement;
import com.frevi.announcement.mapper.AnnouncementMapper;
import com.frevi.announcement.repository.AnnouncementRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnnouncementService {
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementMapper announcementMapper;

    public AnnouncementResponse create(AnnouncementRequest announcementRequest) {
        Announcement announcement = announcementRepository.save(
                announcementMapper.fromRequest(announcementRequest)
        );

        return announcementMapper.toResponse(announcement);
    }

    @Cacheable(key = "#id", value = "announcements")
    public AnnouncementResponse findById(long id) throws EntityNotFoundException {
        return announcementRepository.findById(id)
                .map(announcementMapper::toResponse)
                .orElseThrow(EntityNotFoundException::new);
    }

    public Page<AnnouncementResponse> findAll(Pageable pageable) {
        return announcementRepository.findAll(pageable)
                .map(announcementMapper::toResponse);
    }

    @CacheEvict(key = "#id", value = "announcements")
    public void deleteById(long id) throws EntityNotFoundException {
        if (!announcementRepository.existsById(id))
            throw new EntityNotFoundException();

        announcementRepository.deleteById(id);
    }
}
