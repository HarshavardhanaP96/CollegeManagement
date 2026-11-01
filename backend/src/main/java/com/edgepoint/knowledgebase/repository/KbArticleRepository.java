package com.edgepoint.knowledgebase.repository;

import com.edgepoint.knowledgebase.domain.ArticleStatus;
import com.edgepoint.knowledgebase.domain.KbArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface KbArticleRepository extends JpaRepository<KbArticle, Long>, JpaSpecificationExecutor<KbArticle> {

    Optional<KbArticle> findByIdAndIsDeletedFalse(Long id);

    Optional<KbArticle> findBySlugAndIsDeletedFalse(String slug);

    boolean existsBySlugAndIsDeletedFalse(String slug);

    boolean existsByCategoryIdAndIsDeletedFalse(Long categoryId);

    /** Bulk update on purpose: bypasses the audit listener so a reader's vote is not logged as an article edit. */
    @Modifying(clearAutomatically = true)
    @Query("update KbArticle a set a.helpfulCount = :helpful, a.unhelpfulCount = :unhelpful where a.id = :id")
    void updateCounts(@Param("id") Long id, @Param("helpful") int helpful, @Param("unhelpful") int unhelpful);

    /**
     * Non-deleted articles, filters added only when supplied (a "? is null or ..." JPQL
     * pattern fails on PostgreSQL). A null role means no visibility filter.
     */
    default Page<KbArticle> search(ArticleStatus status, Long categoryId, String role, String q, Pageable pageable) {
        Specification<KbArticle> spec = (r, cq, cb) -> cb.isFalse(r.get("isDeleted"));
        if (status != null) {
            spec = spec.and((r, cq, cb) -> cb.equal(r.get("status"), status));
        }
        if (categoryId != null) {
            spec = spec.and((r, cq, cb) -> cb.equal(r.get("categoryId"), categoryId));
        }
        if (role != null) {
            spec = spec.and((r, cq, cb) -> cb.or(
                    cb.isNull(r.get("visibleRoles")),
                    cb.equal(r.get("visibleRoles"), ""),
                    cb.like(cb.concat(cb.concat(",", r.get("visibleRoles")), ","), "%," + role + ",%")));
        }
        if (q != null && !q.isBlank()) {
            String pattern = "%" + q.trim().toLowerCase()
                    .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            spec = spec.and((r, cq, cb) -> cb.or(
                    cb.like(cb.lower(r.get("title")), pattern, '\\'),
                    cb.like(cb.lower(r.get("body")), pattern, '\\')));
        }
        return findAll(spec, pageable);
    }
}
