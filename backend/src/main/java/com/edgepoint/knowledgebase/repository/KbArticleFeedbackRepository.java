package com.edgepoint.knowledgebase.repository;

import com.edgepoint.knowledgebase.domain.KbArticleFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KbArticleFeedbackRepository extends JpaRepository<KbArticleFeedback, Long> {

    Optional<KbArticleFeedback> findByArticleIdAndUserId(Long articleId, Integer userId);

    long countByArticleIdAndHelpful(Long articleId, Boolean helpful);
}
