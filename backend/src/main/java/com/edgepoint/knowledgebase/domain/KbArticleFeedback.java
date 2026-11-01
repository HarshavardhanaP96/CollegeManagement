package com.edgepoint.knowledgebase.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One reader's helpful/unhelpful vote on an article; re-voting updates this row. */
@Entity
@Table(name = "kb_article_feedback",
        uniqueConstraints = @UniqueConstraint(name = "uq_kb_feedback_article_user", columnNames = {"article_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
public class KbArticleFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "article_id", nullable = false)
    private Long articleId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "is_helpful", nullable = false)
    private Boolean helpful;
}
