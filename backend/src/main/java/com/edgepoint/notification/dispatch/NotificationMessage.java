package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationEventType;

/**
 * A notification to deliver for one event. Published as a Spring application event;
 * {@link NotificationDispatcher} decides which channels carry it. A null/blank recipient
 * address means that channel is skipped.
 */
public record NotificationMessage(
        Integer collegeId,
        NotificationEventType eventType,
        String recipientEmail,
        String recipientPhone,
        String subject,
        String body) {
}
