package com.edgepoint.notification.dispatch;

import com.edgepoint.notification.domain.NotificationConfig;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Sends a plain-text message via the WhatsApp Cloud API
 * ({@code POST {apiUrl}/{phoneNumberId}/messages}). Note: Meta only delivers free-form text inside
 * a 24h customer-service window; business-initiated sends need an approved template, which this
 * sender does not use yet.
 */
@Component
public class WhatsAppCloudSender {

    private final RestTemplate restTemplate;

    public WhatsAppCloudSender(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public void send(NotificationConfig config, NotificationMessage message) {
        if (!StringUtils.hasText(config.getWhatsappApiUrl())
                || !StringUtils.hasText(config.getWhatsappApiKey())
                || !StringUtils.hasText(config.getWhatsappPhoneNumberId())) {
            throw new IllegalStateException("WhatsApp API URL, access token and phone number ID must be configured");
        }
        String base = config.getWhatsappApiUrl();
        String url = (base.endsWith("/") ? base : base + "/") + config.getWhatsappPhoneNumberId() + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(config.getWhatsappApiKey());

        Map<String, Object> payload = Map.of(
                "messaging_product", "whatsapp",
                "to", message.recipientPhone().replaceAll("[^0-9]", ""),
                "type", "text",
                "text", Map.of("body", message.body()));

        restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), String.class);
    }
}
