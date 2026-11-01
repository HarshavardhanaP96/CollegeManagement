package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_request_events")
@Data
@NoArgsConstructor
public class DataRequestEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Integer eventId;

    @Column(name = "request_id", nullable = false)
    private Integer requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private RequestStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private RequestStatus toStatus;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    void prePersist() {
        if (occurredAt == null) occurredAt = LocalDateTime.now();
    }
}
