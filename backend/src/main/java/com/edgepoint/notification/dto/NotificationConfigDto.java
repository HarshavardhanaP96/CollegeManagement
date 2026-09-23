package com.edgepoint.notification.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Read-only DTO returned to both SUPERADMIN and COLLEGEADMIN.
 * Sensitive fields (password, API key) are replaced by boolean flags.
 */
@Data
@Builder
public class NotificationConfigDto {

    private Long id;
    private Integer collegeId;

    // SMTP
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpFromEmail;
    private String smtpFromName;
    private Boolean smtpUseSsl;
    private Boolean smtpEnabled;
    /** True if a password has been stored; the actual value is never exposed. */
    private Boolean smtpPasswordSet;

    // WhatsApp
    private String whatsappApiUrl;
    private String whatsappPhoneNumberId;
    private String whatsappBusinessAccountId;
    private Boolean whatsappEnabled;
    /** True if an API key has been stored; the actual value is never exposed. */
    private Boolean whatsappApiKeySet;
}
