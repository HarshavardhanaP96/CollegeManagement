package com.edgepoint.notification.domain;

import com.edgepoint.core.domain.AuditableEntity;
import com.edgepoint.core.security.crypto.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.*;

/**
 * Stores per-college SMTP and WhatsApp Cloud API configuration.
 * Each college (identified by collegeId) has exactly one row.
 * SMTP password and WhatsApp API key are encrypted at rest (AES-256-GCM, see
 * {@link EncryptedStringConverter}) and are never returned to the client —
 * see {@code NotificationConfigDto}.
 */
@Entity
@Table(name = "notification_configs",
        uniqueConstraints = @UniqueConstraint(name = "uq_notification_config_college", columnNames = "college_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationConfig extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** FK to colleges.college_id */
    @Column(name = "college_id", nullable = false, unique = true)
    private Integer collegeId;

    // ── SMTP ──────────────────────────────────────────────────────────────────
    @Column(name = "smtp_host")
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "smtp_username")
    private String smtpUsername;

    /** Encrypted at rest; never returned to client */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "smtp_password")
    private String smtpPassword;

    @Column(name = "smtp_from_email")
    private String smtpFromEmail;

    @Column(name = "smtp_from_name")
    private String smtpFromName;

    @Column(name = "smtp_use_ssl")
    private Boolean smtpUseSsl = Boolean.TRUE;

    @Column(name = "smtp_enabled")
    private Boolean smtpEnabled = Boolean.FALSE;

    // ── WhatsApp Cloud API ────────────────────────────────────────────────────
    @Column(name = "whatsapp_api_url")
    private String whatsappApiUrl;

    /** Bearer token / API key — encrypted at rest; never returned to client */
    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "whatsapp_api_key", length = 1024)
    private String whatsappApiKey;

    @Column(name = "whatsapp_phone_number_id")
    private String whatsappPhoneNumberId;

    @Column(name = "whatsapp_business_account_id")
    private String whatsappBusinessAccountId;

    @Column(name = "whatsapp_enabled")
    private Boolean whatsappEnabled = Boolean.FALSE;
}
