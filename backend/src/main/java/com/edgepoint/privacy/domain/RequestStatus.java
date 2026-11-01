package com.edgepoint.privacy.domain;

import java.util.List;

public enum RequestStatus {
    SUBMITTED, IN_REVIEW, COMPLETED, PARTIALLY_COMPLETED, REJECTED, CANCELLED;

    /** Statuses in which a request is still being worked on. */
    public static final List<RequestStatus> OPEN = List.of(SUBMITTED, IN_REVIEW);

    public boolean canTransitionTo(RequestStatus next) {
        return switch (this) {
            case SUBMITTED -> next == IN_REVIEW || next == CANCELLED;
            case IN_REVIEW -> next == COMPLETED || next == PARTIALLY_COMPLETED || next == REJECTED;
            default -> false;
        };
    }

    public boolean isTerminal() {
        return !OPEN.contains(this);
    }
}
