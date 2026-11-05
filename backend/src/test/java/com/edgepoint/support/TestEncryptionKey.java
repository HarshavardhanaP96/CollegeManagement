package com.edgepoint.support;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

/**
 * Test classpath only: gives every Spring test context an AES key, so no key value has to be
 * committed. One key per JVM, because the cached contexts share one in-memory H2 database.
 */
public class TestEncryptionKey implements EnvironmentPostProcessor {

    private static final String PROPERTY = "app.security.encryption-key";
    private static final String KEY = newKey();

    private static String newKey() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Respect a key set explicitly (e.g. ENCRYPTION_KEY exported by secrun).
        String configured = environment.getProperty(PROPERTY);
        if (configured == null || configured.isBlank()) {
            environment.getPropertySources().addFirst(new MapPropertySource("testEncryptionKey", Map.of(PROPERTY, KEY)));
        }
    }
}
