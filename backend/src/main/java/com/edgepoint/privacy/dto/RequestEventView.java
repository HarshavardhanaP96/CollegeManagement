package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.DataRequestEvent;
import com.edgepoint.privacy.domain.RequestStatus;

import java.time.LocalDateTime;

public record RequestEventView(RequestStatus fromStatus, RequestStatus toStatus, Integer actorId,
                               String note, LocalDateTime occurredAt) {

    public static RequestEventView from(DataRequestEvent e) {
        return new RequestEventView(e.getFromStatus(), e.getToStatus(), e.getActorId(), e.getNote(), e.getOccurredAt());
    }
}
