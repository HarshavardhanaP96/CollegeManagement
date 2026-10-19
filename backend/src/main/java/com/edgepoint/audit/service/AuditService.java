package com.edgepoint.audit.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.dto.AuditLogDTO;
import com.edgepoint.core.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AuditService {

    /** Records an event for the current tenant/user. Never throws into the caller. */
    void record(AuditAction action, String entityType, String entityId, String changesJson);

    void recordLogin(User user, boolean success);

    Page<AuditLogDTO> search(Integer collegeId, AuditAction action, String entityType,
                             LocalDateTime from, LocalDateTime to, Pageable pageable);
}
