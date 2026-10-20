package com.edgepoint.notification.controller;

import com.edgepoint.notification.domain.NotificationEventType;
import com.edgepoint.notification.dto.NotificationChannelRuleDto;
import com.edgepoint.notification.dto.NotificationChannelRuleRequest;
import com.edgepoint.notification.service.NotificationChannelRuleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationChannelRuleControllerTest {

    @Mock NotificationChannelRuleService service;
    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new NotificationChannelRuleController(service))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(Jackson2ObjectMapperBuilder.json().build()))
                .build();
    }

    @Test
    void get_returnsRulesInApiResponseEnvelope() throws Exception {
        when(service.getRules(7)).thenReturn(List.of(
                NotificationChannelRuleDto.builder().eventType(NotificationEventType.FEE_REMINDER)
                        .emailEnabled(true).whatsappEnabled(false).build()));

        mockMvc.perform(get("/colleges/7/notification-channel-rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].eventType").value("FEE_REMINDER"))
                .andExpect(jsonPath("$.data[0].emailEnabled").value(true))
                .andExpect(jsonPath("$.data[0].whatsappEnabled").value(false));
    }

    @Test
    @SuppressWarnings("unchecked")
    void put_passesParsedBodyToService() throws Exception {
        when(service.updateRules(eq(7), any())).thenReturn(List.of());

        mockMvc.perform(put("/colleges/7/notification-channel-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"eventType\":\"ANNOUNCEMENT\",\"emailEnabled\":false,\"whatsappEnabled\":true}]"))
                .andExpect(status().isOk());

        ArgumentCaptor<List<NotificationChannelRuleRequest>> cap = ArgumentCaptor.forClass(List.class);
        verify(service).updateRules(eq(7), cap.capture());
        assertThat(cap.getValue()).singleElement().satisfies(r -> {
            assertThat(r.getEventType()).isEqualTo(NotificationEventType.ANNOUNCEMENT);
            assertThat(r.isEmailEnabled()).isFalse();
            assertThat(r.isWhatsappEnabled()).isTrue();
        });
    }

    @Test
    void put_unknownEventType_isRejectedBeforeReachingService() throws Exception {
        mockMvc.perform(put("/colleges/7/notification-channel-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"eventType\":\"NOPE\",\"emailEnabled\":true}]"))
                .andExpect(status().isBadRequest());
        verify(service, never()).updateRules(any(), any());
    }

    @Test
    void put_missingEventType_isRejectedByValidation() throws Exception {
        mockMvc.perform(put("/colleges/7/notification-channel-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"emailEnabled\":true}]"))
                .andExpect(status().isBadRequest());
        verify(service, never()).updateRules(any(), any());
    }

    @Test
    void bothEndpointsRestrictedToAdminRoles() throws Exception {
        for (String name : List.of("getRules", "updateRules")) {
            Method m = java.util.Arrays.stream(NotificationChannelRuleController.class.getDeclaredMethods())
                    .filter(x -> x.getName().equals(name)).findFirst().orElseThrow();
            assertThat(m.getAnnotation(PreAuthorize.class).value())
                    .isEqualTo("hasAnyRole('SUPERADMIN', 'COLLEGEADMIN')");
        }
    }
}
