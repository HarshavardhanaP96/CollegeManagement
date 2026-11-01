package com.edgepoint.knowledgebase.dto;

import com.edgepoint.knowledgebase.domain.ArticleStatus;
import com.edgepoint.knowledgebase.domain.KbArticle;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class KbArticleDto {
    private Long id;
    private Long categoryId;
    private String title;
    private String slug;
    /** Null in list responses; only the detail view carries the body. */
    private String body;
    private ArticleStatus status;
    private List<String> visibleRoles;
    private LocalDateTime publishedAt;
    private LocalDateTime updatedAt;
    private Integer helpfulCount;
    private Integer unhelpfulCount;
    /** The caller's own vote on reader detail/feedback responses; null if they haven't voted. */
    private Boolean myVote;

    public static KbArticleDto summary(KbArticle a) {
        String roles = a.getVisibleRoles();
        return KbArticleDto.builder()
                .id(a.getId()).categoryId(a.getCategoryId()).title(a.getTitle()).slug(a.getSlug())
                .status(a.getStatus())
                .visibleRoles(roles == null || roles.isBlank() ? List.of() : Arrays.asList(roles.split(",")))
                .publishedAt(a.getPublishedAt()).updatedAt(a.getUpdatedAt())
                .helpfulCount(a.getHelpfulCount()).unhelpfulCount(a.getUnhelpfulCount())
                .build();
    }

    public static KbArticleDto full(KbArticle a) {
        KbArticleDto dto = summary(a);
        dto.setBody(a.getBody());
        return dto;
    }
}
