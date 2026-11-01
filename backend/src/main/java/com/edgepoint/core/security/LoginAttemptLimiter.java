package com.edgepoint.core.security;

import com.edgepoint.core.exception.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Blocks login for an account after 5 failures, or for a client IP after 20 failures, within a
 * sliding 15-minute window. Unknown usernames count too, so it also slows account enumeration.
 */
// shortcut: per-instance in-memory counters, move to Redis/DB when running >1 replica
@Component
public class LoginAttemptLimiter {

    static final int MAX_ACCOUNT_FAILURES = 5;
    static final int MAX_IP_FAILURES = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int PRUNE_THRESHOLD = 10_000;

    private final Map<String, Deque<Instant>> failures = new HashMap<>();
    private final Clock clock;

    public LoginAttemptLimiter() {
        this(Clock.systemUTC());
    }

    LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    public synchronized void check(String account, String ip) {
        if (recentFailures(accountKey(account)) >= MAX_ACCOUNT_FAILURES
                || recentFailures(ipKey(ip)) >= MAX_IP_FAILURES) {
            throw new TooManyRequestsException(WINDOW);
        }
    }

    public synchronized void recordFailure(String account, String ip) {
        Instant now = clock.instant();
        failures.computeIfAbsent(accountKey(account), k -> new ArrayDeque<>()).addLast(now);
        failures.computeIfAbsent(ipKey(ip), k -> new ArrayDeque<>()).addLast(now);
        if (failures.size() > PRUNE_THRESHOLD) {
            failures.values().forEach(this::dropExpired);
            failures.values().removeIf(Deque::isEmpty);
        }
    }

    public synchronized void recordSuccess(String account) {
        failures.remove(accountKey(account));
    }

    private int recentFailures(String key) {
        Deque<Instant> attempts = failures.get(key);
        if (attempts == null) {
            return 0;
        }
        dropExpired(attempts);
        return attempts.size();
    }

    private void dropExpired(Deque<Instant> attempts) {
        Instant cutoff = clock.instant().minus(WINDOW);
        while (!attempts.isEmpty() && !attempts.peekFirst().isAfter(cutoff)) {
            attempts.pollFirst();
        }
    }

    private static String accountKey(String account) {
        return "account:" + (account == null ? "" : account.trim().toLowerCase(Locale.ROOT));
    }

    private static String ipKey(String ip) {
        return "ip:" + ip;
    }
}
