package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.RetentionPolicyUpdate;
import com.edgepoint.privacy.repository.RetentionCandidateRepository;
import com.edgepoint.privacy.repository.RetentionPolicyRepository;
import com.edgepoint.privacy.repository.RetentionRunRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RetentionService {

    static final List<String> ELIGIBLE_ROLES = List.of("STUDENT", "TEACHER");
    static final int DEFAULT_RETENTION_DAYS = 1825;

    private final RetentionPolicyRepository policyRepository;
    private final RetentionRunRepository runRepository;
    private final RetentionCandidateRepository candidates;
    private final ErasureService erasure;
    private final PrivacyAuditService audit;
    private final PrivacyTenant tenant;

    @Transactional
    public List<RetentionPolicy> policies(Integer collegeParam) {
        Integer college = tenant.collegeId(collegeParam);
        List<RetentionPolicy> existing = policyRepository.findByCollegeId(college);
        if (!existing.isEmpty()) {
            return existing;
        }
        RetentionPolicy seeded = new RetentionPolicy();
        seeded.setCollegeId(college);
        seeded.setDataCategory(RetentionPolicy.ACCOUNT_RECORDS);
        seeded.setRetentionDays(DEFAULT_RETENTION_DAYS);
        seeded.setEnabled(false);
        return List.of(policyRepository.save(seeded));
    }

    @Transactional
    public List<RetentionPolicy> updatePolicies(List<RetentionPolicyUpdate> updates) {
        Integer college = tenant.collegeId();
        for (RetentionPolicyUpdate u : updates) {
            if (!RetentionPolicy.ACCOUNT_RECORDS.equals(u.dataCategory())) {
                throw new BusinessRuleViolationException("Unknown data category: " + u.dataCategory());
            }
            if (u.retentionDays() < 1) {
                throw new BusinessRuleViolationException("Retention period must be at least 1 day");
            }
            if (u.triggerEvent() == null || u.action() == null) {
                throw new BusinessRuleViolationException("Trigger event and action are required");
            }
        }
        for (RetentionPolicyUpdate u : updates) {
            RetentionPolicy p = policyRepository.findByCollegeIdAndDataCategory(college, u.dataCategory())
                    .orElseGet(() -> {
                        RetentionPolicy created = new RetentionPolicy();
                        created.setCollegeId(college);
                        created.setDataCategory(u.dataCategory());
                        return created;
                    });
            p.setRetentionDays(u.retentionDays());
            p.setTriggerEvent(u.triggerEvent());
            p.setAction(u.action());
            p.setEnabled(u.enabled());
            policyRepository.save(p);
            audit.record(college, tenant.userId(), null, "RETENTION_POLICY_UPDATED",
                    "category=" + u.dataCategory() + ", days=" + u.retentionDays() + ", enabled=" + u.enabled());
        }
        return policyRepository.findByCollegeId(college);
    }

    /**
     * Deliberately not {@code @Transactional}: each erasure commits on its own, so one failing user rolls
     * back only itself instead of marking a surrounding transaction rollback-only.
     */
    public RetentionRun run(Integer collegeId, boolean dryRun, Integer actorId) {
        RetentionRun run = new RetentionRun();
        run.setCollegeId(collegeId);
        run.setDryRun(dryRun);
        run.setStartedAt(LocalDateTime.now());
        run = runRepository.save(run);
        int processed = 0;
        int failed = 0;
        try {
            for (RetentionPolicy policy : policyRepository.findByCollegeIdAndEnabledTrue(collegeId)) {
                LocalDateTime cutoff = LocalDateTime.now().minusDays(policy.getRetentionDays());
                for (User user : candidates.findExpiredInactive(collegeId, cutoff, ELIGIBLE_ROLES)) {
                    if (dryRun) {
                        processed++;
                        continue;
                    }
                    try {
                        erasure.erase(collegeId, user.getUserId(), actorId, "Retention policy " + policy.getDataCategory());
                        processed++;
                    } catch (RuntimeException e) {
                        failed++;
                        log.warn("Retention erasure failed for user {} in college {}: {}", user.getUserId(), collegeId, e.toString());
                    }
                }
            }
            run.setStatus(RetentionRunStatus.COMPLETED);
        } catch (RuntimeException e) {
            run.setStatus(RetentionRunStatus.FAILED);
            log.error("Retention run for college {} failed: {}", collegeId, e.toString());
        }
        run.setRecordsProcessed(processed);
        run.setRecordsFailed(failed);
        run.setFinishedAt(LocalDateTime.now());
        run = runRepository.save(run);
        audit.record(collegeId, actorId, null, dryRun ? "RETENTION_DRY_RUN" : "RETENTION_RUN",
                "runId=" + run.getRunId() + ", processed=" + processed + ", failed=" + failed);
        return run;
    }

    public RetentionRun runNow(boolean dryRun) {
        return run(tenant.collegeId(), dryRun, tenant.userId());
    }

    @Transactional(readOnly = true)
    public Page<RetentionRun> runs(Integer collegeParam, Pageable pageable) {
        return runRepository.findByCollegeIdOrderByRunIdDesc(tenant.collegeId(collegeParam), pageable);
    }
}
