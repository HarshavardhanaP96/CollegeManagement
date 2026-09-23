package com.edgepoint.notification.service;

import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.notification.domain.NotificationConfig;
import com.edgepoint.notification.dto.NotificationConfigDto;
import com.edgepoint.notification.dto.NotificationConfigRequest;
import com.edgepoint.notification.repository.NotificationConfigRepository;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Business logic for per-college notification configuration.
 * <ul>
 *   <li>SUPERADMIN  — can read and write any college's config (collegeId supplied in path).</li>
 *   <li>COLLEGEADMIN — can only read their own college's config (collegeId from TenantContext).</li>
 * </ul>
 * Access-control enforcement happens at the controller layer via {@code @PreAuthorize}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationConfigService {

    private final NotificationConfigRepository repository;
    private final CollegeRepository collegeRepository;
    private final TenantContext tenantContext;

    // ── READ ─────────────────────────────────────────────────────────────────

    /**
     * Returns the notification config for the given college.
     * If no row exists yet, an empty/default DTO is returned (not 404) so the
     * frontend can display an empty form ready to be filled in.
     */
    @Transactional(readOnly = true)
    public NotificationConfigDto getConfig(Integer collegeId) {
        verifyCollegeExists(collegeId);
        return repository.findByCollegeId(collegeId)
                .map(this::toDto)
                .orElse(emptyDto(collegeId));
    }

    // ── WRITE (SUPERADMIN only) ───────────────────────────────────────────────

    /**
     * Creates or updates the notification config for the given college.
     * Secrets (password, API key) are only overwritten when the caller supplies
     * a non-blank value; omitting them leaves the existing stored secret intact.
     */
    @Transactional
    public NotificationConfigDto upsert(Integer collegeId, NotificationConfigRequest request) {
        verifyCollegeExists(collegeId);

        Integer actorId = tenantContext.getCurrentUserId();

        NotificationConfig config = repository.findByCollegeId(collegeId)
                .orElseGet(() -> {
                    NotificationConfig nc = new NotificationConfig();
                    nc.setCollegeId(collegeId);
                    nc.setCreatedBy(actorId);
                    return nc;
                });

        // SMTP
        if (request.getSmtpHost() != null)      config.setSmtpHost(request.getSmtpHost());
        if (request.getSmtpPort() != null)      config.setSmtpPort(request.getSmtpPort());
        if (request.getSmtpUsername() != null)  config.setSmtpUsername(request.getSmtpUsername());
        if (StringUtils.hasText(request.getSmtpPassword())) {
            config.setSmtpPassword(request.getSmtpPassword());
        }
        if (request.getSmtpFromEmail() != null) config.setSmtpFromEmail(request.getSmtpFromEmail());
        if (request.getSmtpFromName() != null)  config.setSmtpFromName(request.getSmtpFromName());
        if (request.getSmtpUseSsl() != null)    config.setSmtpUseSsl(request.getSmtpUseSsl());
        if (request.getSmtpEnabled() != null)   config.setSmtpEnabled(request.getSmtpEnabled());

        // WhatsApp
        if (request.getWhatsappApiUrl() != null)             config.setWhatsappApiUrl(request.getWhatsappApiUrl());
        if (StringUtils.hasText(request.getWhatsappApiKey())) {
            config.setWhatsappApiKey(request.getWhatsappApiKey());
        }
        if (request.getWhatsappPhoneNumberId() != null)      config.setWhatsappPhoneNumberId(request.getWhatsappPhoneNumberId());
        if (request.getWhatsappBusinessAccountId() != null)  config.setWhatsappBusinessAccountId(request.getWhatsappBusinessAccountId());
        if (request.getWhatsappEnabled() != null)            config.setWhatsappEnabled(request.getWhatsappEnabled());

        config.setUpdatedBy(actorId);

        NotificationConfig saved = repository.save(config);
        log.info("NotificationConfig upserted for collegeId={} by userId={}", collegeId, actorId);
        return toDto(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void verifyCollegeExists(Integer collegeId) {
        collegeRepository.findById(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College not found: " + collegeId));
    }

    private NotificationConfigDto toDto(NotificationConfig nc) {
        return NotificationConfigDto.builder()
                .id(nc.getId())
                .collegeId(nc.getCollegeId())
                .smtpHost(nc.getSmtpHost())
                .smtpPort(nc.getSmtpPort())
                .smtpUsername(nc.getSmtpUsername())
                .smtpFromEmail(nc.getSmtpFromEmail())
                .smtpFromName(nc.getSmtpFromName())
                .smtpUseSsl(nc.getSmtpUseSsl())
                .smtpEnabled(nc.getSmtpEnabled())
                .smtpPasswordSet(StringUtils.hasText(nc.getSmtpPassword()))
                .whatsappApiUrl(nc.getWhatsappApiUrl())
                .whatsappPhoneNumberId(nc.getWhatsappPhoneNumberId())
                .whatsappBusinessAccountId(nc.getWhatsappBusinessAccountId())
                .whatsappEnabled(nc.getWhatsappEnabled())
                .whatsappApiKeySet(StringUtils.hasText(nc.getWhatsappApiKey()))
                .build();
    }

    private NotificationConfigDto emptyDto(Integer collegeId) {
        return NotificationConfigDto.builder()
                .collegeId(collegeId)
                .smtpUseSsl(Boolean.TRUE)
                .smtpEnabled(Boolean.FALSE)
                .smtpPasswordSet(Boolean.FALSE)
                .whatsappEnabled(Boolean.FALSE)
                .whatsappApiKeySet(Boolean.FALSE)
                .build();
    }
}
