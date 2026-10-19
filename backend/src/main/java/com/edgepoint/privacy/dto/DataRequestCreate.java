package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RequestType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record DataRequestCreate(@NotNull RequestType type, String details, Map<String, String> correction) {
}
