package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationConfig;
import com.edgepoint.notification.domain.NotificationEventType;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class WhatsAppCloudSenderTest {

    private final RestTemplate restTemplate = new RestTemplate();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
    private final WhatsAppCloudSender sender = new WhatsAppCloudSender(restTemplate);

    private static NotificationConfig config() {
        NotificationConfig c = new NotificationConfig();
        c.setWhatsappApiUrl("https://graph.example.com/v17.0/");
        c.setWhatsappApiKey("tok-123");
        c.setWhatsappPhoneNumberId("555");
        return c;
    }

    private static NotificationMessage message() {
        return new NotificationMessage(7, NotificationEventType.ATTENDANCE_ABSENCE,
                "p@x.com", "+91 12345-67890", "Subj", "Hello parent");
    }

    @Test
    void postsTextMessageWithBearerTokenToPhoneNumberEndpoint() {
        server.expect(requestTo("https://graph.example.com/v17.0/555/messages"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer tok-123"))
                .andExpect(jsonPath("$.messaging_product").value("whatsapp"))
                .andExpect(jsonPath("$.to").value("911234567890"))
                .andExpect(jsonPath("$.type").value("text"))
                .andExpect(jsonPath("$.text.body").value("Hello parent"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        sender.send(config(), message());

        server.verify();
    }

    @Test
    void apiErrorPropagatesSoDispatcherCanLogIt() {
        server.expect(requestTo("https://graph.example.com/v17.0/555/messages")).andRespond(withServerError());

        assertThatThrownBy(() -> sender.send(config(), message())).isInstanceOf(RestClientException.class);
    }

    @Test
    void incompleteConfig_isRejected() {
        NotificationConfig c = config();
        c.setWhatsappPhoneNumberId(null);

        assertThatThrownBy(() -> sender.send(c, message())).isInstanceOf(IllegalStateException.class);
    }
}
