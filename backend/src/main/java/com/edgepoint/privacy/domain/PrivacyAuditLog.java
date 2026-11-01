package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Append-only. Never store PII values here; ids, field names and reasons only. */
@Entity
@Table(name = "privacy_audit_log")
@Data
@NoArgsConstructor
public class PrivacyAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "subject_user_id")
    private Integer subjectUserId;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
