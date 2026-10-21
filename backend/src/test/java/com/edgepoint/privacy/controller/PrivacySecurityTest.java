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

import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
        // the app has no custom entry point, so Spring Security's default answers 403 for anonymous callers
        mvc.perform(get("/privacy/notice/current")).andExpect(status().isForbidden());
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

    // ------------------------------------------------------------------ access matrix
    // The services are mocks returning stubbed values, so a missing @PreAuthorize would answer 200, not 403.

    static final String JSON = MediaType.APPLICATION_JSON_VALUE;
    static final String ROLE_BODY_CONSENT = "{\"purposeId\":2,\"status\":\"GRANTED\"}";
    static final String POLICY_BODY = "[{\"dataCategory\":\"ACCOUNT_RECORDS\",\"retentionDays\":1825,"
            + "\"triggerEvent\":\"ACCOUNT_DEACTIVATED\",\"action\":\"ANONYMISE\",\"enabled\":false}]";

    void stubHappyPaths() {
        when(requestService.cancel(any())).thenReturn(aRequest());
        when(requestService.review(any())).thenReturn(aRequest());
        when(requestService.resolve(any(), any(), any())).thenReturn(aRequest());
        when(requestService.queue(any(), any(), anyBoolean(), any())).thenReturn(Page.empty());
        when(requestService.exportFor(any())).thenReturn("{\"account\":{}}");
        when(retentionService.runNow(anyBoolean())).thenReturn(new RetentionRun());
    }

    int statusOf(String role, MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.with(user("tester").roles(role))).andReturn().getResponse().getStatus();
    }

    void assertAll(int expected, List<String> roles, List<MockHttpServletRequestBuilder> requests) throws Exception {
        stubHappyPaths();
        for (String role : roles) {
            for (MockHttpServletRequestBuilder request : requests) {
                MvcResult result = mvc.perform(request.with(user("tester").roles(role))).andReturn();
                String label = role + " " + result.getRequest().getMethod() + " " + result.getRequest().getRequestURI();
                int actual = result.getResponse().getStatus();
                if (expected == 200) {
                    assertThat(actual).as(label).isBetween(200, 201);
                } else {
                    assertThat(actual).as(label).isEqualTo(expected);
                }
            }
        }
    }

    List<MockHttpServletRequestBuilder> principalEndpoints() {
        return List.of(get("/privacy/requests/1"), post("/privacy/requests/1/cancel"), get("/privacy/requests/1/export"));
    }

    List<MockHttpServletRequestBuilder> adminReads() {
        return List.of(get("/privacy/admin/requests?collegeId=3"), get("/privacy/admin/requests/1?collegeId=3"),
                get("/privacy/admin/notices?collegeId=3"), get("/privacy/admin/retention-policies?collegeId=3"),
                get("/privacy/admin/retention/runs?collegeId=3"), get("/privacy/admin/audit?collegeId=3"));
    }

    List<MockHttpServletRequestBuilder> adminWrites() {
        return List.of(post("/privacy/admin/requests/1/review"),
                post("/privacy/admin/requests/1/resolve").contentType(JSON).content("{\"outcome\":\"COMPLETED\",\"note\":\"done\"}"),
                post("/privacy/admin/notices").contentType(JSON).content("{\"body\":\"x\"}"),
                put("/privacy/admin/retention-policies").contentType(JSON).content(POLICY_BODY),
                post("/privacy/admin/retention/run?dryRun=false"));
    }

    @Test
    void studentsAndTeachersMayUseThePrincipalEndpoints() throws Exception {
        assertAll(200, List.of("STUDENT", "TEACHER"), principalEndpoints());
    }

    @Test
    void nobodyElseMayUseThePrincipalEndpoints() throws Exception {
        assertAll(403, List.of("COLLEGEADMIN", "HOD", "SUPERADMIN"), principalEndpoints());
    }

    @Test
    void exportIsAnAttachmentOfJson() throws Exception {
        stubHappyPaths();
        for (String role : List.of("STUDENT", "TEACHER")) {
            mvc.perform(get("/privacy/requests/1/export").with(user("tester").roles(role)))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("attachment")))
                    .andExpect(header().string("Content-Type", org.hamcrest.Matchers.startsWith(JSON)))
                    .andExpect(header().string("Cache-Control", "no-store"))
                    .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        }
    }

    @Test
    void overLongFreeTextIsRejectedWith400() throws Exception {
        stubHappyPaths();
        String tooLong = "x".repeat(4001);
        mvc.perform(post("/privacy/requests").contentType(JSON)
                        .content("{\"type\":\"GRIEVANCE\",\"details\":\"" + tooLong + "\"}")
                        .with(user("tester").roles("STUDENT")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/privacy/admin/requests/1/resolve").contentType(JSON)
                        .content("{\"outcome\":\"COMPLETED\",\"note\":\"" + tooLong + "\"}")
                        .with(user("tester").roles("COLLEGEADMIN")))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/privacy/admin/notices").contentType(JSON)
                        .content("{\"body\":\"" + "x".repeat(20001) + "\"}")
                        .with(user("tester").roles("COLLEGEADMIN")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void textAtTheLimitIsAccepted() throws Exception {
        stubHappyPaths();
        mvc.perform(post("/privacy/admin/requests/1/resolve").contentType(JSON)
                        .content("{\"outcome\":\"COMPLETED\",\"note\":\"" + "x".repeat(4000) + "\"}")
                        .with(user("tester").roles("COLLEGEADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void anyAuthenticatedRoleMayRecordConsent() throws Exception {
        for (String role : List.of("STUDENT", "TEACHER", "HOD", "COLLEGEADMIN", "SUPERADMIN")) {
            assertThat(statusOf(role, post("/privacy/consents").contentType(JSON).content(ROLE_BODY_CONSENT)))
                    .as(role).isEqualTo(200);
        }
    }

    @Test
    void aCollegeAdminMayReadAndWriteTheAdminEndpoints() throws Exception {
        assertAll(200, List.of("COLLEGEADMIN"), adminReads());
        assertAll(200, List.of("COLLEGEADMIN"), adminWrites());
    }

    @Test
    void aSuperAdminMayReadEveryAdminEndpoint() throws Exception {
        assertAll(200, List.of("SUPERADMIN"), adminReads());
    }

    @Test
    void aSuperAdminCannotWriteAnyAdminEndpoint() throws Exception {
        assertAll(403, List.of("SUPERADMIN"), adminWrites());
    }

    @Test
    void aHodHasNoAdminAccessAtAll() throws Exception {
        assertAll(403, List.of("HOD"), adminReads());
        assertAll(403, List.of("HOD"), adminWrites());
    }

    @Test
    void studentsAndTeachersCannotReachAnyAdminEndpoint() throws Exception {
        assertAll(403, List.of("STUDENT", "TEACHER"), adminReads());
        assertAll(403, List.of("STUDENT", "TEACHER"), adminWrites());
    }

    @Test
    void retentionRunWithDryRunFalseReachesTheServiceAsFalse() throws Exception {
        stubHappyPaths();
        mvc.perform(post("/privacy/admin/retention/run?dryRun=false").with(user("tester").roles("COLLEGEADMIN")))
                .andExpect(status().isOk());
        verify(retentionService).runNow(false);
    }

    @Test
    void aSuperAdminNamesTheCollegeForRequestDetail() throws Exception {
        mvc.perform(get("/privacy/admin/requests/1?collegeId=3").with(user("tester").roles("SUPERADMIN")))
                .andExpect(status().isOk());
        verify(requestService).detailAdmin(1, 3);
    }
}
