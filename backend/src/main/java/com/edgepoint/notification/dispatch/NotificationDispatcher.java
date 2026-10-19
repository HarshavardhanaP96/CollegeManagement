package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationChannelRule;
import com.edgepoint.notification.domain.NotificationConfig;
import com.edgepoint.notification.repository.NotificationChannelRuleRepository;
import com.edgepoint.notification.repository.NotificationConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.util.StringUtils;

/**
 * Delivers {@link NotificationMessage} events. A channel is used only when the college's channel
 * rule for the event allows it (default: email on, WhatsApp off), the channel is enabled in the
 * college's {@link NotificationConfig}, and the message carries an address for it. Runs async and
 * after the publishing transaction commits; failures are logged and never reach the publisher.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationDispatcher {

    private final NotificationConfigRepository configRepository;
    private final NotificationChannelRuleRepository ruleRepository;
    private final SmtpEmailSender emailSender;
    private final WhatsAppCloudSender whatsAppSender;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onNotification(NotificationMessage message) {
        try {
            dispatch(message);
        } catch (RuntimeException e) {
            log.error("Notification dispatch failed for collegeId={} event={}: {}",
                    message.collegeId(), message.eventType(), e.getMessage(), e);
        }
    }

    private void dispatch(NotificationMessage message) {
        NotificationConfig config = configRepository.findByCollegeId(message.collegeId()).orElse(null);
        if (config == null) {
            log.debug("No notification config for collegeId={}; skipping {}", message.collegeId(), message.eventType());
            return;
        }

        NotificationChannelRule rule = ruleRepository.findByCollegeId(message.collegeId()).stream()
                .filter(r -> r.getEventType() == message.eventType())
                .findFirst().orElse(null);
        boolean emailAllowed = rule == null || Boolean.TRUE.equals(rule.getEmailEnabled());
        boolean whatsappAllowed = rule != null && Boolean.TRUE.equals(rule.getWhatsappEnabled());

        if (emailAllowed && Boolean.TRUE.equals(config.getSmtpEnabled()) && StringUtils.hasText(message.recipientEmail())) {
            attempt("email", message, () -> emailSender.send(config, message));
        }
        if (whatsappAllowed && Boolean.TRUE.equals(config.getWhatsappEnabled()) && StringUtils.hasText(message.recipientPhone())) {
            attempt("whatsapp", message, () -> whatsAppSender.send(config, message));
        }
    }

    private void attempt(String channel, NotificationMessage message, Runnable send) {
        try {
            send.run();
            log.info("Sent {} notification collegeId={} event={}", channel, message.collegeId(), message.eventType());
        } catch (RuntimeException e) {
            log.error("Failed to send {} notification collegeId={} event={}: {}",
                    channel, message.collegeId(), message.eventType(), e.getMessage());
        }
    }
}
