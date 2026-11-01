package com.edgepoint.privacy.dto;

import java.time.LocalDateTime;
import java.util.List;

/** The current notice with the caller's consent state; noticeId is null when nothing is published yet. */
public record NoticeView(Integer noticeId, Integer version, String body, LocalDateTime effectiveFrom,
                         boolean requiresAction, List<PurposeView> purposes) {
}
