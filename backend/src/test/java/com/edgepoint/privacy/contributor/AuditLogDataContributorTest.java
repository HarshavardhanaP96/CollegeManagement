package com.edgepoint.privacy.contributor;

import com.edgepoint.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogDataContributorTest {

    @Mock AuditLogRepository auditLogs;

    @Test
    void anonymiseScrubsChangesOfTheUsersOwnRowsAndTheirActorName() {
        new AuditLogDataContributor(auditLogs).anonymise(42);

        verify(auditLogs).scrubChanges(List.of("User", "StudentProfile"), "42");
        verify(auditLogs).clearActorUsername(42);
    }

    @Test
    void anonymiseTwiceIsHarmless() {
        AuditLogDataContributor c = new AuditLogDataContributor(auditLogs);
        c.anonymise(42);
        c.anonymise(42);
        verify(auditLogs, times(2)).clearActorUsername(42);
    }

    @Test
    void contributesNothingElse() {
        AuditLogDataContributor c = new AuditLogDataContributor(auditLogs);
        assertThat(c.section()).isEqualTo("audit");
        assertThat(c.export(42)).isEmpty();
        assertThat(c.correctableFields()).isEmpty();
        assertThat(c.appliesTo(42)).isFalse();
        c.correct(42, Map.of());
        verifyNoInteractions(auditLogs);
    }
}
