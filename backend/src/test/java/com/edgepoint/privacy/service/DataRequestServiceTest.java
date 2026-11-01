package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.config.PrivacyProperties;
import com.edgepoint.privacy.contributor.PersonalDataContributor;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.DataRequestDetail;
import com.edgepoint.privacy.repository.DataRequestEventRepository;
import com.edgepoint.privacy.repository.DataRequestRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataRequestServiceTest {

    static final int COLLEGE = 7;
    static final int STUDENT = 42;
    static final int ADMIN = 99;

    @Mock DataRequestRepository requests;
    @Mock DataRequestEventRepository events;
    @Mock PersonalDataContributor account;
    @Mock PersonalDataContributor student;
    @Mock ErasureService erasure;
    @Mock PrivacyAuditService audit;
    @Mock PrivacyTenant tenant;
    @Mock UserRepository users;

    PrivacyProperties properties = new PrivacyProperties();
    ObjectMapper mapper = new ObjectMapper();
    DataRequestService service;

    @BeforeEach
    void setUp() {
        service = new DataRequestService(requests, events, List.of(account, student), erasure, audit, tenant, properties, mapper, users);
        when(tenant.collegeId()).thenReturn(COLLEGE);
        when(tenant.userId()).thenReturn(STUDENT);
        when(account.appliesTo(STUDENT)).thenReturn(true);
        when(student.appliesTo(STUDENT)).thenReturn(true);
        when(account.section()).thenReturn("account");
        when(account.correctableFields()).thenReturn(Set.of("fullName", "phone"));
        when(account.export(STUDENT)).thenReturn(Map.of("fullName", "Asha Rao"));
        when(student.section()).thenReturn("student");
        when(student.correctableFields()).thenReturn(Set.of("address"));
        when(student.export(STUDENT)).thenReturn(Map.of());
        when(requests.save(any())).thenAnswer(i -> {
            DataRequest r = i.getArgument(0);
            if (r.getRequestId() == null) r.setRequestId(11);
            return r;
        });
    }

    DataRequest existing(int ownerId, RequestType type, RequestStatus status) {
        DataRequest r = new DataRequest();
        r.setRequestId(11); r.setCollegeId(COLLEGE); r.setUserId(ownerId); r.setType(type); r.setStatus(status);
        r.setSubmittedAt(LocalDateTime.now().minusDays(2)); r.setDueAt(LocalDateTime.now().plusDays(28));
        when(requests.findByRequestIdAndCollegeId(11, COLLEGE)).thenReturn(Optional.of(r));
        when(requests.findForUpdate(11, COLLEGE)).thenReturn(Optional.of(r));
        return r;
    }

    void actAsAdmin() {
        when(tenant.userId()).thenReturn(ADMIN);
    }

    // ---------- submit ----------

    @Test
    void submitCreatesAnOpenRequestDueAfterTheConfiguredDays() {
        LocalDateTime before = LocalDateTime.now();

        DataRequest saved = service.submit(RequestType.ACCESS, "give me my data", null);

        assertThat(saved.getCollegeId()).isEqualTo(COLLEGE);
        assertThat(saved.getUserId()).isEqualTo(STUDENT);
        assertThat(saved.getStatus()).isEqualTo(RequestStatus.SUBMITTED);
        assertThat(saved.getDueAt()).isBetween(before.plusDays(30), LocalDateTime.now().plusDays(30));
        ArgumentCaptor<DataRequestEvent> event = ArgumentCaptor.forClass(DataRequestEvent.class);
        verify(events).save(event.capture());
        assertThat(event.getValue().getToStatus()).isEqualTo(RequestStatus.SUBMITTED);
        assertThat(event.getValue().getFromStatus()).isNull();
        verify(audit).record(COLLEGE, STUDENT, STUDENT, "REQUEST_SUBMITTED", "type=ACCESS, requestId=11");
    }

    @Test
    void responseDaysComeFromProperties() {
        properties.setResponseDays(10);
        DataRequest saved = service.submit(RequestType.ACCESS, null, null);
        assertThat(saved.getDueAt()).isBefore(LocalDateTime.now().plusDays(11));
    }

    @Test
    void correctionStoresThePayloadAsJson() throws Exception {
        DataRequest saved = service.submit(RequestType.CORRECTION, null, Map.of("phone", "8888888888"));
        JsonNode json = mapper.readTree(saved.getCorrectionPayload());
        assertThat(json.get("phone").asText()).isEqualTo("8888888888");
    }

    @Test
    void correctionCannotTargetProtectedFields() {
        for (String field : List.of("email", "username", "roleId", "collegeId", "passwordHash", "rollNumber")) {
            assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, Map.of(field, "x")))
                    .as(field)
                    .isInstanceOf(BusinessRuleViolationException.class);
        }
        verify(requests, never()).save(any());
    }

    @Test
    void correctionNeedsAFieldAndANonBlankValue() {
        assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, null))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, Map.of()))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, Map.of("phone", "  ")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void grievanceNeedsADescription() {
        assertThatThrownBy(() -> service.submit(RequestType.GRIEVANCE, "  ", null))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThat(service.submit(RequestType.GRIEVANCE, "My marks leaked", null).getDetails()).isEqualTo("My marks leaked");
    }

    @Test
    void aSecondOpenErasureRequestIsRefused() {
        when(requests.existsByUserIdAndTypeAndStatusIn(STUDENT, RequestType.ERASURE, RequestStatus.OPEN)).thenReturn(true);
        assertThatThrownBy(() -> service.submit(RequestType.ERASURE, null, null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("already");
        verify(requests, never()).save(any());
    }

    // ---------- cancel / detail / ownership ----------

    @Test
    void ownerCanCancelWhileSubmitted() {
        existing(STUDENT, RequestType.ACCESS, RequestStatus.SUBMITTED);
        DataRequest cancelled = service.cancel(11);
        assertThat(cancelled.getStatus()).isEqualTo(RequestStatus.CANCELLED);
        assertThat(cancelled.getResolvedAt()).isNotNull();
        verify(audit).record(COLLEGE, STUDENT, STUDENT, "REQUEST_CANCELLED", "requestId=11");
    }

    @Test
    void cannotCancelOnceInReview() {
        existing(STUDENT, RequestType.ACCESS, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.cancel(11)).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void someoneElsesRequestLooksNonexistent() {
        existing(555, RequestType.ACCESS, RequestStatus.SUBMITTED);
        assertThatThrownBy(() -> service.cancel(11)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.detailMine(11)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.exportFor(11)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void aRequestFromAnotherCollegeLooksNonexistentToTheAdmin() {
        actAsAdmin();
        when(requests.findByRequestIdAndCollegeId(11, COLLEGE)).thenReturn(Optional.empty());
        when(requests.findForUpdate(11, COLLEGE)).thenReturn(Optional.empty());
        when(tenant.collegeId(null)).thenReturn(COLLEGE);
        assertThatThrownBy(() -> service.review(11)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "ok")).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.detailAdmin(11, null)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void adminDetailUsesTheCollegeNamedByASuperAdmin() {
        DataRequest r = existing(STUDENT, RequestType.ACCESS, RequestStatus.SUBMITTED);
        when(tenant.collegeId(3)).thenReturn(COLLEGE);
        when(events.findByRequestIdOrderByEventId(11)).thenReturn(List.of());

        DataRequestDetail detail = service.detailAdmin(11, 3);

        assertThat(detail.request().requestId()).isEqualTo(11);
        verify(requests).findByRequestIdAndCollegeId(11, COLLEGE);
        verify(tenant).collegeId(3);
    }

    @Test
    void detailIncludesTheHistory() {
        DataRequest r = existing(STUDENT, RequestType.ACCESS, RequestStatus.SUBMITTED);
        DataRequestEvent e = new DataRequestEvent();
        e.setRequestId(11); e.setToStatus(RequestStatus.SUBMITTED); e.setOccurredAt(LocalDateTime.now());
        when(events.findByRequestIdOrderByEventId(11)).thenReturn(List.of(e));

        DataRequestDetail detail = service.detailMine(11);

        assertThat(detail.request().requestId()).isEqualTo(11);
        assertThat(detail.events()).hasSize(1);
        assertThat(detail.request().overdue()).isFalse();
        r.setDueAt(LocalDateTime.now().minusDays(1));
        assertThat(service.detailMine(11).request().overdue()).isTrue();
    }

    // ---------- review ----------

    @Test
    void reviewMovesToInReviewAndAssignsTheAdmin() {
        actAsAdmin();
        existing(STUDENT, RequestType.ERASURE, RequestStatus.SUBMITTED);

        DataRequest r = service.review(11);

        assertThat(r.getStatus()).isEqualTo(RequestStatus.IN_REVIEW);
        assertThat(r.getAssignedTo()).isEqualTo(ADMIN);
        verify(audit).record(COLLEGE, ADMIN, STUDENT, "REQUEST_IN_REVIEW", "requestId=11");
    }

    @Test
    void anAdminCannotActOnTheirOwnRequest() {
        when(tenant.userId()).thenReturn(STUDENT);
        existing(STUDENT, RequestType.ERASURE, RequestStatus.SUBMITTED);
        assertThatThrownBy(() -> service.review(11))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("own request");
    }

    @Test
    void cannotReviewTwice() {
        actAsAdmin();
        existing(STUDENT, RequestType.ACCESS, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.review(11)).isInstanceOf(BusinessRuleViolationException.class);
    }

    // ---------- resolve ----------

    @Test
    void resolveNeedsAnInReviewRequestAndANote() {
        actAsAdmin();
        existing(STUDENT, RequestType.GRIEVANCE, RequestStatus.SUBMITTED);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "done"))
                .isInstanceOf(BusinessRuleViolationException.class);

        existing(STUDENT, RequestType.GRIEVANCE, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, " "))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.CANCELLED, "x"))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void partialCompletionIsOnlyForErasure() {
        actAsAdmin();
        existing(STUDENT, RequestType.CORRECTION, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.PARTIALLY_COMPLETED, "some"))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void completingAnErasureAnonymisesAndKeepsTheNoteOffTheAuditTrail() {
        actAsAdmin();
        existing(STUDENT, RequestType.ERASURE, RequestStatus.IN_REVIEW);

        DataRequest r = service.resolve(11, RequestStatus.COMPLETED, "Marks retained for the university");

        verify(erasure).erase(COLLEGE, STUDENT, ADMIN, "requestId=11");
        assertThat(r.getStatus()).isEqualTo(RequestStatus.COMPLETED);
        assertThat(r.getResolutionNote()).isEqualTo("Marks retained for the university");
        assertThat(r.getResolvedAt()).isNotNull();
        verify(audit).record(COLLEGE, ADMIN, STUDENT, "REQUEST_COMPLETED", "requestId=11");
    }

    @Test
    void partiallyCompletingAnErasureAlsoAnonymises() {
        actAsAdmin();
        existing(STUDENT, RequestType.ERASURE, RequestStatus.IN_REVIEW);
        service.resolve(11, RequestStatus.PARTIALLY_COMPLETED, "Exam records retained");
        verify(erasure).erase(COLLEGE, STUDENT, ADMIN, "requestId=11");
    }

    @Test
    void rejectingDoesNotTouchAnyData() {
        actAsAdmin();
        existing(STUDENT, RequestType.ERASURE, RequestStatus.IN_REVIEW);

        DataRequest r = service.resolve(11, RequestStatus.REJECTED, "Identity could not be verified");

        verify(erasure, never()).erase(any(), any(), any(), any());
        verify(account, never()).correct(any(), any());
        assertThat(r.getStatus()).isEqualTo(RequestStatus.REJECTED);
        assertThat(r.getRejectionReason()).isEqualTo("Identity could not be verified");
    }

    @Test
    void completingAnAccessRequestStoresTheExportBundle() throws Exception {
        actAsAdmin();
        existing(STUDENT, RequestType.ACCESS, RequestStatus.IN_REVIEW);
        when(account.export(STUDENT)).thenReturn(Map.of("fullName", "Asha Rao"));

        DataRequest r = service.resolve(11, RequestStatus.COMPLETED, "Sent");

        JsonNode bundle = mapper.readTree(r.getExportPayload());
        assertThat(bundle.get("account").get("fullName").asText()).isEqualTo("Asha Rao");
        assertThat(bundle.has("student")).as("empty sections are left out").isFalse();
        assertThat(bundle.has("generatedAt")).isTrue();
    }

    @Test
    void completingACorrectionAppliesEachFieldToItsOwnContributorOnly() {
        actAsAdmin();
        DataRequest r = existing(STUDENT, RequestType.CORRECTION, RequestStatus.IN_REVIEW);
        r.setCorrectionPayload("{\"phone\":\"8888888888\",\"address\":\"7 New Street\"}");

        service.resolve(11, RequestStatus.COMPLETED, "Updated");

        verify(account).correct(STUDENT, Map.of("phone", "8888888888"));
        verify(student).correct(STUDENT, Map.of("address", "7 New Street"));
        verify(audit).record(eq(COLLEGE), eq(ADMIN), eq(STUDENT), eq("CORRECTION_APPLIED"), any());
    }

    @Test
    void aFailingActionLeavesTheRequestUnresolved() {
        actAsAdmin();
        DataRequest r = existing(STUDENT, RequestType.ERASURE, RequestStatus.IN_REVIEW);
        doThrow(new IllegalStateException("db down")).when(erasure).erase(any(), any(), any(), any());

        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "go")).isInstanceOf(IllegalStateException.class);

        assertThat(r.getStatus()).isEqualTo(RequestStatus.IN_REVIEW);
        verify(requests, never()).save(any());
    }

    // ---------- export download ----------

    @Test
    void theRequesterCanDownloadACompletedAccessExportAndItIsAudited() {
        DataRequest r = existing(STUDENT, RequestType.ACCESS, RequestStatus.COMPLETED);
        r.setExportPayload("{\"account\":{}}");

        assertThat(service.exportFor(11)).isEqualTo("{\"account\":{}}");
        verify(audit).record(COLLEGE, STUDENT, STUDENT, "EXPORT_DOWNLOADED", "requestId=11");
    }

    @Test
    void thereIsNothingToDownloadUnlessAnAccessRequestIsCompleted() {
        existing(STUDENT, RequestType.ACCESS, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.exportFor(11)).isInstanceOf(BusinessRuleViolationException.class);
        existing(STUDENT, RequestType.GRIEVANCE, RequestStatus.COMPLETED);
        assertThatThrownBy(() -> service.exportFor(11)).isInstanceOf(BusinessRuleViolationException.class);
    }

    // ---------- queue ----------

    @Test
    void queueDefaultsToAllRequestsOldestDueFirstInTheResolvedCollege() {
        when(tenant.collegeId(3)).thenReturn(COLLEGE);
        when(requests.findByCollegeId(eq(COLLEGE), any(Pageable.class))).thenReturn(Page.empty());

        service.queue(3, null, false, PageRequest.of(0, 20));

        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(requests).findByCollegeId(eq(COLLEGE), page.capture());
        assertThat(page.getValue().getSort().getOrderFor("dueAt")).isNotNull();
        assertThat(page.getValue().getSort().getOrderFor("dueAt").isAscending()).isTrue();
    }

    @Test
    void queueCanFilterByStatusOrOverdue() {
        when(tenant.collegeId(null)).thenReturn(COLLEGE);
        when(requests.findByCollegeIdAndStatus(eq(COLLEGE), eq(RequestStatus.IN_REVIEW), any())).thenReturn(Page.empty());
        when(requests.findByCollegeIdAndStatusInAndDueAtBefore(eq(COLLEGE), eq(RequestStatus.OPEN), any(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        service.queue(null, RequestStatus.IN_REVIEW, false, PageRequest.of(0, 20));
        service.queue(null, null, true, PageRequest.of(0, 20));

        verify(requests).findByCollegeIdAndStatus(eq(COLLEGE), eq(RequestStatus.IN_REVIEW), any());
        verify(requests).findByCollegeIdAndStatusInAndDueAtBefore(eq(COLLEGE), eq(RequestStatus.OPEN), any(), any());
    }

    @Test
    void mineListsTheCallersRequests() {
        when(requests.findByUserIdOrderBySubmittedAtDesc(STUDENT)).thenReturn(List.of(new DataRequest()));
        assertThat(service.mine()).hasSize(1);
    }

    @Test
    void aFieldOwnedByAContributorThatDoesNotApplyToTheUserIsRejectedAtSubmit() {
        when(student.appliesTo(STUDENT)).thenReturn(false);
        assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, Map.of("address", "7 New Street")))
                .isInstanceOf(BusinessRuleViolationException.class);
        verify(requests, never()).save(any());
    }

    @Test
    void resolveRefusesACorrectionWhoseFieldNoApplicableContributorOwns() {
        actAsAdmin();
        DataRequest r = existing(STUDENT, RequestType.CORRECTION, RequestStatus.IN_REVIEW);
        r.setCorrectionPayload("{\"phone\":\"8888888888\",\"address\":\"7 New Street\"}");
        when(student.appliesTo(STUDENT)).thenReturn(false);

        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "Updated"))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("address");

        assertThat(r.getStatus()).isEqualTo(RequestStatus.IN_REVIEW);
        verify(requests, never()).save(any());
        verify(account, never()).correct(any(), any());
        verify(student, never()).correct(any(), any());
        verify(audit, never()).record(any(), any(), any(), any(), any());
    }

    @Test
    void submitIsRefusedForAnErasedAccount() {
        doThrow(new BusinessRuleViolationException("This account has been erased")).when(tenant).requireActiveUser();

        assertThatThrownBy(() -> service.submit(RequestType.ACCESS, null, null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("erased");
        verify(requests, never()).save(any());
    }

    // ---------- I3: locking lookup ----------

    @Test
    void reviewResolveAndCancelTakeTheRowLockNotThePlainLookup() {
        actAsAdmin();
        existing(STUDENT, RequestType.GRIEVANCE, RequestStatus.SUBMITTED);
        service.review(11);
        existing(STUDENT, RequestType.GRIEVANCE, RequestStatus.IN_REVIEW);
        service.resolve(11, RequestStatus.COMPLETED, "done");
        when(tenant.userId()).thenReturn(STUDENT);
        existing(STUDENT, RequestType.ACCESS, RequestStatus.SUBMITTED);
        service.cancel(11);

        verify(requests, times(3)).findForUpdate(11, COLLEGE);
        verify(requests, never()).findByRequestIdAndCollegeId(any(), any());
    }

    // ---------- I2: erased owners and missing payloads ----------

    @Test
    void aCorrectionWithoutAStoredPayloadResolvesWithoutError() {
        actAsAdmin();
        DataRequest r = existing(STUDENT, RequestType.CORRECTION, RequestStatus.IN_REVIEW);
        r.setCorrectionPayload(null);

        service.resolve(11, RequestStatus.COMPLETED, "nothing to apply");

        verify(account, never()).correct(any(), any());
        assertThat(r.getStatus()).isEqualTo(RequestStatus.COMPLETED);
    }

    @Test
    void correctionAndAccessCannotBeCompletedForAnErasedOwnerButCanBeRejected() {
        actAsAdmin();
        User erased = new User();
        erased.setUserId(STUDENT);
        erased.setAnonymisedAt(LocalDateTime.now());
        when(users.findById(STUDENT)).thenReturn(Optional.of(erased));

        existing(STUDENT, RequestType.CORRECTION, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "ok"))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("erased");
        existing(STUDENT, RequestType.ACCESS, RequestStatus.IN_REVIEW);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "ok"))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("erased");

        existing(STUDENT, RequestType.ACCESS, RequestStatus.IN_REVIEW);
        assertThat(service.resolve(11, RequestStatus.REJECTED, "account erased").getStatus())
                .isEqualTo(RequestStatus.REJECTED);
    }

    // ---------- I5: input caps ----------

    @Test
    void overLongCorrectionValuesAreRejectedAtSubmit() {
        when(student.correctableFields()).thenReturn(Set.of("address", "parentName", "parentPhone", "parentEmail"));
        String[][] cases = {{"phone", "9".repeat(21)}, {"fullName", "n".repeat(256)}, {"address", "a".repeat(2001)},
                {"parentName", "n".repeat(256)}, {"parentPhone", "9".repeat(21)}, {"parentEmail", "e".repeat(256)}};
        for (String[] c : cases) {
            assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, Map.of(c[0], c[1])))
                    .as(c[0]).isInstanceOf(BusinessRuleViolationException.class);
        }
        assertThat(service.submit(RequestType.CORRECTION, null, Map.of("phone", "9".repeat(20))).getCorrectionPayload())
                .isNotNull();
        verify(requests, times(1)).save(any());
    }

    @Test
    void aCorrectionMayNotCarryMoreThanSixFields() {
        Map<String, String> many = new java.util.LinkedHashMap<>();
        for (int i = 0; i < 7; i++) many.put("f" + i, "v");
        assertThatThrownBy(() -> service.submit(RequestType.CORRECTION, null, many))
                .isInstanceOf(BusinessRuleViolationException.class).hasMessageContaining("at most 6");
    }
}
