package com.edgepoint.core.security;

import com.edgepoint.core.domain.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JWT signing key and secret defaults")
class JwtServiceKeyTest {

    private JwtService service(String secret, boolean ephemeralAllowed) {
        JwtService jwt = new JwtService();
        ReflectionTestUtils.setField(jwt, "secretKey", secret);
        ReflectionTestUtils.setField(jwt, "expiration", 60_000L);
        ReflectionTestUtils.setField(jwt, "ephemeralKeyAllowed", ephemeralAllowed);
        return jwt;
    }

    @Test
    @DisplayName("startup fails when no secret is configured and no ephemeral key is allowed")
    void failsWithoutSecret() {
        assertThatThrownBy(() -> service("", false).init())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    @DisplayName("dev/test may run on a random per-process key")
    void ephemeralKeyWhenAllowed() {
        JwtService jwt = service("", true);
        jwt.init();
        User user = new User();
        user.setUsername("alice");
        String token = jwt.generateRefreshToken(user);
        assertThat(jwt.validateToken(token)).isTrue();
        assertThat(jwt.extractUsername(token)).isEqualTo("alice");
    }

    @Test
    @DisplayName("application.yml has no hard-coded JWT secret or DB password fallback")
    void defaultProfileHasNoSecretFallbacks() {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application.yml"));
        Properties props = yaml.getObject();
        assertThat(props.getProperty("spring.security.jwt.secret-key")).isEqualTo("${JWT_SECRET:}");
        assertThat(props.getProperty("spring.datasource.password")).isEqualTo("${SPRING_DATASOURCE_PASSWORD}");
    }
}
