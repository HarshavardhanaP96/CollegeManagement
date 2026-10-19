package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Immutable once published: a new text is a new version row. */
@Entity
@Table(name = "privacy_notices",
        uniqueConstraints = @UniqueConstraint(name = "uq_privacy_notices_college_version", columnNames = {"college_id", "version"}))
@Data
@NoArgsConstructor
public class PrivacyNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Integer noticeId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "published_by")
    private Integer publishedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (effectiveFrom == null) effectiveFrom = createdAt;
    }
}
