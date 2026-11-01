package com.edgepoint.core.security;

import com.edgepoint.core.exception.TooManyRequestsException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Login attempt limiter")
class LoginAttemptLimiterTest {

    private MutableClock clock;
    private LoginAttemptLimiter limiter;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-10-31T10:00:00Z"));
        limiter = new LoginAttemptLimiter(clock);
    }

    private void fail(String account, String ip, int times) {
        for (int i = 0; i < times; i++) {
            limiter.recordFailure(account, ip);
        }
    }

    @Test
    @DisplayName("locks an account after 5 failures, from any IP")
    void locksAccount() {
        fail("teacher1", "10.0.0.1", 4);
        assertThatCode(() -> limiter.check("teacher1", "10.0.0.1")).doesNotThrowAnyException();

        limiter.recordFailure("teacher1", "10.0.0.2");

        assertThatThrownBy(() -> limiter.check("teacher1", "10.0.0.3")).isInstanceOf(TooManyRequestsException.class);
        assertThatCode(() -> limiter.check("someoneElse", "10.0.0.3")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("account key ignores case and surrounding spaces")
    void accountKeyNormalised() {
        fail(" Teacher1 ", "10.0.0.1", 5);
        assertThatThrownBy(() -> limiter.check("teacher1", "10.0.0.9")).isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    @DisplayName("lockout expires after 15 minutes")
    void lockExpires() {
        fail("teacher1", "10.0.0.1", 5);
        clock.advance(Duration.ofMinutes(15).plusSeconds(1));
        assertThatCode(() -> limiter.check("teacher1", "10.0.0.1")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("failures older than the window don't count")
    void windowSlides() {
        fail("teacher1", "10.0.0.1", 4);
        clock.advance(Duration.ofMinutes(16));
        limiter.recordFailure("teacher1", "10.0.0.1");
        assertThatCode(() -> limiter.check("teacher1", "10.0.0.1")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("success resets the account counter")
    void successResets() {
        fail("teacher1", "10.0.0.1", 4);
        limiter.recordSuccess("teacher1");
        fail("teacher1", "10.0.0.1", 4);
        assertThatCode(() -> limiter.check("teacher1", "10.0.0.1")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("locks an IP after 20 failures across many accounts")
    void locksIp() {
        for (int i = 0; i < 20; i++) {
            limiter.recordFailure("user" + i, "10.0.0.7");
        }
        assertThatThrownBy(() -> limiter.check("fresh", "10.0.0.7")).isInstanceOf(TooManyRequestsException.class);
        assertThatCode(() -> limiter.check("fresh", "10.0.0.8")).doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant now) { this.now = now; }

        void advance(Duration d) { now = now.plus(d); }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }

        @Override public Clock withZone(ZoneId zone) { return this; }

        @Override public Instant instant() { return now; }
    }
}
