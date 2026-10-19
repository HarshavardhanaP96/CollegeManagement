package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.ConsentStatus;
import com.edgepoint.privacy.domain.LegalBasis;

import java.time.LocalDateTime;

/** One purpose and the caller's latest answer; status and recordedAt are null when never answered. */
public record PurposeView(Integer purposeId, String code, String name, String description,
                          LegalBasis legalBasis, boolean withdrawable,
                          ConsentStatus status, LocalDateTime recordedAt) {
}
