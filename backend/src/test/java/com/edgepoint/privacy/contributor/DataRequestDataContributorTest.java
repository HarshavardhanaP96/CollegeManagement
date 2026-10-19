package com.edgepoint.privacy.contributor;

import com.edgepoint.privacy.domain.DataRequest;
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
    DataRequestDataContributor contributor;

    @BeforeEach
    void setUp() {
        contributor = new DataRequestDataContributor(requests);
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
        verifyNoInteractions(requests);
    }
}
