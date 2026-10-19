package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationConfig;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Properties;

/** Sends email through the college's own SMTP server (credentials come from {@link NotificationConfig}). */
@Component
public class SmtpEmailSender {

    private static final String TIMEOUT_MS = "10000";

    public void send(NotificationConfig config, NotificationMessage message) {
        JavaMailSenderImpl mailSender = buildMailSender(config);
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, "UTF-8");
            if (StringUtils.hasText(config.getSmtpFromName())) {
                helper.setFrom(config.getSmtpFromEmail(), config.getSmtpFromName());
            } else {
                helper.setFrom(config.getSmtpFromEmail());
            }
            helper.setTo(message.recipientEmail());
            helper.setSubject(message.subject());
            helper.setText(message.body(), false);
            mailSender.send(mime);
        } catch (jakarta.mail.MessagingException | java.io.UnsupportedEncodingException e) {
            throw new IllegalStateException("Could not build email: " + e.getMessage(), e);
        }
    }

    static JavaMailSenderImpl buildMailSender(NotificationConfig config) {
        if (!StringUtils.hasText(config.getSmtpHost()) || !StringUtils.hasText(config.getSmtpFromEmail())) {
            throw new IllegalStateException("SMTP host and from-address must be configured");
        }
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(config.getSmtpHost());
        int port = config.getSmtpPort() != null ? config.getSmtpPort() : 587;
        sender.setPort(port);
        if (StringUtils.hasText(config.getSmtpUsername())) {
            sender.setUsername(config.getSmtpUsername());
            sender.setPassword(config.getSmtpPassword());
        }

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", String.valueOf(StringUtils.hasText(config.getSmtpUsername())));
        props.put("mail.smtp.connectiontimeout", TIMEOUT_MS);
        props.put("mail.smtp.timeout", TIMEOUT_MS);
        props.put("mail.smtp.writetimeout", TIMEOUT_MS);
        if (Boolean.TRUE.equals(config.getSmtpUseSsl())) {
            // 465 = implicit TLS; anything else (typically 587) = upgrade via STARTTLS
            props.put(port == 465 ? "mail.smtp.ssl.enable" : "mail.smtp.starttls.enable", "true");
        }
        return sender;
    }
}
