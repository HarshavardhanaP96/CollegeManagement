package com.edgepoint.core.security.crypto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("EncryptedStringConverter key handling")
class EncryptedStringConverterTest {

    private static final String KEY = Base64.getEncoder()
            .encodeToString("test-only-key-never-use-for-real".getBytes(StandardCharsets.UTF_8));

    @Test
    @DisplayName("startup fails when ENCRYPTION_KEY is missing")
    void missingKeyFailsAtStartup() {
        assertThatThrownBy(() -> new EncryptedStringConverter(""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ENCRYPTION_KEY");
    }

    @Test
    @DisplayName("startup fails when the key is not 32 bytes, e.g. a leftover placeholder")
    void wrongLengthKeyFailsAtStartup() {
        String placeholder = Base64.getEncoder().encodeToString("prod-only-placeholder-key-REPLACE-ME".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> new EncryptedStringConverter(placeholder))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    @DisplayName("a valid key round-trips a secret")
    void roundTrips() {
        EncryptedStringConverter converter = new EncryptedStringConverter(KEY);

        String stored = converter.convertToDatabaseColumn("smtp-password");

        assertThat(stored).isNotEqualTo("smtp-password");
        assertThat(converter.convertToEntityAttribute(stored)).isEqualTo("smtp-password");
    }
}
