package com.edgepoint.privacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoticeCreate(@NotBlank @Size(max = 20000) String body) {
}
