package com.edgepoint.core.alerting;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Times every request; fires a Discord alert (with a per-route cooldown so a sustained slow
 * endpoint doesn't spam the channel) when a request takes longer than
 * app.alerting.slow-request-threshold-ms — the "very slow requests" alert.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SlowRequestInterceptor implements HandlerInterceptor {

    private static final String START_TIME_ATTR = "requestStartTimeMs";

    private final DiscordAlertService discordAlertService;

    @Value("${app.alerting.slow-request-threshold-ms:3000}")
    private long slowRequestThresholdMs;

    @Value("${app.alerting.cooldown-seconds:300}")
    private long cooldownSeconds;

    private final ConcurrentHashMap<String, AtomicLong> lastAlertAtByRoute = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_ATTR, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Object startAttr = request.getAttribute(START_TIME_ATTR);
        if (!(startAttr instanceof Long start)) {
            return;
        }

        long durationMs = System.currentTimeMillis() - start;
        if (durationMs < slowRequestThresholdMs) {
            return;
        }

        String route = request.getMethod() + " " + request.getRequestURI();
        AtomicLong lastAlertAt = lastAlertAtByRoute.computeIfAbsent(route, r -> new AtomicLong(0));
        long now = Instant.now().getEpochSecond();
        long previous = lastAlertAt.get();
        if (now - previous < cooldownSeconds) {
            return;
        }
        if (!lastAlertAt.compareAndSet(previous, now)) {
            return; // another thread just alerted for this route
        }

        log.warn("Slow request detected: {} took {}ms", route, durationMs);
        discordAlertService.alertSlowRequest(
                "🐌 Very slow request",
                String.format("`%s` took **%dms** (threshold: %dms).", route, durationMs, slowRequestThresholdMs)
        );
    }
}
