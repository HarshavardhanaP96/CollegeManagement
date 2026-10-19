package com.edgepoint.audit.service;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.audit.dto.AuditLogDTO;
import com.edgepoint.audit.repository.AuditLogRepository;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.security.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditService Unit Tests")
class AuditServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private TenantContext tenantContext;
    @InjectMocks private AuditServiceImpl auditService;

    @BeforeEach
    void setUp() {
        lenient().when(tenantContext.getCollegeId()).thenReturn(7);
        lenient().when(tenantContext.getCurrentUserId()).thenReturn(42);
        lenient().when(tenantContext.getRoleId()).thenReturn(2);
    }

    @Test
    @DisplayName("record stamps college and actor from the tenant context")
    void recordUsesTenantContext() {
        User actor = new User();
        actor.setUsername("admin1");
        when(userRepository.findById(42)).thenReturn(Optional.of(actor));

        auditService.record(AuditAction.CREATE, "Department", "5", "{\"deptName\":\"Physics\"}");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertThat(saved.getCollegeId()).isEqualTo(7);
        assertThat(saved.getActorUserId()).isEqualTo(42);
        assertThat(saved.getActorUsername()).isEqualTo("admin1");
        assertThat(saved.getAction()).isEqualTo(AuditAction.CREATE);
        assertThat(saved.getEntityType()).isEqualTo("Department");
        assertThat(saved.getEntityId()).isEqualTo("5");
        assertThat(saved.getChanges()).contains("Physics");
    }

    @Test
    @DisplayName("record without a tenant college is skipped (cannot be attributed to a customer)")
    void recordSkippedWithoutCollege() {
        when(tenantContext.getCollegeId()).thenReturn(null);

        auditService.record(AuditAction.UPDATE, "Department", "5", "{}");

        verifyNoInteractions(auditLogRepository);
    }

    @Test
    @DisplayName("failed login is recorded against the user's own college")
    void recordLoginFailure() {
        User user = new User();
        user.setUserId(9);
        user.setCollegeId(3);
        user.setUsername("teacher1");

        auditService.recordLogin(user, false);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getCollegeId()).isEqualTo(3);
        assertThat(captor.getValue().getActorUserId()).isEqualTo(9);
        assertThat(captor.getValue().getAction()).isEqualTo(AuditAction.LOGIN_FAILURE);
    }

    @Test
    @DisplayName("college admin search is always forced to own college")
    void searchForcedToOwnCollege() {
        Pageable pageable = PageRequest.of(0, 20);
        when(auditLogRepository.search(eq(7), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        auditService.search(999, null, null, null, null, pageable);

        verify(auditLogRepository).search(eq(7), any(), any(), any(), any(), eq(pageable));
    }

    @Test
    @DisplayName("superadmin may query any college or all colleges")
    void superAdminCanChooseCollege() {
        when(tenantContext.getRoleId()).thenReturn(1);
        Pageable pageable = PageRequest.of(0, 20);
        when(auditLogRepository.search(eq(999), any(), any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        auditService.search(999, null, null, null, null, pageable);

        verify(auditLogRepository).search(eq(999), any(), any(), any(), any(), eq(pageable));
    }

    @Test
    @DisplayName("search maps rows to DTOs")
    void searchMapsToDto() {
        AuditLog row = new AuditLog();
        row.setId(1L);
        row.setCollegeId(7);
        row.setActorUsername("admin1");
        row.setAction(AuditAction.UPDATE);
        row.setEntityType("Course");
        row.setEntityId("4");
        Pageable pageable = PageRequest.of(0, 20);
        when(auditLogRepository.search(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(row)));

        Page<AuditLogDTO> page = auditService.search(null, null, null, null, null, pageable);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getActorUsername()).isEqualTo("admin1");
        assertThat(page.getContent().get(0).getAction()).isEqualTo("UPDATE");
    }

    @Test
    @DisplayName("non-superadmin without a college gets nothing, never everything")
    void noCollegeNoData() {
        when(tenantContext.getCollegeId()).thenReturn(null);
        Pageable pageable = PageRequest.of(0, 20);

        Page<AuditLogDTO> page = auditService.search(null, null, null, null, null, pageable);

        assertThat(page.getContent()).isEmpty();
        verifyNoInteractions(auditLogRepository);
    }
}
