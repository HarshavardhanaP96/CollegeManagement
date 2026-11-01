package com.edgepoint.core.security;

import com.edgepoint.core.domain.RefreshToken;
import com.edgepoint.core.repository.RefreshTokenRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Login lockout and refresh-token revocation against the real context")
class AuthHardeningIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    @AfterEach
    void tearDown() {
        refreshTokenRepository.deleteAll();
    }

    private void attemptLogin(String username, int expectedStatus) throws Exception {
        mockMvc.perform(post("/auth/login")
                        .with(r -> { r.setRemoteAddr("10.9.8.7"); return r; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"wrong-pass\"}"))
                .andExpect(status().is(expectedStatus));
    }

    @Test
    @DisplayName("sixth failed login for an account gets a generic 429")
    void lockoutReturnsGeneric429() throws Exception {
        for (int i = 0; i < 5; i++) {
            attemptLogin("lockout-target", 401);
        }

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"lockout-target\",\"password\":\"wrong-pass\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", not(containsString("lockout-target"))))
                .andExpect(jsonPath("$.message", not(containsString("account found"))));
    }

    @Test
    @DisplayName("revokeIfActive succeeds once, so concurrent reuse is detected")
    void revokeIfActiveIsSingleShot() {
        RefreshToken token = new RefreshToken();
        token.setUserId(42);
        token.setTokenHash("a".repeat(64));
        token.setExpiresAt(LocalDateTime.now().plusDays(1));
        refreshTokenRepository.save(token);

        assertThat(refreshTokenRepository.revokeIfActive("a".repeat(64), LocalDateTime.now())).isEqualTo(1);
        assertThat(refreshTokenRepository.revokeIfActive("a".repeat(64), LocalDateTime.now())).isZero();
    }

    @Test
    @DisplayName("revokeAllForUser revokes only that user's active tokens")
    void revokeAllForUser() {
        for (String hash : new String[]{"b".repeat(64), "c".repeat(64)}) {
            RefreshToken token = new RefreshToken();
            token.setUserId(42);
            token.setTokenHash(hash);
            token.setExpiresAt(LocalDateTime.now().plusDays(1));
            refreshTokenRepository.save(token);
        }
        RefreshToken other = new RefreshToken();
        other.setUserId(43);
        other.setTokenHash("d".repeat(64));
        other.setExpiresAt(LocalDateTime.now().plusDays(1));
        refreshTokenRepository.save(other);

        assertThat(refreshTokenRepository.revokeAllForUser(42, LocalDateTime.now())).isEqualTo(2);
        assertThat(refreshTokenRepository.findByTokenHash("d".repeat(64)).orElseThrow().getRevokedAt()).isNull();
    }
}
