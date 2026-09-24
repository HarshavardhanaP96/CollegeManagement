package com.edgepoint.core.alerting;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tracks unhandled 5xx errors (see GlobalExceptionHandler#handleGlobalException) in a fixed
 * window and fires a Discord alert when they cross app.alerting.error-threshold-count within
 * that window — the "frequent failures" alert.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FailureRateMonitor {

    private final DiscordAlertService discordAlertService;

    @Value("${app.alerting.error-threshold-count:5}")
    private int thresholdCount;

    private final AtomicInteger failureCount = new AtomicInteger(0);

    public void recordFailure() {
        failureCount.incrementAndGet();
    }

    @Scheduled(fixedRateString = "${app.alerting.error-threshold-window-seconds:60}000")
    void checkFailureRate() {
        int count = failureCount.getAndSet(0);
        if (count >= thresholdCount) {
            log.warn("Frequent failures detected: {} unhandled errors in the last window", count);
            discordAlertService.alertFailureRate(
                    "⚠️ Frequent failures detected",
                    String.format("**%d** unhandled server errors occurred in the last check window.", count)
            );
        }
    }
}
