package com.edgepoint.privacy.contributor;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.DataRequestEvent;
import com.edgepoint.privacy.repository.DataRequestEventRepository;
import org.mockito.ArgumentCaptor;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;
import com.edgepoint.privacy.repository.DataRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataRequestDataContributorTest {

    @Mock DataRequestRepository requests;
    @Mock DataRequestEventRepository events;
    DataRequestDataContributor contributor;

    @BeforeEach
    void setUp() {
        contributor = new DataRequestDataContributor(requests, events);
    }

    DataRequest request(int id) {
        DataRequest r = new DataRequest();
        r.setRequestId(id); r.setUserId(42); r.setCollegeId(7); r.setType(RequestType.ACCESS);
        r.setStatus(RequestStatus.COMPLETED);
        r.setDetails("my details"); r.setCorrectionPayload("{\"phone\":\"1\"}"); r.setExportPayload("{\"account\":{}}");
        r.setResolutionNote("done");
        r.setSubmittedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        return r;
    }

    @Test
    void anonymiseNullsThePersonalFieldsButKeepsTheRecord() {
        DataRequest a = request(1);
        DataRequest b = request(2);
        when(requests.findByUserIdOrderBySubmittedAtDesc(42)).thenReturn(List.of(a, b));

        contributor.anonymise(42);

        for (DataRequest r : List.of(a, b)) {
            assertThat(r.getDetails()).isNull();
            assertThat(r.getCorrectionPayload()).isNull();
            assertThat(r.getExportPayload()).isNull();
            assertThat(r.getType()).isEqualTo(RequestType.ACCESS);
            assertThat(r.getStatus()).isEqualTo(RequestStatus.COMPLETED);
            assertThat(r.getResolutionNote()).isEqualTo("done");
            assertThat(r.getSubmittedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 0, 0));
        }
        verify(requests).saveAll(List.of(a, b));
    }

    @Test
    void anonymiseTwiceIsHarmless() {
        DataRequest a = request(1);
        when(requests.findByUserIdOrderBySubmittedAtDesc(42)).thenReturn(List.of(a));
        contributor.anonymise(42);
        contributor.anonymise(42);
        assertThat(a.getDetails()).isNull();
        assertThat(a.getResolutionNote()).isEqualTo("done");
    }

    @Test
    void anonymiseWithNoRequestsDoesNothing() {
        when(requests.findByUserIdOrderBySubmittedAtDesc(42)).thenReturn(List.of());
        contributor.anonymise(42);
        verify(requests, never()).saveAll(any());
    }

    @Test
    void contributesNothingElse() {
        assertThat(contributor.section()).isEqualTo("requests");
        assertThat(contributor.export(42)).isEmpty();
        assertThat(contributor.correctableFields()).isEmpty();
        assertThat(contributor.appliesTo(42)).isFalse();
        contributor.correct(42, java.util.Map.of());
        verifyNoInteractions(requests, events);
    }

    @Test
    void openNonErasureRequestsAreClosedWithAnEventAndTheErasureRequestIsLeftAlone() {
        DataRequest correction = request(1);
        correction.setType(RequestType.CORRECTION); correction.setStatus(RequestStatus.SUBMITTED);
        DataRequest access = request(2);
        access.setType(RequestType.ACCESS); access.setStatus(RequestStatus.IN_REVIEW);
        DataRequest erasure = request(3);
        erasure.setType(RequestType.ERASURE); erasure.setStatus(RequestStatus.IN_REVIEW);
        when(requests.findByUserIdOrderBySubmittedAtDesc(42)).thenReturn(List.of(correction, access, erasure));

        contributor.anonymise(42);

        for (DataRequest r : List.of(correction, access)) {
            assertThat(r.getStatus()).isEqualTo(RequestStatus.REJECTED);
            assertThat(r.getResolutionNote()).isEqualTo("Closed automatically: the account was erased");
            assertThat(r.getRejectionReason()).isEqualTo("Closed automatically: the account was erased");
            assertThat(r.getResolvedAt()).isNotNull();
        }
        assertThat(erasure.getStatus()).isEqualTo(RequestStatus.IN_REVIEW);
        ArgumentCaptor<DataRequestEvent> event = ArgumentCaptor.forClass(DataRequestEvent.class);
        verify(events, times(2)).save(event.capture());
        assertThat(event.getAllValues()).allSatisfy(e -> {
            assertThat(e.getToStatus()).isEqualTo(RequestStatus.REJECTED);
            assertThat(e.getActorId()).isNull();
        });
        assertThat(event.getAllValues()).extracting(DataRequestEvent::getFromStatus)
                .containsExactly(RequestStatus.SUBMITTED, RequestStatus.IN_REVIEW);
    }

    @Test
    void closedRequestsAreNotClosedTwice() {
        DataRequest done = request(1); // COMPLETED ACCESS
        when(requests.findByUserIdOrderBySubmittedAtDesc(42)).thenReturn(List.of(done));
        contributor.anonymise(42);
        verify(events, never()).save(any());
        assertThat(done.getStatus()).isEqualTo(RequestStatus.COMPLETED);
    }
}
