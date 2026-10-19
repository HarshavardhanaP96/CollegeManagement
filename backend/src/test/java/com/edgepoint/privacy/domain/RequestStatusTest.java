package com.edgepoint.privacy.domain;

import org.junit.jupiter.api.Test;

import static com.edgepoint.privacy.domain.RequestStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class RequestStatusTest {

    @Test
    void submittedCanBeReviewedOrCancelledOnly() {
        assertThat(SUBMITTED.canTransitionTo(IN_REVIEW)).isTrue();
        assertThat(SUBMITTED.canTransitionTo(CANCELLED)).isTrue();
        assertThat(SUBMITTED.canTransitionTo(COMPLETED)).isFalse();
        assertThat(SUBMITTED.canTransitionTo(REJECTED)).isFalse();
    }

    @Test
    void inReviewCanBeResolvedButNotCancelled() {
        assertThat(IN_REVIEW.canTransitionTo(COMPLETED)).isTrue();
        assertThat(IN_REVIEW.canTransitionTo(PARTIALLY_COMPLETED)).isTrue();
        assertThat(IN_REVIEW.canTransitionTo(REJECTED)).isTrue();
        assertThat(IN_REVIEW.canTransitionTo(CANCELLED)).isFalse();
        assertThat(IN_REVIEW.canTransitionTo(SUBMITTED)).isFalse();
    }

    @Test
    void terminalStatesGoNowhere() {
        for (RequestStatus terminal : new RequestStatus[]{COMPLETED, PARTIALLY_COMPLETED, REJECTED, CANCELLED}) {
            assertThat(terminal.isTerminal()).isTrue();
            for (RequestStatus next : RequestStatus.values()) {
                assertThat(terminal.canTransitionTo(next)).isFalse();
            }
        }
        assertThat(SUBMITTED.isTerminal()).isFalse();
        assertThat(IN_REVIEW.isTerminal()).isFalse();
    }

    @Test
    void openListHoldsTheTwoNonTerminalStates() {
        assertThat(OPEN).containsExactly(SUBMITTED, IN_REVIEW);
    }
}
