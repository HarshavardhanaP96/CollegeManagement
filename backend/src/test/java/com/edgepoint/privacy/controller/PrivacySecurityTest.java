package com.edgepoint.privacy.controller;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;
import com.edgepoint.privacy.domain.RetentionRun;
import com.edgepoint.privacy.service.ConsentService;
import com.edgepoint.privacy.service.DataRequestService;
import com.edgepoint.privacy.service.PrivacyAuditService;
import com.edgepoint.privacy.service.RetentionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves the @PreAuthorize rules. The services are mocked, so only role handling and request mapping
 * are exercised. MockMvc does not apply the /api/v1 context path.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PrivacySecurityTest {

    @Autowired MockMvc mvc;
    @MockBean ConsentService consentService;
    @MockBean DataRequestService requestService;
    @MockBean RetentionService retentionService;
    @MockBean PrivacyAuditService auditService;

    static DataRequest aRequest() {
        DataRequest r = new DataRequest();
        r.setRequestId(1); r.setUserId(5); r.setType(RequestType.ACCESS); r.setStatus(RequestStatus.SUBMITTED);
        r.setSubmittedAt(LocalDateTime.now()); r.setDueAt(LocalDateTime.now().plusDays(30));
        return r;
    }

    @Test
    void anonymousCallersAreRejected() throws Exception {
        mvc.perform(get("/privacy/notice/current")).andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(roles = "HOD")
    void anyAuthenticatedUserMayReadTheNotice() throws Exception {
        mvc.perform(get("/privacy/notice/current")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"STUDENT"})
    void aStudentMayRaiseARequest() throws Exception {
        when(requestService.submit(any(), any(), any())).thenReturn(aRequest());
        mvc.perform(post("/privacy/requests").contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"ACCESS\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    void aTeacherMayListTheirRequests() throws Exception {
        mvc.perform(get("/privacy/requests/me")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = {"COLLEGEADMIN", "HOD", "SUPERADMIN"})
    void adminsAndHodsAreNotDataPrincipalsInThisRelease() throws Exception {
        mvc.perform(post("/privacy/requests").contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"ACCESS\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/privacy/requests/me")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void studentsCannotOpenTheAdminQueue() throws Exception {
        mvc.perform(get("/privacy/admin/requests")).andExpect(status().isForbidden());
        mvc.perform(get("/privacy/admin/audit")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "HOD")
    void hodHasNoPrivacyAdminAccess() throws Exception {
        mvc.perform(get("/privacy/admin/requests")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COLLEGEADMIN")
    void aCollegeAdminCanReadTheQueueAndResolve() throws Exception {
        when(requestService.queue(any(), any(), anyBoolean(), any())).thenReturn(Page.empty());
        when(requestService.resolve(any(), any(), any())).thenReturn(aRequest());
        mvc.perform(get("/privacy/admin/requests")).andExpect(status().isOk());
        mvc.perform(post("/privacy/admin/requests/1/resolve").contentType(MediaType.APPLICATION_JSON)
                .content("{\"outcome\":\"COMPLETED\",\"note\":\"done\"}")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "SUPERADMIN")
    void aSuperAdminMayReadButNotChange() throws Exception {
        when(requestService.queue(any(), any(), anyBoolean(), any())).thenReturn(Page.empty());
        mvc.perform(get("/privacy/admin/requests?collegeId=3")).andExpect(status().isOk());
        mvc.perform(post("/privacy/admin/requests/1/resolve").contentType(MediaType.APPLICATION_JSON)
                .content("{\"outcome\":\"COMPLETED\",\"note\":\"done\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/privacy/admin/requests/1/review")).andExpect(status().isForbidden());
        mvc.perform(post("/privacy/admin/retention/run")).andExpect(status().isForbidden());
        mvc.perform(post("/privacy/admin/notices").contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COLLEGEADMIN")
    void retentionRunDefaultsToDryRun() throws Exception {
        RetentionRun run = new RetentionRun();
        run.setRunId(1); run.setDryRun(true);
        when(retentionService.runNow(true)).thenReturn(run);
        mvc.perform(post("/privacy/admin/retention/run")).andExpect(status().isOk());
        org.mockito.Mockito.verify(retentionService).runNow(true);
    }

    @Test
    @WithMockUser(roles = "COLLEGEADMIN")
    void invalidBodiesAreRejectedBeforeReachingTheService() throws Exception {
        mvc.perform(post("/privacy/admin/requests/1/resolve").contentType(MediaType.APPLICATION_JSON)
                .content("{\"outcome\":\"COMPLETED\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/privacy/admin/notices").contentType(MediaType.APPLICATION_JSON).content("{\"body\":\" \"}"))
                .andExpect(status().isBadRequest());
    }
}
