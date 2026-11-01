package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveRequest(@NotNull RequestStatus outcome, @NotBlank @Size(max = 4000) String note) {
}
