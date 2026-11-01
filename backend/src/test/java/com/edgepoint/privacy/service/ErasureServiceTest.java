package com.edgepoint.privacy.service;

import com.edgepoint.privacy.contributor.PersonalDataContributor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ErasureServiceTest {

    @Mock PersonalDataContributor first;
    @Mock PersonalDataContributor second;
    @Mock PrivacyAuditService audit;

    @Test
    void anonymisesThroughEveryContributorThenAudits() {
        new ErasureService(List.of(first, second), audit).erase(7, 42, 99, "Request 3");

        InOrder order = inOrder(first, second, audit);
        order.verify(first).anonymise(42);
        order.verify(second).anonymise(42);
        order.verify(audit).record(7, 99, 42, "ERASURE_EXECUTED", "Request 3");
    }

    @Test
    void aFailingContributorStopsTheErasureAndNothingIsAudited() {
        doThrow(new IllegalStateException("db down")).when(second).anonymise(42);

        assertThatThrownBy(() -> new ErasureService(List.of(first, second), audit).erase(7, 42, 99, "Request 3"))
                .isInstanceOf(IllegalStateException.class);

        verify(audit, never()).record(anyInt(), any(), anyInt(), anyString(), anyString());
    }

    @Test
    void actorMayBeNullForSystemRuns() {
        new ErasureService(List.of(first), audit).erase(7, 42, null, "Retention policy ACCOUNT_RECORDS");

        verify(audit).record(7, null, 42, "ERASURE_EXECUTED", "Retention policy ACCOUNT_RECORDS");
    }
}
