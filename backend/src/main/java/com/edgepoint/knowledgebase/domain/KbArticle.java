package com.edgepoint.knowledgebase.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A global help article. Readers only ever see PUBLISHED, non-deleted rows visible to their role. */
@Entity
@Table(name = "kb_articles")
@Getter
@Setter
@NoArgsConstructor
public class KbArticle extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "slug", nullable = false, length = 200)
    private String slug;

    /** Markdown / plain text. */
    @Column(name = "body", nullable = false, columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ArticleStatus status = ArticleStatus.DRAFT;

    /** Comma-separated role names; null means every role. */
    @Column(name = "visible_roles", length = 255)
    private String visibleRoles;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "helpful_count", nullable = false)
    private Integer helpfulCount = 0;

    @Column(name = "unhelpful_count", nullable = false)
    private Integer unhelpfulCount = 0;
}
