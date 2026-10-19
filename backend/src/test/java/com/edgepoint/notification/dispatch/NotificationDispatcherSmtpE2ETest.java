package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationConfig;
import com.edgepoint.notification.domain.NotificationEventType;
import com.edgepoint.notification.repository.NotificationChannelRuleRepository;
import com.edgepoint.notification.repository.NotificationConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Opt-in: delivers a real email through {@link NotificationDispatcher} to a local Mailpit/MailHog
 * and reads it back over the Mailpit API. Run with e.g.
 * {@code docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit} then
 * {@code NOTIF_SMTP_PORT=1025 NOTIF_MAIL_API_PORT=8025 mvn test -Dtest=NotificationDispatcherSmtpE2ETest}.
 */
@EnabledIfEnvironmentVariable(named = "NOTIF_SMTP_PORT", matches = "\\d+")
class NotificationDispatcherSmtpE2ETest {

    @Test
    void absenceEmailIsDeliveredToTheSmtpServer() throws Exception {
        int smtpPort = Integer.parseInt(System.getenv("NOTIF_SMTP_PORT"));
        String api = "http://127.0.0.1:" + System.getenv("NOTIF_MAIL_API_PORT") + "/api/v1";
        RestTemplate http = new RestTemplate();
        http.delete(api + "/messages");

        NotificationConfig config = new NotificationConfig();
        config.setCollegeId(7);
        config.setSmtpEnabled(true);
        config.setSmtpHost("127.0.0.1");
        config.setSmtpPort(smtpPort);
        config.setSmtpUseSsl(false);
        config.setSmtpFromEmail("noreply@college.edu");
        config.setSmtpFromName("Test College");
        NotificationConfigRepository configRepo = mock(NotificationConfigRepository.class);
        when(configRepo.findByCollegeId(7)).thenReturn(Optional.of(config));
        NotificationChannelRuleRepository ruleRepo = mock(NotificationChannelRuleRepository.class);
        when(ruleRepo.findByCollegeId(7)).thenReturn(List.of());

        NotificationDispatcher dispatcher = new NotificationDispatcher(
                configRepo, ruleRepo, new SmtpEmailSender(), mock(WhatsAppCloudSender.class));

        dispatcher.onNotification(new NotificationMessage(7, NotificationEventType.ATTENDANCE_ABSENCE,
                "parent@example.com", "+911234567890", "Absence notice: Asha Rao",
                "Asha Rao (roll no. R1) was marked absent on 2026-10-19."));

        JsonNode list = new ObjectMapper().readTree(http.getForObject(api + "/messages", String.class));
        assertThat(list.get("total").asInt()).isEqualTo(1);
        JsonNode mail = list.get("messages").get(0);
        assertThat(mail.get("Subject").asText()).isEqualTo("Absence notice: Asha Rao");
        assertThat(mail.get("To").get(0).get("Address").asText()).isEqualTo("parent@example.com");
        assertThat(mail.get("From").get("Address").asText()).isEqualTo("noreply@college.edu");
        assertThat(mail.get("From").get("Name").asText()).isEqualTo("Test College");
        assertThat(mail.get("Snippet").asText()).contains("was marked absent on 2026-10-19");
    }
}
