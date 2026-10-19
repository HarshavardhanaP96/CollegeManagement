package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.RetentionPolicyUpdate;
import com.edgepoint.privacy.repository.RetentionCandidateRepository;
import com.edgepoint.privacy.repository.RetentionPolicyRepository;
import com.edgepoint.privacy.repository.RetentionRunRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RetentionServiceTest {

    static final int COLLEGE = 7;
    static final List<String> ROLES = List.of("STUDENT", "TEACHER");

    @Mock RetentionPolicyRepository policyRepository;
    @Mock RetentionRunRepository runRepository;
    @Mock RetentionCandidateRepository candidates;
    @Mock ErasureService erasure;
    @Mock PrivacyAuditService audit;
    @Mock PrivacyTenant tenant;

    RetentionService service;
    RetentionPolicy policy;

    @BeforeEach
    void setUp() {
        service = new RetentionService(policyRepository, runRepository, candidates, erasure, audit, tenant);
        when(tenant.collegeId()).thenReturn(COLLEGE);
        when(tenant.userId()).thenReturn(99);
        policy = new RetentionPolicy();
        policy.setPolicyId(1); policy.setCollegeId(COLLEGE);
        policy.setDataCategory(RetentionPolicy.ACCOUNT_RECORDS); policy.setRetentionDays(100); policy.setEnabled(true);
        when(policyRepository.findByCollegeIdAndEnabledTrue(COLLEGE)).thenReturn(List.of(policy));
        when(runRepository.save(any())).thenAnswer(i -> {
            RetentionRun r = i.getArgument(0);
            if (r.getRunId() == null) r.setRunId(5);
            return r;
        });
        when(policyRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    User user(int id) {
        User u = new User();
        u.setUserId(id);
        return u;
    }

    @Test
    void dryRunCountsButNeverErases() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of(user(1), user(2)));

        RetentionRun run = service.run(COLLEGE, true, 99);

        verify(erasure, never()).erase(any(), any(), any(), any());
        assertThat(run.isDryRun()).isTrue();
        assertThat(run.getRecordsProcessed()).isEqualTo(2);
        assertThat(run.getRecordsFailed()).isZero();
        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.COMPLETED);
        assertThat(run.getFinishedAt()).isNotNull();
        verify(audit).record(COLLEGE, 99, null, "RETENTION_DRY_RUN", "runId=5, processed=2, failed=0");
    }

    @Test
    void liveRunAnonymisesEveryCandidate() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of(user(1), user(2)));

        RetentionRun run = service.run(COLLEGE, false, null);

        verify(erasure).erase(COLLEGE, 1, null, "Retention policy ACCOUNT_RECORDS");
        verify(erasure).erase(COLLEGE, 2, null, "Retention policy ACCOUNT_RECORDS");
        assertThat(run.getRecordsProcessed()).isEqualTo(2);
        verify(audit).record(COLLEGE, null, null, "RETENTION_RUN", "runId=5, processed=2, failed=0");
    }

    @Test
    void oneFailureDoesNotStopTheBatch() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of(user(1), user(2), user(3)));
        doThrow(new IllegalStateException("boom")).when(erasure).erase(COLLEGE, 2, null, "Retention policy ACCOUNT_RECORDS");

        RetentionRun run = service.run(COLLEGE, false, null);

        verify(erasure).erase(COLLEGE, 3, null, "Retention policy ACCOUNT_RECORDS");
        assertThat(run.getRecordsProcessed()).isEqualTo(2);
        assertThat(run.getRecordsFailed()).isEqualTo(1);
        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.COMPLETED);
    }

    @Test
    void theCutoffIsTodayMinusTheRetentionDays() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of());

        service.run(COLLEGE, true, null);

        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(candidates).findExpiredInactive(eq(COLLEGE), cutoff.capture(), eq(ROLES));
        assertThat(cutoff.getValue()).isBetween(LocalDateTime.now().minusDays(100).minusMinutes(1),
                LocalDateTime.now().minusDays(100).plusMinutes(1));
    }

    @Test
    void withNoEnabledPolicyNothingIsQueriedOrErased() {
        when(policyRepository.findByCollegeIdAndEnabledTrue(COLLEGE)).thenReturn(List.of());

        RetentionRun run = service.run(COLLEGE, false, null);

        verifyNoInteractions(candidates, erasure);
        assertThat(run.getRecordsProcessed()).isZero();
        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.COMPLETED);
    }

    @Test
    void aQueryFailureMarksTheRunFailedWithoutThrowing() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenThrow(new IllegalStateException("db"));

        RetentionRun run = service.run(COLLEGE, false, null);

        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.FAILED);
        assertThat(run.getFinishedAt()).isNotNull();
    }

    @Test
    void runNowUsesTheCallersCollegeAndIdentity() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of());

        RetentionRun run = service.runNow(true);

        assertThat(run.getCollegeId()).isEqualTo(COLLEGE);
        verify(audit).record(COLLEGE, 99, null, "RETENTION_DRY_RUN", "runId=5, processed=0, failed=0");
    }

    @Test
    void firstReadSeedsADisabledDefaultPolicy() {
        when(tenant.collegeId(null)).thenReturn(COLLEGE);
        when(policyRepository.findByCollegeId(COLLEGE)).thenReturn(List.of());

        List<RetentionPolicy> result = service.policies(null);

        assertThat(result).hasSize(1);
        RetentionPolicy seeded = result.get(0);
        assertThat(seeded.getDataCategory()).isEqualTo("ACCOUNT_RECORDS");
        assertThat(seeded.getRetentionDays()).isEqualTo(1825);
        assertThat(seeded.isEnabled()).isFalse();
        assertThat(seeded.getAction()).isEqualTo(RetentionAction.ANONYMISE);
        assertThat(seeded.getTriggerEvent()).isEqualTo(RetentionTrigger.ACCOUNT_DEACTIVATED);
    }

    @Test
    void updateChangesAnExistingPolicyAndAudits() {
        when(policyRepository.findByCollegeIdAndDataCategory(COLLEGE, "ACCOUNT_RECORDS")).thenReturn(Optional.of(policy));
        when(policyRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(policy));

        service.updatePolicies(List.of(new RetentionPolicyUpdate("ACCOUNT_RECORDS", 400,
                RetentionTrigger.ACCOUNT_DEACTIVATED, RetentionAction.ANONYMISE, false)));

        assertThat(policy.getRetentionDays()).isEqualTo(400);
        assertThat(policy.isEnabled()).isFalse();
        verify(policyRepository).save(policy);
        verify(audit).record(COLLEGE, 99, null, "RETENTION_POLICY_UPDATED", "category=ACCOUNT_RECORDS, days=400, enabled=false");
    }

    @Test
    void updateRejectsUnknownCategoriesAndNonPositiveDays() {
        assertThatThrownBy(() -> service.updatePolicies(List.of(new RetentionPolicyUpdate("MARKS", 10,
                RetentionTrigger.ACCOUNT_DEACTIVATED, RetentionAction.ANONYMISE, true))))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.updatePolicies(List.of(new RetentionPolicyUpdate("ACCOUNT_RECORDS", 0,
                RetentionTrigger.ACCOUNT_DEACTIVATED, RetentionAction.ANONYMISE, true))))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.updatePolicies(List.of(new RetentionPolicyUpdate("ACCOUNT_RECORDS", 30,
                null, null, true))))
                .isInstanceOf(BusinessRuleViolationException.class);
        verify(policyRepository, never()).save(any());
    }

    @Test
    void runsAreListedForTheResolvedCollege() {
        when(tenant.collegeId(3)).thenReturn(COLLEGE);
        when(runRepository.findByCollegeIdOrderByRunIdDesc(eq(COLLEGE), any())).thenReturn(Page.empty());
        service.runs(3, PageRequest.of(0, 10));
        verify(runRepository).findByCollegeIdOrderByRunIdDesc(eq(COLLEGE), any());
    }
}
