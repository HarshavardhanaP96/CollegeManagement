package com.edgepoint.notification.service;

import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.notification.domain.NotificationChannelRule;
import com.edgepoint.notification.domain.NotificationEventType;
import com.edgepoint.notification.dto.NotificationChannelRuleDto;
import com.edgepoint.notification.dto.NotificationChannelRuleRequest;
import com.edgepoint.notification.repository.NotificationChannelRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Per-college routing of notification events to channels (email / WhatsApp).
 * SUPERADMIN may manage any college; COLLEGEADMIN only their own.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationChannelRuleService {

    private static final int COLLEGE_ADMIN_ROLE_ID = 2;

    private final NotificationChannelRuleRepository repository;
    private final CollegeRepository collegeRepository;
    private final TenantContext tenantContext;

    /** Always returns one entry per event type, falling back to defaults for unconfigured events. */
    @Transactional(readOnly = true)
    public List<NotificationChannelRuleDto> getRules(Integer collegeId) {
        authorize(collegeId);
        Map<NotificationEventType, NotificationChannelRule> stored = repository.findByCollegeId(collegeId).stream()
                .collect(Collectors.toMap(NotificationChannelRule::getEventType, Function.identity()));

        return Arrays.stream(NotificationEventType.values())
                .map(type -> toDto(type, stored.get(type)))
                .toList();
    }

    @Transactional
    public List<NotificationChannelRuleDto> updateRules(Integer collegeId, List<NotificationChannelRuleRequest> requests) {
        authorize(collegeId);
        Integer actorId = tenantContext.getCurrentUserId();
        Map<NotificationEventType, NotificationChannelRule> stored = repository.findByCollegeId(collegeId).stream()
                .collect(Collectors.toMap(NotificationChannelRule::getEventType, Function.identity()));

        for (NotificationChannelRuleRequest req : requests) {
            NotificationChannelRule rule = stored.get(req.getEventType());
            if (rule == null) {
                rule = new NotificationChannelRule();
                rule.setCollegeId(collegeId);
                rule.setEventType(req.getEventType());
                rule.setCreatedBy(actorId);
            }
            rule.setEmailEnabled(req.isEmailEnabled());
            rule.setWhatsappEnabled(req.isWhatsappEnabled());
            rule.setUpdatedBy(actorId);
            stored.put(req.getEventType(), repository.save(rule));
        }
        log.info("Notification channel rules updated for collegeId={} by userId={}", collegeId, actorId);

        return Arrays.stream(NotificationEventType.values())
                .map(type -> toDto(type, stored.get(type)))
                .toList();
    }

    private void authorize(Integer collegeId) {
        Integer roleId = tenantContext.getRoleId();
        if (roleId != null && roleId == COLLEGE_ADMIN_ROLE_ID && !collegeId.equals(tenantContext.getCollegeId())) {
            throw new AccessDeniedException("You can only manage your own college's notification channels");
        }
        collegeRepository.findById(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College not found: " + collegeId));
    }

    private NotificationChannelRuleDto toDto(NotificationEventType type, NotificationChannelRule rule) {
        return NotificationChannelRuleDto.builder()
                .eventType(type)
                .emailEnabled(rule == null || Boolean.TRUE.equals(rule.getEmailEnabled()))
                .whatsappEnabled(rule != null && Boolean.TRUE.equals(rule.getWhatsappEnabled()))
                .build();
    }
}
