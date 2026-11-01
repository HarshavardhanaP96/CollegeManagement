package com.edgepoint.privacy.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_requests")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class DataRequest extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private RequestType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RequestStatus status;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    /** JSON object {field: newValue}; only for CORRECTION. */
    @Column(name = "correction_payload", columnDefinition = "TEXT")
    private String correctionPayload;

    /** JSON bundle built when an ACCESS request is completed. */
    @Column(name = "export_payload", columnDefinition = "TEXT")
    private String exportPayload;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Column(name = "assigned_to")
    private Integer assignedTo;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
