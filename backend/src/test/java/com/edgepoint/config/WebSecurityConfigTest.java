package com.edgepoint.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("HTTP security configuration")
class WebSecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    private MvcResult preflight(String origin) throws Exception {
        return mockMvc.perform(options("/colleges")
                        .header(HttpHeaders.ORIGIN, origin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andReturn();
    }

    @Test
    @DisplayName("CORS: an unknown origin gets no Access-Control-Allow-Origin")
    void corsRejectsUnknownOrigin() throws Exception {
        assertThat(preflight("https://evil.example").getResponse()
                .getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)).isNull();
    }

    @Test
    @DisplayName("CORS: a configured origin is echoed back")
    void corsAllowsConfiguredOrigin() throws Exception {
        assertThat(preflight("http://localhost:5173").getResponse()
                .getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)).isEqualTo("http://localhost:5173");
    }

    @Test
    @DisplayName("actuator health and info stay public for probes and the build footer")
    void healthAndInfoArePublic() throws Exception {
        int health = mockMvc.perform(get("/actuator/health")).andReturn().getResponse().getStatus();
        assertThat(health).isNotIn(401, 403); // 503 is fine: Redis isn't running under the test profile
        mockMvc.perform(get("/actuator/info")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("actuator health shows no component details to anonymous callers")
    void healthHidesDetailsFromAnonymous() throws Exception {
        String body = mockMvc.perform(get("/actuator/health")).andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("components").doesNotContain("details");
    }

    @Test
    @DisplayName("other actuator endpoints require authentication")
    void metricsRequireAuthentication() throws Exception {
        // The app has no 401 entry point, so anonymous denials come back as 403 like every other path.
        mockMvc.perform(get("/actuator/metrics")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    @DisplayName("other actuator endpoints are SUPERADMIN only")
    void metricsForbiddenForNonSuperadmin() throws Exception {
        mockMvc.perform(get("/actuator/metrics")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SUPERADMIN")
    @DisplayName("SUPERADMIN can read metrics")
    void metricsAllowedForSuperadmin() throws Exception {
        mockMvc.perform(get("/actuator/metrics")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("API docs are not served outside the dev profile")
    void apiDocsDisabledOutsideDev() throws Exception {
        int status = mockMvc.perform(get("/v3/api-docs")).andReturn().getResponse().getStatus();
        assertThat(status).isNotEqualTo(200);
    }

    @Test
    @DisplayName("responses carry security headers")
    void securityHeadersPresent() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(header().string("Content-Security-Policy", containsString("frame-ancestors 'none'")))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"));
    }

    @Test
    @DisplayName("HSTS is sent on HTTPS requests")
    void hstsOnSecureRequests() throws Exception {
        mockMvc.perform(get("/actuator/info").secure(true))
                .andExpect(header().string("Strict-Transport-Security", containsString("max-age=")));
    }
}
