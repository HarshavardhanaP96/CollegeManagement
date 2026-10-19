package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RetentionAction;
import com.edgepoint.privacy.domain.RetentionTrigger;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RetentionPolicyUpdate(@NotBlank String dataCategory, @Min(1) int retentionDays,
                                    @NotNull RetentionTrigger triggerEvent, @NotNull RetentionAction action,
                                    boolean enabled) {
}
