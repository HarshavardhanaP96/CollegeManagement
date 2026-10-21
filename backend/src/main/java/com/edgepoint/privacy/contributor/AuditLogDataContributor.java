package com.edgepoint.privacy.contributor;

import com.edgepoint.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** Scrubs personal data that the generic audit log captured for a user when they are erased. */
@Component
@RequiredArgsConstructor
public class AuditLogDataContributor implements PersonalDataContributor {

    static final List<String> PERSONAL_ENTITIES = List.of("User", "StudentProfile");

    private final AuditLogRepository auditLogs;

    @Override
    public String section() {
        return "audit";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        return Map.of();
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of();
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        // audit rows are never corrected
    }

    @Override
    public boolean appliesTo(Integer userId) {
        return false;
    }

    @Override
    public void anonymise(Integer userId) {
        auditLogs.scrubChanges(PERSONAL_ENTITIES, String.valueOf(userId));
        auditLogs.clearActorUsername(userId);
    }
}
