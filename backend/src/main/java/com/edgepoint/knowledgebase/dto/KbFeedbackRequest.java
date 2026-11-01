package com.edgepoint.knowledgebase.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KbFeedbackRequest {
    @NotNull
    private Boolean helpful;
}
