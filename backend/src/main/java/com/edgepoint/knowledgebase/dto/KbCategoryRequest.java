package com.edgepoint.knowledgebase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KbCategoryRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = KbArticleRequest.SLUG, message = "must be lowercase letters, digits and single hyphens")
    private String slug;

    private Integer displayOrder;
}
