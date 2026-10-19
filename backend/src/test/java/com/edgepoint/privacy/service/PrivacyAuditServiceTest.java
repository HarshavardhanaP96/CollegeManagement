package com.edgepoint.privacy.service;

import com.edgepoint.privacy.domain.PrivacyAuditLog;
import com.edgepoint.privacy.repository.PrivacyAuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrivacyAuditServiceTest {

    @Mock PrivacyAuditLogRepository repository;
    @Mock PrivacyTenant tenant;

    @Test
    void recordPersistsEveryField() {
        new PrivacyAuditService(repository, tenant).record(7, 99, 42, "ERASURE_EXECUTED", "request 3");

        ArgumentCaptor<PrivacyAuditLog> saved = ArgumentCaptor.forClass(PrivacyAuditLog.class);
        verify(repository).save(saved.capture());
        PrivacyAuditLog row = saved.getValue();
        assertThat(row.getCollegeId()).isEqualTo(7);
        assertThat(row.getActorId()).isEqualTo(99);
        assertThat(row.getSubjectUserId()).isEqualTo(42);
        assertThat(row.getAction()).isEqualTo("ERASURE_EXECUTED");
        assertThat(row.getDetails()).isEqualTo("request 3");
    }

    @Test
    void searchIsScopedToTheResolvedCollege() {
        Pageable page = PageRequest.of(0, 20);
        when(tenant.collegeId(3)).thenReturn(7);
        when(repository.findByCollegeIdOrderByAuditIdDesc(7, page)).thenReturn(new PageImpl<>(List.of(new PrivacyAuditLog())));

        assertThat(new PrivacyAuditService(repository, tenant).search(3, page).getContent()).hasSize(1);
        verify(repository).findByCollegeIdOrderByAuditIdDesc(7, page);
    }
}
