package com.edgepoint.audit.controller;

import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogController")
class AuditLogControllerTest {

    @Mock private AuditService auditService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuditLogController(auditService))
                .setMessageConverters(new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(
                        org.springframework.http.converter.json.Jackson2ObjectMapperBuilder.json().build()))
                .build();
    }

    @Test
    @DisplayName("only admin roles may call the endpoint")
    void restrictedToAdmins() {
        PreAuthorize pre = AuditLogController.class.getAnnotation(PreAuthorize.class);
        assertThat(pre.value()).isEqualTo("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')");
    }

    @Test
    @DisplayName("filters are parsed and the date range becomes a half-open day window")
    void parsesFilters() throws Exception {
        when(auditService.search(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(), org.springframework.data.domain.PageRequest.of(2, 100), 0));

        mockMvc.perform(get("/audit-logs")
                        .param("action", "UPDATE").param("entityType", "Course")
                        .param("from", "2026-10-01").param("to", "2026-10-02")
                        .param("page", "2").param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(auditService).search(any(), eq(AuditAction.UPDATE), eq("Course"),
                eq(LocalDateTime.of(2026, 10, 1, 0, 0)), eq(LocalDateTime.of(2026, 10, 3, 0, 0)),
                pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100); // capped
    }

    @Test
    @DisplayName("unknown action is a 400, not a 500")
    void badActionRejected() throws Exception {
        mockMvc.perform(get("/audit-logs").param("action", "NOPE")).andExpect(status().isBadRequest());
    }
}
