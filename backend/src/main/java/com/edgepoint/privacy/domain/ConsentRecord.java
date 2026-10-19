package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Append-only ledger row. The current state per (user, purpose) is the row with the highest id. */
@Entity
@Table(name = "consent_records")
@Data
@NoArgsConstructor
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "consent_id")
    private Integer consentId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "purpose_id", nullable = false)
    private Integer purposeId;

    @Column(name = "notice_id", nullable = false)
    private Integer noticeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ConsentStatus status;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @PrePersist
    void prePersist() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }
}
