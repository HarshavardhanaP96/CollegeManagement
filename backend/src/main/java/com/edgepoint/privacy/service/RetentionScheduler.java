package com.edgepoint.privacy.service;

import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.privacy.config.PrivacyProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Nightly retention pass over every live college. Dry-run unless app.privacy.retention-dry-run=false.
 * Not cluster-safe (no distributed lock): run a single replica of this job, or keep it in dry-run.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RetentionScheduler {

    private final CollegeRepository colleges;
    private final RetentionService service;
    private final PrivacyProperties properties;

    @Scheduled(cron = "${app.privacy.retention-cron:0 30 2 * * *}")
    public void runNightly() {
        colleges.findAll().stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .forEach(c -> {
                    try {
                        service.run(c.getCollegeId(), properties.isRetentionDryRun(), null);
                    } catch (RuntimeException e) {
                        log.error("Nightly retention failed for college {}: {}", c.getCollegeId(), e.toString());
                    }
                });
    }
}
