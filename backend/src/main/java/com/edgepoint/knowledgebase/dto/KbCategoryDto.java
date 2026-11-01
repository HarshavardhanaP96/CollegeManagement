package com.edgepoint.knowledgebase.dto;

import com.edgepoint.knowledgebase.domain.KbCategory;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KbCategoryDto {
    private Long id;
    private String name;
    private String slug;
    private Integer displayOrder;

    public static KbCategoryDto from(KbCategory c) {
        return KbCategoryDto.builder().id(c.getId()).name(c.getName()).slug(c.getSlug())
                .displayOrder(c.getDisplayOrder()).build();
    }
}
