package com.edgepoint.audit.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.audit.dto.AuditLogDTO;
import com.edgepoint.audit.repository.AuditLogRepository;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private static final int SUPERADMIN_ROLE_ID = 1;

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditAction action, String entityType, String entityId, String changesJson) {
        Integer collegeId = tenantContext.getCollegeId();
        if (collegeId == null) {
            return; // not attributable to a customer
        }
        try {
            Integer actorId = tenantContext.getCurrentUserId();
            AuditLog entry = new AuditLog();
            entry.setCollegeId(collegeId);
            entry.setActorUserId(actorId);
            if (actorId != null) {
                userRepository.findById(actorId).ifPresent(u -> entry.setActorUsername(u.getUsername()));
            }
            entry.setAction(action);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setChanges(changesJson);
            auditLogRepository.save(entry);
        } catch (RuntimeException e) {
            log.warn("Failed to write audit entry for {} {}", entityType, entityId, e);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLogin(User user, boolean success) {
        if (user.getCollegeId() == null) {
            return;
        }
        try {
            AuditLog entry = new AuditLog();
            entry.setCollegeId(user.getCollegeId());
            entry.setActorUserId(user.getUserId());
            entry.setActorUsername(user.getUsername());
            entry.setAction(success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILURE);
            entry.setEntityType("User");
            entry.setEntityId(user.getUserId() == null ? null : String.valueOf(user.getUserId()));
            auditLogRepository.save(entry);
        } catch (RuntimeException e) {
            log.warn("Failed to write login audit entry", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> search(Integer collegeId, AuditAction action, String entityType,
                                    LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Integer scope = isSuperAdmin() ? collegeId : tenantContext.getCollegeId();
        if (scope == null && !isSuperAdmin()) {
            return Page.empty(pageable);
        }
        return auditLogRepository.search(scope, action, entityType, from, to, pageable)
                .map(AuditLogDTO::from);
    }

    private boolean isSuperAdmin() {
        Integer role = tenantContext.getRoleId();
        return role != null && role == SUPERADMIN_ROLE_ID;
    }
}
