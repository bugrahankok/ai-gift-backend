package com.giftai.repository;

import com.giftai.entity.AnnouncementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnnouncementRepository extends JpaRepository<AnnouncementEntity, Long> {
    List<AnnouncementEntity> findByTypeAndIsActiveTrue(String type);
    Optional<AnnouncementEntity> findByTypeAndIsActiveTrueOrderByUpdatedAtDesc(String type);
    List<AnnouncementEntity> findAllByOrderByUpdatedAtDesc();
}

