package com.edgepoint.audit.repository;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    /**
     * Newest first. Filters are added only when supplied: a "? is null or ..." JPQL
     * pattern fails on PostgreSQL ("could not determine data type of parameter").
     */
    default Page<AuditLog> search(Integer collegeId, AuditAction action, String entityType,
                                  LocalDateTime fromTs, LocalDateTime toTs, Pageable pageable) {
        Specification<AuditLog> spec = Specification.where(null);
        if (collegeId != null) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("collegeId"), collegeId));
        }
        if (action != null) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("action"), action));
        }
        if (entityType != null) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("entityType"), entityType));
        }
        if (fromTs != null) {
            spec = spec.and((r, q, cb) -> cb.greaterThanOrEqualTo(r.get("createdAt"), fromTs));
        }
        if (toTs != null) {
            spec = spec.and((r, q, cb) -> cb.lessThan(r.get("createdAt"), toTs));
        }
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return findAll(spec, sorted);
    }
}
