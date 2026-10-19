package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.PrivacyAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrivacyAuditLogRepository extends JpaRepository<PrivacyAuditLog, Long> {
    Page<PrivacyAuditLog> findByCollegeIdOrderByAuditIdDesc(Integer collegeId, Pageable pageable);
}
