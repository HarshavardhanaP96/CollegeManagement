package com.edgepoint.notification.dto;

import lombok.Data;

/**
 * Inbound write payload — SUPERADMIN only.
 * Password / API key fields are optional; omitting them leaves the stored secret unchanged.
 */
@Data
public class NotificationConfigRequest {

    // SMTP
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    /** If null or blank, the existing stored password is kept. */
    private String smtpPassword;
    private String smtpFromEmail;
    private String smtpFromName;
    private Boolean smtpUseSsl;
    private Boolean smtpEnabled;

    // WhatsApp
    private String whatsappApiUrl;
    /** If null or blank, the existing stored API key is kept. */
    private String whatsappApiKey;
    private String whatsappPhoneNumberId;
    private String whatsappBusinessAccountId;
    private Boolean whatsappEnabled;
}
