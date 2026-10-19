package com.edgepoint.notification.dto;

import com.edgepoint.notification.domain.NotificationEventType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationChannelRuleRequest {
    @NotNull
    private NotificationEventType eventType;
    private boolean emailEnabled;
    private boolean whatsappEnabled;
}
