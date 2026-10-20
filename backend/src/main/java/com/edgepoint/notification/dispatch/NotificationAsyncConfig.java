package com.edgepoint.notification.dispatch;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.time.Duration;

@Configuration
@EnableAsync
public class NotificationAsyncConfig {

    /** Shared HTTP client for outbound notification calls, with bounded timeouts. */
    @Bean
    public RestTemplate notificationRestTemplate(RestTemplateBuilder builder) {
        return builder.setConnectTimeout(Duration.ofSeconds(10)).setReadTimeout(Duration.ofSeconds(15)).build();
    }
}
