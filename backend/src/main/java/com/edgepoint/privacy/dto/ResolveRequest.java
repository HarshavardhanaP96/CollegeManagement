package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveRequest(@NotNull RequestStatus outcome, @NotBlank String note) {
}
