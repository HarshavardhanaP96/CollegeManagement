package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;

import java.time.LocalDateTime;

public record DataRequestView(Integer requestId, Integer userId, RequestType type, RequestStatus status,
                              String details, LocalDateTime submittedAt, LocalDateTime dueAt,
                              LocalDateTime resolvedAt, String resolutionNote, boolean overdue) {

    public static DataRequestView from(DataRequest r) {
        boolean overdue = !r.getStatus().isTerminal() && r.getDueAt() != null && r.getDueAt().isBefore(LocalDateTime.now());
        return new DataRequestView(r.getRequestId(), r.getUserId(), r.getType(), r.getStatus(), r.getDetails(),
                r.getSubmittedAt(), r.getDueAt(), r.getResolvedAt(), r.getResolutionNote(), overdue);
    }
}
