package com.edgepoint.notification.service;

import com.edgepoint.core.domain.College;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.notification.domain.NotificationChannelRule;
import com.edgepoint.notification.domain.NotificationEventType;
import com.edgepoint.notification.dto.NotificationChannelRuleDto;
import com.edgepoint.notification.dto.NotificationChannelRuleRequest;
import com.edgepoint.notification.repository.NotificationChannelRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationChannelRuleServiceTest {

    private static final int COLLEGE = 7;

    @Mock NotificationChannelRuleRepository repository;
    @Mock CollegeRepository collegeRepository;
    @Mock TenantContext tenantContext;

    NotificationChannelRuleService service;

    @BeforeEach
    void setUp() {
        service = new NotificationChannelRuleService(repository, collegeRepository, tenantContext);
        when(collegeRepository.findById(COLLEGE)).thenReturn(Optional.of(new College()));
        when(tenantContext.getRoleId()).thenReturn(1); // SUPERADMIN
        when(tenantContext.getCurrentUserId()).thenReturn(99);
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void getRules_returnsOneEntryPerEventTypeWithDefaultsWhenNothingStored() {
        when(repository.findByCollegeId(COLLEGE)).thenReturn(List.of());

        List<NotificationChannelRuleDto> rules = service.getRules(COLLEGE);

        assertThat(rules).hasSize(NotificationEventType.values().length);
        assertThat(rules).allSatisfy(r -> {
            assertThat(r.isEmailEnabled()).isTrue();
            assertThat(r.isWhatsappEnabled()).isFalse();
        });
    }

    @Test
    void getRules_overlaysStoredRulesOnDefaults() {
        NotificationChannelRule stored = rule(NotificationEventType.FEE_REMINDER, false, true);
        when(repository.findByCollegeId(COLLEGE)).thenReturn(List.of(stored));

        List<NotificationChannelRuleDto> rules = service.getRules(COLLEGE);

        NotificationChannelRuleDto fee = rules.stream()
                .filter(r -> r.getEventType() == NotificationEventType.FEE_REMINDER).findFirst().orElseThrow();
        assertThat(fee.isEmailEnabled()).isFalse();
        assertThat(fee.isWhatsappEnabled()).isTrue();
    }

    @Test
    void getRules_unknownCollege_throwsNotFound() {
        when(collegeRepository.findById(404)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getRules(404)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateRules_createsRowWhenNoneExists() {
        when(repository.findByCollegeId(COLLEGE)).thenReturn(List.of());

        service.updateRules(COLLEGE, List.of(request(NotificationEventType.ANNOUNCEMENT, true, true)));

        ArgumentCaptor<NotificationChannelRule> cap = ArgumentCaptor.forClass(NotificationChannelRule.class);
        verify(repository).save(cap.capture());
        assertThat(cap.getValue().getCollegeId()).isEqualTo(COLLEGE);
        assertThat(cap.getValue().getEventType()).isEqualTo(NotificationEventType.ANNOUNCEMENT);
        assertThat(cap.getValue().getEmailEnabled()).isTrue();
        assertThat(cap.getValue().getWhatsappEnabled()).isTrue();
        assertThat(cap.getValue().getCreatedBy()).isEqualTo(99);
    }

    @Test
    void updateRules_updatesExistingRowInPlace() {
        NotificationChannelRule existing = rule(NotificationEventType.MARKS_PUBLISHED, true, false);
        when(repository.findByCollegeId(COLLEGE)).thenReturn(List.of(existing));

        service.updateRules(COLLEGE, List.of(request(NotificationEventType.MARKS_PUBLISHED, false, true)));

        verify(repository).save(existing);
        assertThat(existing.getEmailEnabled()).isFalse();
        assertThat(existing.getWhatsappEnabled()).isTrue();
        assertThat(existing.getUpdatedBy()).isEqualTo(99);
    }

    @Test
    void updateRules_collegeAdminOfAnotherCollege_isDenied() {
        when(tenantContext.getRoleId()).thenReturn(2);
        when(tenantContext.getCollegeId()).thenReturn(8);

        assertThatThrownBy(() -> service.updateRules(COLLEGE, List.of()))
                .isInstanceOf(AccessDeniedException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void getRules_collegeAdminOfAnotherCollege_isDenied() {
        when(tenantContext.getRoleId()).thenReturn(2);
        when(tenantContext.getCollegeId()).thenReturn(8);

        assertThatThrownBy(() -> service.getRules(COLLEGE)).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateRules_collegeAdminOfOwnCollege_isAllowed() {
        when(tenantContext.getRoleId()).thenReturn(2);
        when(tenantContext.getCollegeId()).thenReturn(COLLEGE);
        when(repository.findByCollegeId(COLLEGE)).thenReturn(List.of());

        service.updateRules(COLLEGE, List.of(request(NotificationEventType.ANNOUNCEMENT, true, false)));

        verify(repository).save(any());
    }

    private static NotificationChannelRule rule(NotificationEventType t, boolean email, boolean wa) {
        NotificationChannelRule r = new NotificationChannelRule();
        r.setCollegeId(COLLEGE);
        r.setEventType(t);
        r.setEmailEnabled(email);
        r.setWhatsappEnabled(wa);
        return r;
    }

    private static NotificationChannelRuleRequest request(NotificationEventType t, boolean email, boolean wa) {
        NotificationChannelRuleRequest r = new NotificationChannelRuleRequest();
        r.setEventType(t);
        r.setEmailEnabled(email);
        r.setWhatsappEnabled(wa);
        return r;
    }
}
