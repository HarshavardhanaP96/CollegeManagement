package com.edgepoint.privacy.dto;

import jakarta.validation.constraints.NotBlank;

public record NoticeCreate(@NotBlank String body) {
}
