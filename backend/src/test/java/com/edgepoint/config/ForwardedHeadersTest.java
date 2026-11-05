package com.edgepoint.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/** Real Tomcat, so the forwarded-header handling the proxy relies on is exercised end to end. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DisplayName("Forwarded headers from the reverse proxy")
class ForwardedHeadersTest {

    @Autowired
    private TestRestTemplate rest;

    private ResponseEntity<String> infoVia(String proto) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-Proto", proto);
        headers.set("X-Forwarded-For", "203.0.113.7");
        return rest.exchange("/actuator/info", HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    @Test
    @DisplayName("HTTPS terminated at a trusted proxy is treated as secure, so HSTS is sent")
    void httpsAtProxyGetsHsts() {
        assertThat(infoVia("https").getHeaders().getFirst("Strict-Transport-Security")).contains("max-age=");
    }

    @Test
    @DisplayName("plain HTTP at the proxy gets no HSTS")
    void httpAtProxyGetsNoHsts() {
        assertThat(infoVia("http").getHeaders().getFirst("Strict-Transport-Security")).isNull();
    }
}
