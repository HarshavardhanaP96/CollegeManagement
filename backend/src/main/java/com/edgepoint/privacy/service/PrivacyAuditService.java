package com.edgepoint.privacy.service;

import com.edgepoint.privacy.domain.PrivacyAuditLog;
import com.edgepoint.privacy.repository.PrivacyAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PrivacyAuditService {

    private final PrivacyAuditLogRepository repository;
    private final PrivacyTenant tenant;

    /** Joins the caller's transaction so the audit row and the action commit or roll back together. */
    @Transactional
    public void record(Integer collegeId, Integer actorId, Integer subjectUserId, String action, String details) {
        PrivacyAuditLog row = new PrivacyAuditLog();
        row.setCollegeId(collegeId);
        row.setActorId(actorId);
        row.setSubjectUserId(subjectUserId);
        row.setAction(action);
        row.setDetails(details);
        repository.save(row);
    }

    @Transactional(readOnly = true)
    public Page<PrivacyAuditLog> search(Integer collegeParam, Pageable pageable) {
        return repository.findByCollegeIdOrderByAuditIdDesc(tenant.collegeId(collegeParam), pageable);
    }
}
