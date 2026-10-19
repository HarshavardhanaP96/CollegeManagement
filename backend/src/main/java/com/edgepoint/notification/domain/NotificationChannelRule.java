package com.edgepoint.notification.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Per-college routing of one {@link NotificationEventType} to delivery channels.
 * A missing row means the defaults apply (email on, WhatsApp off).
 */
@Entity
@Table(name = "notification_channel_rules",
        uniqueConstraints = @UniqueConstraint(name = "uq_channel_rule_college_event", columnNames = {"college_id", "event_type"}))
@Getter
@Setter
@NoArgsConstructor
public class NotificationChannelRule extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private NotificationEventType eventType;

    @Column(name = "email_enabled", nullable = false)
    private Boolean emailEnabled = Boolean.TRUE;

    @Column(name = "whatsapp_enabled", nullable = false)
    private Boolean whatsappEnabled = Boolean.FALSE;
}
