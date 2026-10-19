package com.edgepoint.audit.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Append-only record of who did what in a college. Not an AuditableEntity, so it is never itself audited. */
@Data
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "actor_user_id")
    private Integer actorUserId;

    @Column(name = "actor_username")
    private String actorUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditAction action;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id")
    private String entityId;

    /** JSON: field -> value on create, field -> {from,to} on update. Never contains secrets. */
    @Column(columnDefinition = "text")
    private String changes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
