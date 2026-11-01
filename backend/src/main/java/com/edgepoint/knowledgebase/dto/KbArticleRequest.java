package com.edgepoint.knowledgebase.dto;

import com.edgepoint.knowledgebase.domain.ArticleStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class KbArticleRequest {
    static final String SLUG = "^[a-z0-9]+(-[a-z0-9]+)*$";

    @NotNull
    private Long categoryId;

    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    @Size(max = 200)
    @Pattern(regexp = SLUG, message = "must be lowercase letters, digits and single hyphens")
    private String slug;

    @NotBlank
    @Size(max = 100_000)
    private String body;

    /** Defaults to DRAFT. */
    private ArticleStatus status;

    /** Empty or null = visible to every role. */
    @Size(max = 10)
    private List<String> visibleRoles;
}
