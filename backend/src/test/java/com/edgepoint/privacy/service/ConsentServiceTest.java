package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.NoticeView;
import com.edgepoint.privacy.dto.PurposeView;
import com.edgepoint.privacy.repository.ConsentRecordRepository;
import com.edgepoint.privacy.repository.PrivacyNoticeRepository;
import com.edgepoint.privacy.repository.PrivacyPurposeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConsentServiceTest {

    static final int COLLEGE = 7;
    static final int USER = 42;

    @Mock PrivacyPurposeRepository purposes;
    @Mock PrivacyNoticeRepository notices;
    @Mock ConsentRecordRepository consents;
    @Mock PrivacyAuditService audit;
    @Mock PrivacyTenant tenant;

    ConsentService service;
    PrivacyPurpose academic;
    PrivacyPurpose comms;
    PrivacyNotice notice;

    @BeforeEach
    void setUp() {
        service = new ConsentService(purposes, notices, consents, audit, tenant);
        when(tenant.collegeId()).thenReturn(COLLEGE);
        when(tenant.userId()).thenReturn(USER);
        academic = purpose(1, "ACADEMIC_RECORDS", LegalBasis.LEGITIMATE_USE, false);
        comms = purpose(2, "EMAIL_SMS_COMMS", LegalBasis.CONSENT, true);
        notice = new PrivacyNotice();
        notice.setNoticeId(10); notice.setCollegeId(COLLEGE); notice.setVersion(2); notice.setBody("Notice v2");
        when(purposes.countByCollegeId(COLLEGE)).thenReturn(2L);
        when(purposes.findByCollegeIdAndActiveTrueOrderByPurposeId(COLLEGE)).thenReturn(List.of(academic, comms));
        when(purposes.findByPurposeIdAndCollegeId(1, COLLEGE)).thenReturn(Optional.of(academic));
        when(purposes.findByPurposeIdAndCollegeId(2, COLLEGE)).thenReturn(Optional.of(comms));
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.of(notice));
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(anyInt(), anyInt())).thenReturn(Optional.empty());
        when(consents.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    PrivacyPurpose purpose(int id, String code, LegalBasis basis, boolean withdrawable) {
        PrivacyPurpose p = new PrivacyPurpose();
        p.setPurposeId(id); p.setCollegeId(COLLEGE); p.setCode(code); p.setName(code);
        p.setLegalBasis(basis); p.setWithdrawable(withdrawable); p.setActive(true);
        return p;
    }

    ConsentRecord record(int purposeId, int noticeId, ConsentStatus status) {
        ConsentRecord r = new ConsentRecord();
        r.setConsentId(1); r.setUserId(USER); r.setPurposeId(purposeId); r.setNoticeId(noticeId); r.setStatus(status);
        return r;
    }

    @Test
    void defaultPurposesAreSeededWhenTheCollegeHasNone() {
        when(purposes.countByCollegeId(COLLEGE)).thenReturn(0L);

        service.currentNotice();

        ArgumentCaptor<PrivacyPurpose> saved = ArgumentCaptor.forClass(PrivacyPurpose.class);
        verify(purposes, times(3)).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(PrivacyPurpose::getCode)
                .containsExactly("ACADEMIC_RECORDS", "EMAIL_SMS_COMMS", "PARENT_NOTIFICATIONS");
        assertThat(saved.getAllValues().get(0).isWithdrawable()).isFalse();
        assertThat(saved.getAllValues().get(0).getLegalBasis()).isEqualTo(LegalBasis.LEGITIMATE_USE);
        assertThat(saved.getAllValues().get(1).getLegalBasis()).isEqualTo(LegalBasis.CONSENT);
    }

    @Test
    void noPublishedNoticeMeansNoActionIsRequired() {
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.empty());

        NoticeView view = service.currentNotice();

        assertThat(view.noticeId()).isNull();
        assertThat(view.requiresAction()).isFalse();
        assertThat(view.purposes()).hasSize(2);
    }

    @Test
    void actionIsRequiredUntilTheUserAnswersEveryConsentPurposeUnderTheCurrentNotice() {
        assertThat(service.currentNotice().requiresAction()).isTrue();

        // answered under the previous notice version only -> still required
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 9, ConsentStatus.GRANTED)));
        assertThat(service.currentNotice().requiresAction()).isTrue();

        // answered under the current notice -> done, even when the answer is "withdrawn"
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 10, ConsentStatus.WITHDRAWN)));
        NoticeView done = service.currentNotice();
        assertThat(done.requiresAction()).isFalse();
        assertThat(done.noticeId()).isEqualTo(10);
        assertThat(done.version()).isEqualTo(2);
        assertThat(done.body()).isEqualTo("Notice v2");
    }

    @Test
    void myConsentsShowsTheLatestStatusPerPurpose() {
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 10, ConsentStatus.GRANTED)));

        List<PurposeView> views = service.myConsents();

        assertThat(views).extracting(PurposeView::code).containsExactly("ACADEMIC_RECORDS", "EMAIL_SMS_COMMS");
        assertThat(views.get(0).status()).isNull();
        assertThat(views.get(1).status()).isEqualTo(ConsentStatus.GRANTED);
    }

    @Test
    void grantingAppendsALedgerRowTiedToTheCurrentNotice() {
        PurposeView view = service.recordConsent(2, ConsentStatus.GRANTED, "10.0.0.5");

        ArgumentCaptor<ConsentRecord> saved = ArgumentCaptor.forClass(ConsentRecord.class);
        verify(consents).save(saved.capture());
        ConsentRecord row = saved.getValue();
        assertThat(row.getCollegeId()).isEqualTo(COLLEGE);
        assertThat(row.getUserId()).isEqualTo(USER);
        assertThat(row.getPurposeId()).isEqualTo(2);
        assertThat(row.getNoticeId()).isEqualTo(10);
        assertThat(row.getStatus()).isEqualTo(ConsentStatus.GRANTED);
        assertThat(row.getSourceIp()).isEqualTo("10.0.0.5");
        assertThat(view.status()).isEqualTo(ConsentStatus.GRANTED);
        verify(audit).record(COLLEGE, USER, USER, "CONSENT_GRANTED", "purpose=EMAIL_SMS_COMMS");
    }

    @Test
    void repeatingTheSameAnswerUnderTheSameNoticeAddsNoRow() {
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 10, ConsentStatus.GRANTED)));

        service.recordConsent(2, ConsentStatus.GRANTED, "10.0.0.5");

        verify(consents, never()).save(any());
        verify(audit, never()).record(anyInt(), any(), any(), anyString(), anyString());
    }

    @Test
    void sameAnswerUnderANewNoticeIsRecordedAgain() {
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 9, ConsentStatus.GRANTED)));

        service.recordConsent(2, ConsentStatus.GRANTED, null);

        verify(consents).save(any());
    }

    @Test
    void aPurposeThatCannotBeWithdrawnRefusesWithdrawal() {
        assertThatThrownBy(() -> service.recordConsent(1, ConsentStatus.WITHDRAWN, null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("cannot be withdrawn");
        verify(consents, never()).save(any());
    }

    @Test
    void aPurposeOfAnotherCollegeLooksNonexistent() {
        when(purposes.findByPurposeIdAndCollegeId(55, COLLEGE)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.recordConsent(55, ConsentStatus.GRANTED, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void consentCannotBeRecordedBeforeAnyNoticeIsPublished() {
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.recordConsent(2, ConsentStatus.GRANTED, null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("notice");
    }

    @Test
    void publishingCreatesTheNextVersion() {
        when(notices.save(any())).thenAnswer(i -> i.getArgument(0));

        PrivacyNotice published = service.publishNotice("New text");

        assertThat(published.getVersion()).isEqualTo(3);
        assertThat(published.getCollegeId()).isEqualTo(COLLEGE);
        assertThat(published.getBody()).isEqualTo("New text");
        assertThat(published.getPublishedBy()).isEqualTo(USER);
        verify(audit).record(COLLEGE, USER, null, "NOTICE_PUBLISHED", "version=3");
    }

    @Test
    void firstNoticeIsVersionOneAndABlankBodyIsRejected() {
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.empty());
        when(notices.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.publishNotice("Hello").getVersion()).isEqualTo(1);
        assertThatThrownBy(() -> service.publishNotice("   ")).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void listNoticesUsesTheResolvedCollege() {
        when(tenant.collegeId(3)).thenReturn(COLLEGE);
        when(notices.findByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(new ArrayList<>(List.of(notice)));

        assertThat(service.listNotices(3)).containsExactly(notice);
    }
}
