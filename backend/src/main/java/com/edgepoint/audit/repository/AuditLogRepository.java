package com.edgepoint.audit.repository;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            select a from AuditLog a
            where (:collegeId is null or a.collegeId = :collegeId)
              and (:action is null or a.action = :action)
              and (:entityType is null or a.entityType = :entityType)
              and (:fromTs is null or a.createdAt >= :fromTs)
              and (:toTs is null or a.createdAt < :toTs)
            order by a.createdAt desc, a.id desc
            """)
    Page<AuditLog> search(@Param("collegeId") Integer collegeId,
                          @Param("action") AuditAction action,
                          @Param("entityType") String entityType,
                          @Param("fromTs") LocalDateTime fromTs,
                          @Param("toTs") LocalDateTime toTs,
                          Pageable pageable);
}
