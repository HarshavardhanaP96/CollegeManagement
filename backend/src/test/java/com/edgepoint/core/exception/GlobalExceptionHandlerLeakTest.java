package com.edgepoint.core.exception;

import com.edgepoint.core.alerting.FailureRateMonitor;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@DisplayName("Error responses don't leak internals")
class GlobalExceptionHandlerLeakTest {

    private final FailureRateMonitor monitor = mock(FailureRateMonitor.class);
    private final GlobalExceptionHandler handler = new GlobalExceptionHandler(monitor);
    private final MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/things");

    private static void assertNoInternals(ResponseEntity<ErrorResponse> response) {
        String body = String.valueOf(response.getBody());
        assertThat(body)
                .doesNotContain("Exception")
                .doesNotContain("com.edgepoint")
                .doesNotContain("SELECT")
                .doesNotContain("uk_users_email")
                .doesNotContain("at ");
    }

    @Test
    @DisplayName("unexpected exceptions return a generic 500 message")
    void unexpectedException() {
        RuntimeException ex = new IllegalStateException(
                "SELECT * FROM users failed in com.edgepoint.core.Thing at line 3");
        ResponseEntity<ErrorResponse> response = handler.handleGlobalException(ex, request);
        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertNoInternals(response);
    }

    @Test
    @DisplayName("data integrity errors never echo the SQL or constraint name")
    void dataIntegrityViolation() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "could not execute statement [ERROR: duplicate key value violates unique constraint "
                        + "\"uk_users_email\"] [insert into users (email) values (?)]; SQL [SELECT 1]");
        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrityViolationException(ex, request);
        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertNoInternals(response);
    }

    @Test
    @DisplayName("an unknown path is a 404, not a 500 that trips failure alerts")
    void unknownPathIsNotFound() {
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "nope");
        ResponseEntity<ErrorResponse> response = handler.handleNoResourceFoundException(ex, request);
        assertThat(response.getStatusCode().value()).isEqualTo(404);
        verify(monitor, never()).recordFailure();
    }
}
