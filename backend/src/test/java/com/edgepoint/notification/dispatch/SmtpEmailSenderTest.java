package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SmtpEmailSenderTest {

    private static NotificationConfig config(int port, boolean ssl) {
        NotificationConfig c = new NotificationConfig();
        c.setSmtpHost("smtp.example.com");
        c.setSmtpPort(port);
        c.setSmtpUsername("user");
        c.setSmtpPassword("pw");
        c.setSmtpFromEmail("noreply@college.edu");
        c.setSmtpUseSsl(ssl);
        return c;
    }

    @Test
    void port465WithSsl_usesImplicitSsl() {
        JavaMailSenderImpl s = SmtpEmailSender.buildMailSender(config(465, true));

        assertThat(s.getHost()).isEqualTo("smtp.example.com");
        assertThat(s.getPort()).isEqualTo(465);
        assertThat(s.getUsername()).isEqualTo("user");
        assertThat(s.getPassword()).isEqualTo("pw");
        assertThat(s.getJavaMailProperties()).containsEntry("mail.smtp.ssl.enable", "true");
        assertThat(s.getJavaMailProperties()).doesNotContainKey("mail.smtp.starttls.enable");
    }

    @Test
    void otherPortWithSsl_usesStartTls() {
        JavaMailSenderImpl s = SmtpEmailSender.buildMailSender(config(587, true));

        assertThat(s.getJavaMailProperties()).containsEntry("mail.smtp.starttls.enable", "true");
        assertThat(s.getJavaMailProperties()).doesNotContainKey("mail.smtp.ssl.enable");
    }

    @Test
    void sslOff_enablesNeitherAndSetsTimeouts() {
        JavaMailSenderImpl s = SmtpEmailSender.buildMailSender(config(25, false));

        assertThat(s.getJavaMailProperties()).doesNotContainKeys("mail.smtp.ssl.enable", "mail.smtp.starttls.enable");
        assertThat(s.getJavaMailProperties()).containsKey("mail.smtp.connectiontimeout");
        assertThat(s.getJavaMailProperties()).containsKey("mail.smtp.timeout");
    }

    @Test
    void missingHostOrFromAddress_isRejected() {
        NotificationConfig c = config(587, true);
        c.setSmtpHost(null);
        assertThatThrownBy(() -> SmtpEmailSender.buildMailSender(c)).isInstanceOf(IllegalStateException.class);

        NotificationConfig d = config(587, true);
        d.setSmtpFromEmail(" ");
        assertThatThrownBy(() -> SmtpEmailSender.buildMailSender(d)).isInstanceOf(IllegalStateException.class);
    }
}
