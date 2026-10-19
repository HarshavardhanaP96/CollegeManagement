package com.edgepoint.notification.dto;

import com.edgepoint.notification.domain.NotificationEventType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationChannelRuleDto {
    private NotificationEventType eventType;
    private boolean emailEnabled;
    private boolean whatsappEnabled;
}
