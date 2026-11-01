package com.edgepoint.knowledgebase.repository;

import com.edgepoint.knowledgebase.domain.KbCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KbCategoryRepository extends JpaRepository<KbCategory, Long> {

    List<KbCategory> findByIsDeletedFalseOrderByDisplayOrderAscNameAsc();

    Optional<KbCategory> findByIdAndIsDeletedFalse(Long id);

    Optional<KbCategory> findBySlugAndIsDeletedFalse(String slug);

    boolean existsBySlugAndIsDeletedFalse(String slug);
}
