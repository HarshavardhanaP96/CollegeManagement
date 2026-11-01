package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.ConsentStatus;
import jakarta.validation.constraints.NotNull;

public record ConsentRequest(@NotNull Integer purposeId, @NotNull ConsentStatus status) {
}
