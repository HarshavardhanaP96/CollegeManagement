package com.edgepoint.privacy.contributor;

import com.edgepoint.privacy.domain.ConsentRecord;
import com.edgepoint.privacy.domain.ConsentStatus;
import com.edgepoint.privacy.repository.ConsentRecordRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsentDataContributorTest {

    @Mock ConsentRecordRepository consents;

    ConsentRecord row(int id) {
        ConsentRecord r = new ConsentRecord();
        r.setConsentId(id); r.setUserId(42); r.setCollegeId(7); r.setPurposeId(1); r.setNoticeId(3);
        r.setStatus(ConsentStatus.GRANTED); r.setSourceIp("203.0.113.9");
        r.setRecordedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        return r;
    }

    @Test
    void anonymiseNullsTheIpButKeepsTheLedgerFacts() {
        ConsentRecord a = row(1);
        ConsentRecord b = row(2);
        when(consents.findByUserId(42)).thenReturn(List.of(a, b));

        new ConsentDataContributor(consents).anonymise(42);

        for (ConsentRecord r : List.of(a, b)) {
            assertThat(r.getSourceIp()).isNull();
            assertThat(r.getStatus()).isEqualTo(ConsentStatus.GRANTED);
            assertThat(r.getNoticeId()).isEqualTo(3);
            assertThat(r.getRecordedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 0, 0));
        }
        verify(consents).saveAll(List.of(a, b));
    }

    @Test
    void nothingToDoWithoutRows() {
        when(consents.findByUserId(42)).thenReturn(List.of());
        new ConsentDataContributor(consents).anonymise(42);
        verify(consents, never()).saveAll(any());
    }

    @Test
    void contributesNothingElse() {
        ConsentDataContributor c = new ConsentDataContributor(consents);
        assertThat(c.section()).isEqualTo("consents");
        assertThat(c.export(42)).isEmpty();
        assertThat(c.correctableFields()).isEmpty();
        assertThat(c.appliesTo(42)).isFalse();
        c.correct(42, Map.of());
        verifyNoInteractions(consents);
    }
}
