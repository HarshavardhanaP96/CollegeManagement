package com.edgepoint.core.alerting;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Posts operational alerts (frequent failures, slow requests, support submissions) to a Discord
 * channel via an incoming webhook. Silently no-ops when app.discord.webhook-url isn't set, so
 * local dev and CI never need a real Discord server.
 */
@Slf4j
@Service
public class DiscordAlertService {

    private static final int COLOR_RED = 0xE53E3E;
    private static final int COLOR_ORANGE = 0xDD6B20;
    private static final int COLOR_BLUE = 0x3182CE;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.discord.webhook-url:}")
    private String webhookUrl;

    public void alertFailureRate(String title, String description) {
        send(title, description, COLOR_RED);
    }

    public void alertSlowRequest(String title, String description) {
        send(title, description, COLOR_ORANGE);
    }

    public void alertSupportSubmission(String title, String description) {
        send(title, description, COLOR_BLUE);
    }

    private void send(String title, String description, int color) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("Discord alert skipped (app.discord.webhook-url not configured): {}", title);
            return;
        }

        Map<String, Object> embed = Map.of(
                "title", title,
                "description", description,
                "color", color,
                "timestamp", Instant.now().toString()
        );
        Map<String, Object> payload = Map.of("embeds", List.of(embed));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            restTemplate.postForEntity(webhookUrl, new HttpEntity<>(payload, headers), String.class);
        } catch (RestClientException e) {
            log.error("Failed to send Discord alert '{}': {}", title, e.getMessage());
        }
    }
}
