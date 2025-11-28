package com.giftai.repository;

import com.giftai.entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<BookEntity, Long> {
    List<BookEntity> findAllByOrderByCreatedAtDesc();
    List<BookEntity> findByUserIdOrderByCreatedAtDesc(Long userId);
}

