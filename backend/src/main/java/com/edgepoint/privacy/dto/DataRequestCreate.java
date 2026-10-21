package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RequestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record DataRequestCreate(@NotNull RequestType type, @Size(max = 4000) String details, Map<String, String> correction) {
}
