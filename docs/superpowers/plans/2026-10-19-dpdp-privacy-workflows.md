# DPDP Privacy Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each college consent/notice management, data-principal requests (access, correction, erasure, grievance) with an admin queue, and a scheduled retention job that anonymises expired accounts, with backend and UI.

**Architecture:** A new `com.edgepoint.privacy` package inside the Spring Boot monolith, with its own tables, services, controllers and scheduler. Other modules take part through a `PersonalDataContributor` interface (export / correct / anonymise), which `ErasureService` and `DataRequestService` collect through Spring's `List<PersonalDataContributor>`. The React frontend adds a consent gate, a "My Privacy" page for students and teachers, and a Privacy area for college admins.

**Tech Stack:** Java 17, Spring Boot 3 (Web, Data JPA, Security, Validation), Flyway + PostgreSQL (prod), H2 (dev/test), Lombok, JUnit 5 + Mockito + AssertJ; React 19, TypeScript, TanStack Query, Zustand, Tailwind, Vitest + Testing Library (added by Task 9).

**Spec:** `docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md` (read it first; Task 0 appends the implementation amendments this plan relies on).

## Global Constraints

- **TDD for every task** (user's global rule): write the failing test, run it and see it fail for the right reason, write the minimum code, see it pass, then commit.
- **Tenancy:** every privacy table carries `college_id`; every service query filters by the college from `PrivacyTenant`; a request or record from another college must behave as "not found".
- **Responses** use `com.edgepoint.core.dto.ApiResponse<T>` (`ApiResponse.success(data, message)`); business-rule failures throw `BusinessRuleViolationException` (HTTP 422), missing things throw `ResourceNotFoundException`.
- **Roles** are checked with `@PreAuthorize`, role names `SUPERADMIN`, `COLLEGEADMIN`, `STUDENT`, `TEACHER`. `HOD` gets no privacy-admin access.
- **API base path** is `/api/v1` (server context path), so the endpoints are `/api/v1/privacy/...`; controllers map `/privacy`.
- **Erasure anonymises and keeps academic records.** Marks and attendance stay linked through `user_id` / `roll_number`. Anonymised users get `username = 'erased-<id>'`, `email = 'erased-<id>@invalid.local'`, `full_name = 'Erased User'`, a random `password_hash`, `phone = NULL`, `is_active = false`, `anonymised_at = now`; `student_profiles.parent_phone` becomes `'0000000000'`.
- **Response deadline** `due_at` = submission + `app.privacy.response-days` (default 30; unverified against the DPDP Rules, to be confirmed by counsel).
- **Retention policies ship disabled** (`enabled = false`, 1825 days placeholder) and the scheduler runs in **dry-run** unless `app.privacy.retention-dry-run=false`.
- **Never write PII values into `privacy_audit_log`**; log ids, field names and reasons only.
- **Commits touch only the files named in the task** (`git add <paths>`, never `git add -A`): the main checkout also holds other people's uncommitted work (`audit/`, notification channel rules, a V4 migration, `docs/reviews/`).
- **Commit message trailer:** `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Flyway version:** the privacy migration is `V<N>__privacy_workflows.sql` where `<N>` is the highest version number present in `backend/src/main/resources/db/migration` plus one, computed in Task 1 and re-checked in Task 14. Never reuse a number.
- **Test commands** run from `backend/` as `mvn test -Dtest=<Class>` (use `./mvnw` if the file exists). Frontend commands run from `frontend/` as `npx vitest run <path>`.

## Review Focus

The spec is silent on these inputs; each has a test in the named task.

1. **Correction payload tries to change a protected field** (`email`, `roleId`, `collegeId`, `username`, a blank value) — must be rejected, never applied. (Task 6)
2. **Someone else's request** — cancelling, downloading the export of, or reading a request that belongs to another user or another college must look like "not found". (Task 6)
3. **Double submit / repeat clicks** — a second open erasure request for the same user is refused; granting the same consent twice does not add ledger rows; re-erasing an already-anonymised user changes nothing. (Tasks 3, 5, 6)
4. **Retention must never touch the wrong people** — active users, admins, already-anonymised users and other colleges are never selected; a failure on one user does not stop the batch. (Tasks 1, 7)
5. **SUPERADMIN has no college** — admin reads without a `collegeId` must fail with a clear message instead of leaking all colleges or throwing a `NullPointerException`. (Task 2)

Known limitation (not tested, call it out at handoff): an access token issued before erasure stays valid until it expires, because the JWT filter does not check `is_active`; and the nightly scheduler is not cluster-safe (no ShedLock), so run it on a single replica or keep it in dry-run.

---

### Task 0: Workspace, baseline and spec amendments

**Files:**
- Modify: `docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md` (append section 9)

- [ ] **Step 1: Create an isolated worktree** (use the `superpowers:using-git-worktrees` skill)

```bash
git worktree add ../CollegeManagement-privacy -b feature/dpdp-privacy
cd ../CollegeManagement-privacy
```

Expected: a clean checkout of `main` without the in-flight `audit/` and notification-channel files. Everything below runs inside this worktree.

- [ ] **Step 2: Record the test baseline**

```bash
cd backend && ls mvnw 2>/dev/null; mvn test 2>&1 | tail -40
```

Expected: write down which tests pass and which fail *before* any change (several existing controller/repository test classes are empty stubs). Later tasks must not add new failures. If the Spring context does not start at all in tests (`ProductionApplicationTests` fails), stop and report it, because Task 1 and Task 8 need a working test context.

- [ ] **Step 3: Append the amendments to the spec**

Append this to the end of the spec file:

```markdown
## 9. Implementation amendments (added while writing the plan)

Findings from reading the code that change or sharpen the design above:

1. **H2/dev and tests do not run Flyway.** `application-dev.yml` and `application-test.properties` set `spring.flyway.enabled=false` with `ddl-auto: create-drop`, so entities build the schema there. The SQL migration targets PostgreSQL only and is verified separately (Task 1, Step 8). This supersedes the "must run on H2" sentence in section 3.
2. **Migration number** was renumbered from V5 to V6 because `main` committed `V5__create_audit_log.sql` while this branch was in progress.
3. **`retention_policies.action`** only has `ANONYMISE` in this cut. `DELETE` would break the "keep academic records" decision (D2). **`trigger_event`** only has `ACCOUNT_DEACTIVATED`; the model has no graduation date.
4. **Retention eligibility** = user with role `STUDENT` or `TEACHER`, `is_active = false`, `anonymised_at IS NULL`, and `COALESCE(deleted_at, updated_at, created_at)` older than the policy's `retention_days`. There is no explicit deactivation timestamp today, so this is the best available reference date.
5. **Scheduler dry-run** is a global property `app.privacy.retention-dry-run` (default `true`), not a per-college switch. Policies are per college and ship disabled.
6. **`data_requests.export_payload TEXT`** is added to hold the access bundle; **`data_request_events.occurred_at`** replaces the column called `at`.
7. **Request status `CANCELLED`** is added to the lifecycle (the spec allowed cancelling but listed no status).
8. **Extra endpoints:** `GET /privacy/requests/{id}` (requester's detail with history) and `GET /privacy/admin/requests/{id}` (admin detail), needed by the UI.
9. **PARTIALLY_COMPLETED** is only valid for ERASURE requests and needs a note naming what was retained; every resolve needs a note.
10. **SUPERADMIN** reads admin data for one college by passing `collegeId`; COLLEGEADMIN always gets their own college and any `collegeId` is ignored. Write endpoints are COLLEGEADMIN only.
11. **Frontend tests** need a runner: the repo has none, so Vitest + Testing Library are added as devDependencies (Task 9).
12. The existing generic `audit` package (uncommitted at planning time) is not reused: `privacy_audit_log` needs `subject_user_id` and must not depend on uncommitted code.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md
git commit -m "Spec: record implementation amendments for DPDP privacy workflows

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Schema, entities and repositories

**Files:**
- Create: `backend/src/main/resources/db/migration/V<N>__privacy_workflows.sql`
- Modify: `backend/src/main/java/com/edgepoint/core/domain/User.java` (add `anonymisedAt`)
- Create (package `com.edgepoint.privacy.domain`): `LegalBasis.java`, `ConsentStatus.java`, `RequestType.java`, `RequestStatus.java`, `RetentionAction.java`, `RetentionTrigger.java`, `RetentionRunStatus.java`, `PrivacyPurpose.java`, `PrivacyNotice.java`, `ConsentRecord.java`, `DataRequest.java`, `DataRequestEvent.java`, `RetentionPolicy.java`, `RetentionRun.java`, `PrivacyAuditLog.java`
- Create (package `com.edgepoint.privacy.repository`): `PrivacyPurposeRepository.java`, `PrivacyNoticeRepository.java`, `ConsentRecordRepository.java`, `DataRequestRepository.java`, `DataRequestEventRepository.java`, `RetentionPolicyRepository.java`, `RetentionRunRepository.java`, `PrivacyAuditLogRepository.java`, `RetentionCandidateRepository.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/domain/RequestStatusTest.java`, `backend/src/test/java/com/edgepoint/privacy/repository/PrivacyRepositoryTest.java`

**Interfaces:**
- Produces (used by every later task):
  - `RequestStatus.canTransitionTo(RequestStatus next): boolean`, `RequestStatus.isTerminal(): boolean`
  - `RequestStatus.OPEN` = `List.of(SUBMITTED, IN_REVIEW)`
  - Repositories exactly as listed in Step 6.
  - `User.getAnonymisedAt()/setAnonymisedAt(LocalDateTime)`

- [ ] **Step 1: Write the failing state-machine test**

`backend/src/test/java/com/edgepoint/privacy/domain/RequestStatusTest.java`

```java
package com.edgepoint.privacy.domain;

import org.junit.jupiter.api.Test;

import static com.edgepoint.privacy.domain.RequestStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class RequestStatusTest {

    @Test
    void submittedCanBeReviewedOrCancelledOnly() {
        assertThat(SUBMITTED.canTransitionTo(IN_REVIEW)).isTrue();
        assertThat(SUBMITTED.canTransitionTo(CANCELLED)).isTrue();
        assertThat(SUBMITTED.canTransitionTo(COMPLETED)).isFalse();
        assertThat(SUBMITTED.canTransitionTo(REJECTED)).isFalse();
    }

    @Test
    void inReviewCanBeResolvedButNotCancelled() {
        assertThat(IN_REVIEW.canTransitionTo(COMPLETED)).isTrue();
        assertThat(IN_REVIEW.canTransitionTo(PARTIALLY_COMPLETED)).isTrue();
        assertThat(IN_REVIEW.canTransitionTo(REJECTED)).isTrue();
        assertThat(IN_REVIEW.canTransitionTo(CANCELLED)).isFalse();
        assertThat(IN_REVIEW.canTransitionTo(SUBMITTED)).isFalse();
    }

    @Test
    void terminalStatesGoNowhere() {
        for (RequestStatus terminal : new RequestStatus[]{COMPLETED, PARTIALLY_COMPLETED, REJECTED, CANCELLED}) {
            assertThat(terminal.isTerminal()).isTrue();
            for (RequestStatus next : RequestStatus.values()) {
                assertThat(terminal.canTransitionTo(next)).isFalse();
            }
        }
        assertThat(SUBMITTED.isTerminal()).isFalse();
        assertThat(IN_REVIEW.isTerminal()).isFalse();
    }

    @Test
    void openListHoldsTheTwoNonTerminalStates() {
        assertThat(OPEN).containsExactly(SUBMITTED, IN_REVIEW);
    }
}
```

- [ ] **Step 2: Run it and confirm it fails to compile**

Run: `cd backend && mvn test -Dtest=RequestStatusTest`
Expected: FAIL — `RequestStatus` does not exist.

- [ ] **Step 3: Create the enums**

All in `backend/src/main/java/com/edgepoint/privacy/domain/`, package `com.edgepoint.privacy.domain`.

`LegalBasis.java`
```java
package com.edgepoint.privacy.domain;

public enum LegalBasis { CONSENT, LEGITIMATE_USE }
```

`ConsentStatus.java`
```java
package com.edgepoint.privacy.domain;

public enum ConsentStatus { GRANTED, WITHDRAWN }
```

`RequestType.java`
```java
package com.edgepoint.privacy.domain;

public enum RequestType { ACCESS, CORRECTION, ERASURE, GRIEVANCE }
```

`RetentionAction.java`
```java
package com.edgepoint.privacy.domain;

/** Only ANONYMISE: academic records are kept (spec decision D2), so there is no hard-delete action. */
public enum RetentionAction { ANONYMISE }
```

`RetentionTrigger.java`
```java
package com.edgepoint.privacy.domain;

public enum RetentionTrigger { ACCOUNT_DEACTIVATED }
```

`RetentionRunStatus.java`
```java
package com.edgepoint.privacy.domain;

public enum RetentionRunStatus { RUNNING, COMPLETED, FAILED }
```

`RequestStatus.java`
```java
package com.edgepoint.privacy.domain;

import java.util.List;

public enum RequestStatus {
    SUBMITTED, IN_REVIEW, COMPLETED, PARTIALLY_COMPLETED, REJECTED, CANCELLED;

    /** Statuses in which a request is still being worked on. */
    public static final List<RequestStatus> OPEN = List.of(SUBMITTED, IN_REVIEW);

    public boolean canTransitionTo(RequestStatus next) {
        return switch (this) {
            case SUBMITTED -> next == IN_REVIEW || next == CANCELLED;
            case IN_REVIEW -> next == COMPLETED || next == PARTIALLY_COMPLETED || next == REJECTED;
            default -> false;
        };
    }

    public boolean isTerminal() {
        return !OPEN.contains(this);
    }
}
```

- [ ] **Step 4: Run the state-machine test**

Run: `cd backend && mvn test -Dtest=RequestStatusTest`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing repository test**

`backend/src/test/java/com/edgepoint/privacy/repository/PrivacyRepositoryTest.java`

```java
package com.edgepoint.privacy.repository;

import com.edgepoint.core.domain.College;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.domain.UserRole;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.repository.UserRoleRepository;
import com.edgepoint.privacy.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PrivacyRepositoryTest {

    @Autowired CollegeRepository colleges;
    @Autowired UserRoleRepository roles;
    @Autowired UserRepository users;
    @Autowired ConsentRecordRepository consents;
    @Autowired DataRequestRepository requests;
    @Autowired PrivacyNoticeRepository notices;
    @Autowired RetentionCandidateRepository candidates;

    Integer collegeA;
    Integer collegeB;

    @BeforeEach
    void setUp() {
        collegeA = savedCollege("A").getCollegeId();
        collegeB = savedCollege("B").getCollegeId();
        for (Object[] r : new Object[][]{{91, "STUDENT"}, {92, "TEACHER"}, {93, "COLLEGEADMIN"}}) {
            UserRole role = new UserRole();
            role.setRoleId((Integer) r[0]);
            role.setRoleName((String) r[1] + "_T");
            roles.save(role);
        }
    }

    College savedCollege(String code) {
        College c = new College();
        c.setCollegeName("College " + code);
        c.setCollegeCode("PRIV-" + code);
        return colleges.save(c);
    }

    User savedUser(String name, Integer college, Integer roleId, boolean active, LocalDateTime deletedAt, LocalDateTime anonymisedAt) {
        User u = new User();
        u.setCollegeId(college);
        u.setRoleId(roleId);
        u.setUsername(name);
        u.setEmail(name + "@example.test");
        u.setPasswordHash("x");
        u.setFullName(name);
        u.setIsActive(active);
        u.setDeletedAt(deletedAt);
        u.setIsDeleted(deletedAt != null);
        u.setAnonymisedAt(anonymisedAt);
        return users.save(u);
    }

    @Test
    void latestConsentIsTheMostRecentLedgerRow() {
        ConsentRecord granted = new ConsentRecord();
        granted.setCollegeId(collegeA); granted.setUserId(5); granted.setPurposeId(1);
        granted.setNoticeId(1); granted.setStatus(ConsentStatus.GRANTED);
        consents.save(granted);
        ConsentRecord withdrawn = new ConsentRecord();
        withdrawn.setCollegeId(collegeA); withdrawn.setUserId(5); withdrawn.setPurposeId(1);
        withdrawn.setNoticeId(1); withdrawn.setStatus(ConsentStatus.WITHDRAWN);
        consents.save(withdrawn);

        assertThat(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(5, 1))
                .get().extracting(ConsentRecord::getStatus).isEqualTo(ConsentStatus.WITHDRAWN);
        assertThat(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(5, 2)).isEmpty();
    }

    @Test
    void latestNoticeIsTheHighestVersionForThatCollegeOnly() {
        for (int v = 1; v <= 3; v++) {
            PrivacyNotice n = new PrivacyNotice();
            n.setCollegeId(collegeA); n.setVersion(v); n.setBody("v" + v);
            notices.save(n);
        }
        PrivacyNotice other = new PrivacyNotice();
        other.setCollegeId(collegeB); other.setVersion(9); other.setBody("other");
        notices.save(other);

        assertThat(notices.findFirstByCollegeIdOrderByVersionDesc(collegeA)).get()
                .extracting(PrivacyNotice::getVersion).isEqualTo(3);
    }

    @Test
    void requestsAreScopedToTheirCollege() {
        DataRequest r = new DataRequest();
        r.setCollegeId(collegeA); r.setUserId(5); r.setType(RequestType.ACCESS);
        r.setStatus(RequestStatus.SUBMITTED);
        r.setSubmittedAt(LocalDateTime.now()); r.setDueAt(LocalDateTime.now().plusDays(30));
        DataRequest saved = requests.save(r);

        assertThat(requests.findByRequestIdAndCollegeId(saved.getRequestId(), collegeA)).isPresent();
        assertThat(requests.findByRequestIdAndCollegeId(saved.getRequestId(), collegeB)).isEmpty();
        assertThat(requests.existsByUserIdAndTypeAndStatusIn(5, RequestType.ACCESS, RequestStatus.OPEN)).isTrue();
        assertThat(requests.existsByUserIdAndTypeAndStatusIn(5, RequestType.ERASURE, RequestStatus.OPEN)).isFalse();
    }

    @Test
    void overdueQueryReturnsOnlyOpenPastDueRequests() {
        DataRequest overdue = request(5, RequestStatus.SUBMITTED, LocalDateTime.now().minusDays(1));
        request(6, RequestStatus.SUBMITTED, LocalDateTime.now().plusDays(10));
        request(7, RequestStatus.COMPLETED, LocalDateTime.now().minusDays(5));

        var page = requests.findByCollegeIdAndStatusInAndDueAtBefore(
                collegeA, RequestStatus.OPEN, LocalDateTime.now(), PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(DataRequest::getRequestId).containsExactly(overdue.getRequestId());
    }

    DataRequest request(int userId, RequestStatus status, LocalDateTime due) {
        DataRequest r = new DataRequest();
        r.setCollegeId(collegeA); r.setUserId(userId); r.setType(RequestType.GRIEVANCE);
        r.setStatus(status); r.setSubmittedAt(LocalDateTime.now().minusDays(40)); r.setDueAt(due);
        return requests.save(r);
    }

    @Test
    void retentionCandidatesAreOnlyExpiredInactiveNonAnonymisedStudentsAndTeachersOfThatCollege() {
        LocalDateTime longAgo = LocalDateTime.now().minusYears(2);
        User expiredStudent = savedUser("expired_student", collegeA, 91, false, longAgo, null);
        User expiredTeacher = savedUser("expired_teacher", collegeA, 92, false, longAgo, null);
        savedUser("recent_inactive", collegeA, 91, false, null, null);       // not old enough
        savedUser("still_active", collegeA, 91, true, longAgo, null);        // active
        savedUser("already_anonymised", collegeA, 91, false, longAgo, LocalDateTime.now()); // done
        savedUser("old_admin", collegeA, 93, false, longAgo, null);          // wrong role
        savedUser("other_college", collegeB, 91, false, longAgo, null);      // other college

        List<User> found = candidates.findExpiredInactive(
                collegeA, LocalDateTime.now().minusDays(365), List.of("STUDENT_T", "TEACHER_T"));

        assertThat(found).extracting(User::getUserId)
                .containsExactlyInAnyOrder(expiredStudent.getUserId(), expiredTeacher.getUserId());
    }
}
```

> Note: the test roles are named `STUDENT_T` / `TEACHER_T` / `COLLEGEADMIN_T` so they cannot clash with roles seeded elsewhere; production code passes the real names `STUDENT` and `TEACHER` (Task 7).

- [ ] **Step 6: Add `anonymisedAt` to `User`, then create entities and repositories**

Edit `backend/src/main/java/com/edgepoint/core/domain/User.java`: add the import `java.time.LocalDateTime` and this field after `isActive`:

```java
    @Column(name = "anonymised_at")
    private LocalDateTime anonymisedAt;
```

Entities in `backend/src/main/java/com/edgepoint/privacy/domain/`:

`PrivacyPurpose.java`
```java
package com.edgepoint.privacy.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "privacy_purposes",
        uniqueConstraints = @UniqueConstraint(name = "uq_privacy_purposes_college_code", columnNames = {"college_id", "code"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class PrivacyPurpose extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purpose_id")
    private Integer purposeId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false, length = 20)
    private LegalBasis legalBasis;

    @Column(name = "withdrawable", nullable = false)
    private boolean withdrawable = true;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
```

`PrivacyNotice.java`
```java
package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Immutable once published: a new text is a new version row. */
@Entity
@Table(name = "privacy_notices",
        uniqueConstraints = @UniqueConstraint(name = "uq_privacy_notices_college_version", columnNames = {"college_id", "version"}))
@Data
@NoArgsConstructor
public class PrivacyNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notice_id")
    private Integer noticeId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "published_by")
    private Integer publishedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (effectiveFrom == null) effectiveFrom = createdAt;
    }
}
```

`ConsentRecord.java`
```java
package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Append-only ledger row. The current state per (user, purpose) is the row with the highest id. */
@Entity
@Table(name = "consent_records")
@Data
@NoArgsConstructor
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "consent_id")
    private Integer consentId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "purpose_id", nullable = false)
    private Integer purposeId;

    @Column(name = "notice_id", nullable = false)
    private Integer noticeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ConsentStatus status;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @PrePersist
    void prePersist() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }
}
```

`DataRequest.java`
```java
package com.edgepoint.privacy.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_requests")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class DataRequest extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private RequestType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private RequestStatus status;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    /** JSON object {field: newValue}; only for CORRECTION. */
    @Column(name = "correction_payload", columnDefinition = "TEXT")
    private String correctionPayload;

    /** JSON bundle built when an ACCESS request is completed. */
    @Column(name = "export_payload", columnDefinition = "TEXT")
    private String exportPayload;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "due_at", nullable = false)
    private LocalDateTime dueAt;

    @Column(name = "assigned_to")
    private Integer assignedTo;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
```

`DataRequestEvent.java`
```java
package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "data_request_events")
@Data
@NoArgsConstructor
public class DataRequestEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Integer eventId;

    @Column(name = "request_id", nullable = false)
    private Integer requestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private RequestStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private RequestStatus toStatus;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    void prePersist() {
        if (occurredAt == null) occurredAt = LocalDateTime.now();
    }
}
```

`RetentionPolicy.java`
```java
package com.edgepoint.privacy.domain;

import com.edgepoint.core.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "retention_policies",
        uniqueConstraints = @UniqueConstraint(name = "uq_retention_policies_college_category", columnNames = {"college_id", "data_category"}))
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class RetentionPolicy extends AuditableEntity {

    public static final String ACCOUNT_RECORDS = "ACCOUNT_RECORDS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "policy_id")
    private Integer policyId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "data_category", nullable = false, length = 50)
    private String dataCategory;

    @Column(name = "retention_days", nullable = false)
    private int retentionDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_event", nullable = false, length = 30)
    private RetentionTrigger triggerEvent = RetentionTrigger.ACCOUNT_DEACTIVATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private RetentionAction action = RetentionAction.ANONYMISE;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = false;
}
```

`RetentionRun.java`
```java
package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "retention_runs")
@Data
@NoArgsConstructor
public class RetentionRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "run_id")
    private Integer runId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "dry_run", nullable = false)
    private boolean dryRun;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RetentionRunStatus status = RetentionRunStatus.RUNNING;

    @Column(name = "records_processed", nullable = false)
    private int recordsProcessed;

    @Column(name = "records_failed", nullable = false)
    private int recordsFailed;
}
```

`PrivacyAuditLog.java`
```java
package com.edgepoint.privacy.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Append-only. Never store PII values here; ids, field names and reasons only. */
@Entity
@Table(name = "privacy_audit_log")
@Data
@NoArgsConstructor
public class PrivacyAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "college_id", nullable = false)
    private Integer collegeId;

    @Column(name = "actor_id")
    private Integer actorId;

    @Column(name = "subject_user_id")
    private Integer subjectUserId;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
```

Repositories in `backend/src/main/java/com/edgepoint/privacy/repository/` (package `com.edgepoint.privacy.repository`):

`PrivacyPurposeRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.PrivacyPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrivacyPurposeRepository extends JpaRepository<PrivacyPurpose, Integer> {
    List<PrivacyPurpose> findByCollegeIdAndActiveTrueOrderByPurposeId(Integer collegeId);
    Optional<PrivacyPurpose> findByPurposeIdAndCollegeId(Integer purposeId, Integer collegeId);
    long countByCollegeId(Integer collegeId);
}
```

`PrivacyNoticeRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.PrivacyNotice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PrivacyNoticeRepository extends JpaRepository<PrivacyNotice, Integer> {
    Optional<PrivacyNotice> findFirstByCollegeIdOrderByVersionDesc(Integer collegeId);
    List<PrivacyNotice> findByCollegeIdOrderByVersionDesc(Integer collegeId);
}
```

`ConsentRecordRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Integer> {
    Optional<ConsentRecord> findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(Integer userId, Integer purposeId);
}
```

`DataRequestRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DataRequestRepository extends JpaRepository<DataRequest, Integer> {
    Optional<DataRequest> findByRequestIdAndCollegeId(Integer requestId, Integer collegeId);
    List<DataRequest> findByUserIdOrderBySubmittedAtDesc(Integer userId);
    boolean existsByUserIdAndTypeAndStatusIn(Integer userId, RequestType type, Collection<RequestStatus> statuses);
    Page<DataRequest> findByCollegeId(Integer collegeId, Pageable pageable);
    Page<DataRequest> findByCollegeIdAndStatus(Integer collegeId, RequestStatus status, Pageable pageable);
    Page<DataRequest> findByCollegeIdAndStatusInAndDueAtBefore(Integer collegeId, Collection<RequestStatus> statuses,
                                                               LocalDateTime before, Pageable pageable);
}
```

`DataRequestEventRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.DataRequestEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DataRequestEventRepository extends JpaRepository<DataRequestEvent, Integer> {
    List<DataRequestEvent> findByRequestIdOrderByEventId(Integer requestId);
}
```

`RetentionPolicyRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.RetentionPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RetentionPolicyRepository extends JpaRepository<RetentionPolicy, Integer> {
    List<RetentionPolicy> findByCollegeId(Integer collegeId);
    List<RetentionPolicy> findByCollegeIdAndEnabledTrue(Integer collegeId);
    Optional<RetentionPolicy> findByCollegeIdAndDataCategory(Integer collegeId, String dataCategory);
}
```

`RetentionRunRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.RetentionRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RetentionRunRepository extends JpaRepository<RetentionRun, Integer> {
    Page<RetentionRun> findByCollegeIdOrderByRunIdDesc(Integer collegeId, Pageable pageable);
}
```

`PrivacyAuditLogRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.privacy.domain.PrivacyAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrivacyAuditLogRepository extends JpaRepository<PrivacyAuditLog, Long> {
    Page<PrivacyAuditLog> findByCollegeIdOrderByAuditIdDesc(Integer collegeId, Pageable pageable);
}
```

`RetentionCandidateRepository.java`
```java
package com.edgepoint.privacy.repository;

import com.edgepoint.core.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/** Read-only view over users used by the retention job; kept out of UserRepository to leave core untouched. */
public interface RetentionCandidateRepository extends JpaRepository<User, Integer> {

    @Query("SELECT u FROM User u WHERE u.collegeId = :collegeId AND u.isActive = false " +
            "AND u.anonymisedAt IS NULL AND u.role.roleName IN :roleNames " +
            "AND COALESCE(u.deletedAt, u.updatedAt, u.createdAt) < :cutoff")
    List<User> findExpiredInactive(@Param("collegeId") Integer collegeId,
                                   @Param("cutoff") LocalDateTime cutoff,
                                   @Param("roleNames") List<String> roleNames);
}
```

- [ ] **Step 7: Run both test classes**

Run: `cd backend && mvn test -Dtest='RequestStatusTest,PrivacyRepositoryTest'`
Expected: PASS (4 + 5 tests). If `PrivacyRepositoryTest` fails to start the context, compare with the Task 0 baseline before debugging. `UserRoleRepository` lives in `com.edgepoint.core.repository`; if the compiler cannot find it there, fix the import from the file's actual package.

- [ ] **Step 8: Write the PostgreSQL migration and verify it**

Compute `<N>`:

```bash
N=$(( $(ls backend/src/main/resources/db/migration | sed -E 's/^V([0-9]+)__.*/\1/' | sort -n | tail -1) + 1 )); echo $N
```

Create `backend/src/main/resources/db/migration/V${N}__privacy_workflows.sql` (substitute the computed number in the file name):

```sql
-- DPDP privacy workflows: consent, data-principal requests, retention.
-- Mirrors the JPA entities in com.edgepoint.privacy.domain (Hibernate runs with ddl-auto: validate in prod).
-- PostgreSQL only; dev/test build the schema from the entities instead (see docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md section 9).

ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS privacy_purposes (
    purpose_id   SERIAL PRIMARY KEY,
    college_id   INTEGER      NOT NULL REFERENCES colleges(college_id),
    code         VARCHAR(50)  NOT NULL,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    legal_basis  VARCHAR(20)  NOT NULL,
    withdrawable BOOLEAN      NOT NULL DEFAULT TRUE,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP,

    CONSTRAINT uq_privacy_purposes_college_code UNIQUE (college_id, code)
);

CREATE TABLE IF NOT EXISTS privacy_notices (
    notice_id      SERIAL PRIMARY KEY,
    college_id     INTEGER   NOT NULL REFERENCES colleges(college_id),
    version        INTEGER   NOT NULL,
    body           TEXT      NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    published_by   INTEGER,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_privacy_notices_college_version UNIQUE (college_id, version)
);

CREATE TABLE IF NOT EXISTS consent_records (
    consent_id  SERIAL PRIMARY KEY,
    college_id  INTEGER     NOT NULL REFERENCES colleges(college_id),
    user_id     INTEGER     NOT NULL REFERENCES users(user_id),
    purpose_id  INTEGER     NOT NULL REFERENCES privacy_purposes(purpose_id),
    notice_id   INTEGER     NOT NULL REFERENCES privacy_notices(notice_id),
    status      VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_ip   VARCHAR(45)
);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_purpose ON consent_records(user_id, purpose_id, consent_id DESC);

CREATE TABLE IF NOT EXISTS data_requests (
    request_id         SERIAL PRIMARY KEY,
    college_id         INTEGER     NOT NULL REFERENCES colleges(college_id),
    user_id            INTEGER     NOT NULL REFERENCES users(user_id),
    type               VARCHAR(20) NOT NULL,
    status             VARCHAR(30) NOT NULL,
    details            TEXT,
    correction_payload TEXT,
    export_payload     TEXT,
    submitted_at       TIMESTAMP   NOT NULL,
    due_at             TIMESTAMP   NOT NULL,
    assigned_to        INTEGER,
    resolution_note    TEXT,
    rejection_reason   TEXT,
    resolved_at        TIMESTAMP,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_data_requests_college_status_due ON data_requests(college_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id);

CREATE TABLE IF NOT EXISTS data_request_events (
    event_id    SERIAL PRIMARY KEY,
    request_id  INTEGER     NOT NULL REFERENCES data_requests(request_id),
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    actor_id    INTEGER,
    note        TEXT,
    occurred_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_data_request_events_request ON data_request_events(request_id);

CREATE TABLE IF NOT EXISTS retention_policies (
    policy_id      SERIAL PRIMARY KEY,
    college_id     INTEGER     NOT NULL REFERENCES colleges(college_id),
    data_category  VARCHAR(50) NOT NULL,
    retention_days INTEGER     NOT NULL,
    trigger_event  VARCHAR(30) NOT NULL,
    action         VARCHAR(20) NOT NULL,
    enabled        BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP,

    CONSTRAINT uq_retention_policies_college_category UNIQUE (college_id, data_category)
);

CREATE TABLE IF NOT EXISTS retention_runs (
    run_id            SERIAL PRIMARY KEY,
    college_id        INTEGER     NOT NULL REFERENCES colleges(college_id),
    dry_run           BOOLEAN     NOT NULL,
    started_at        TIMESTAMP   NOT NULL,
    finished_at       TIMESTAMP,
    status            VARCHAR(20) NOT NULL,
    records_processed INTEGER     NOT NULL DEFAULT 0,
    records_failed    INTEGER     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_retention_runs_college ON retention_runs(college_id, run_id DESC);

CREATE TABLE IF NOT EXISTS privacy_audit_log (
    audit_id        BIGSERIAL PRIMARY KEY,
    college_id      INTEGER      NOT NULL REFERENCES colleges(college_id),
    actor_id        INTEGER,
    subject_user_id INTEGER,
    action          VARCHAR(100) NOT NULL,
    details         TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_college ON privacy_audit_log(college_id, audit_id DESC);
```

Verify against real PostgreSQL (the tests cannot, they run on H2): follow `docs/devsetup.md` to start the local Postgres with the repo's `docker/postgres/init-db.sql`, start the backend with the default (non-`dev`) profile, and confirm in the log that Flyway applied `V<N>` and that Hibernate `ddl-auto: validate` did not complain about the new tables. Expected: the app starts. If Docker/Postgres is unavailable, say so explicitly in the task report instead of claiming the migration is verified.

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy backend/src/main/java/com/edgepoint/core/domain/User.java \
  backend/src/main/resources/db/migration/V*__privacy_workflows.sql \
  backend/src/test/java/com/edgepoint/privacy
git commit -m "Add privacy schema, entities and repositories

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Foundation services (tenant, properties, audit)

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/config/PrivacyProperties.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/service/PrivacyTenant.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/service/PrivacyAuditService.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/service/PrivacyTenantTest.java`, `backend/src/test/java/com/edgepoint/privacy/service/PrivacyAuditServiceTest.java`

**Interfaces:**
- Consumes: `TenantContext#getCollegeId()`, `TenantContext#getCurrentUserId()` (existing); `PrivacyAuditLogRepository` (Task 1).
- Produces:
  - `PrivacyProperties` — `getResponseDays(): int` (default 30), `isRetentionDryRun(): boolean` (default true).
  - `PrivacyTenant` — `Integer collegeId()` (own college or `BusinessRuleViolationException`), `Integer collegeId(Integer requested)` (own college wins; else `requested`; else exception), `Integer userId()` (current user or exception).
  - `PrivacyAuditService` — constructor `(PrivacyAuditLogRepository repository, PrivacyTenant tenant)`; `void record(Integer collegeId, Integer actorId, Integer subjectUserId, String action, String details)`; `Page<PrivacyAuditLog> search(Integer collegeParam, Pageable pageable)`.

- [ ] **Step 1: Write the failing tests**

`backend/src/test/java/com/edgepoint/privacy/service/PrivacyTenantTest.java`

```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.security.TenantContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrivacyTenantTest {

    @Mock TenantContext context;

    @Test
    void collegeAdminAlwaysGetsOwnCollegeEvenIfAnotherIsRequested() {
        when(context.getCollegeId()).thenReturn(7);
        assertThat(new PrivacyTenant(context).collegeId(99)).isEqualTo(7);
        assertThat(new PrivacyTenant(context).collegeId()).isEqualTo(7);
    }

    @Test
    void superadminWithoutCollegeMustSayWhichCollege() {
        when(context.getCollegeId()).thenReturn(null);
        PrivacyTenant tenant = new PrivacyTenant(context);

        assertThat(tenant.collegeId(5)).isEqualTo(5);
        assertThatThrownBy(() -> tenant.collegeId(null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("collegeId");
        assertThatThrownBy(tenant::collegeId).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void userIdIsRequired() {
        when(context.getCurrentUserId()).thenReturn(null);
        assertThatThrownBy(() -> new PrivacyTenant(context).userId())
                .isInstanceOf(BusinessRuleViolationException.class);
        when(context.getCurrentUserId()).thenReturn(42);
        assertThat(new PrivacyTenant(context).userId()).isEqualTo(42);
    }
}
```

`backend/src/test/java/com/edgepoint/privacy/service/PrivacyAuditServiceTest.java`

```java
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
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd backend && mvn test -Dtest='PrivacyTenantTest,PrivacyAuditServiceTest'`
Expected: FAIL — classes do not exist.

- [ ] **Step 3: Implement**

`backend/src/main/java/com/edgepoint/privacy/config/PrivacyProperties.java`
```java
package com.edgepoint.privacy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.privacy")
public class PrivacyProperties {
    /** Days a college has to respond to a data-principal request. Unverified against the DPDP Rules. */
    private int responseDays = 30;
    /** When true the nightly retention job only counts; set false to let it anonymise. */
    private boolean retentionDryRun = true;
}
```

`backend/src/main/java/com/edgepoint/privacy/service/PrivacyTenant.java`
```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Resolves the acting college and user. A college-bound caller can never reach another college. */
@Component
@RequiredArgsConstructor
public class PrivacyTenant {

    private final TenantContext context;

    public Integer collegeId() {
        return collegeId(null);
    }

    public Integer collegeId(Integer requested) {
        Integer own = context.getCollegeId();
        if (own != null) {
            return own;
        }
        if (requested != null) {
            return requested;
        }
        throw new BusinessRuleViolationException("collegeId is required for users that do not belong to a college");
    }

    public Integer userId() {
        Integer id = context.getCurrentUserId();
        if (id == null) {
            throw new BusinessRuleViolationException("No authenticated user in context");
        }
        return id;
    }
}
```

`backend/src/main/java/com/edgepoint/privacy/service/PrivacyAuditService.java`
```java
package com.edgepoint.privacy.service;

import com.edgepoint.privacy.domain.PrivacyAuditLog;
import com.edgepoint.privacy.repository.PrivacyAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PrivacyAuditService {

    private final PrivacyAuditLogRepository repository;
    private final PrivacyTenant tenant;

    /** Joins the caller's transaction so the audit row and the action commit or roll back together. */
    @Transactional
    public void record(Integer collegeId, Integer actorId, Integer subjectUserId, String action, String details) {
        PrivacyAuditLog row = new PrivacyAuditLog();
        row.setCollegeId(collegeId);
        row.setActorId(actorId);
        row.setSubjectUserId(subjectUserId);
        row.setAction(action);
        row.setDetails(details);
        repository.save(row);
    }

    @Transactional(readOnly = true)
    public Page<PrivacyAuditLog> search(Integer collegeParam, Pageable pageable) {
        return repository.findByCollegeIdOrderByAuditIdDesc(tenant.collegeId(collegeParam), pageable);
    }
}
```

- [ ] **Step 4: Run the tests**

Run: `cd backend && mvn test -Dtest='PrivacyTenantTest,PrivacyAuditServiceTest'`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/config backend/src/main/java/com/edgepoint/privacy/service \
  backend/src/test/java/com/edgepoint/privacy/service
git commit -m "Add privacy tenant resolver, properties and audit service

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Personal-data contributors

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/contributor/PersonalDataContributor.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/contributor/UserDataContributor.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/contributor/StudentDataContributor.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/contributor/TeacherDataContributor.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/contributor/UserDataContributorTest.java`, `StudentDataContributorTest.java`, `TeacherDataContributorTest.java`

**Interfaces:**
- Consumes: `UserRepository` (`JpaRepository<User,Integer>`), `StudentProfileRepository` (`JpaRepository<StudentProfile,Integer>`, id = `studentUserId`), `TeacherProfileRepository` (`JpaRepository<TeacherProfile,Integer>`, id = `teacherUserId`), `User#anonymisedAt` (Task 1).
- Produces (used by Tasks 4 and 6):
  ```java
  public interface PersonalDataContributor {
      String section();                                   // key of this module's block in the export bundle
      Map<String, Object> export(Integer userId);         // empty map when the module holds nothing for the user
      Set<String> correctableFields();                    // the only field names correct() may be given
      void correct(Integer userId, Map<String, String> fields);   // fields ⊆ correctableFields(), values non-blank
      void anonymise(Integer userId);                     // idempotent
  }
  ```
  Correctable fields: `UserDataContributor` → `fullName`, `phone`; `StudentDataContributor` → `parentName`, `parentPhone`, `parentEmail`, `address`; `TeacherDataContributor` → none. Sections: `account`, `student`, `teacher`.

- [ ] **Step 1: Write the failing tests**

`backend/src/test/java/com/edgepoint/privacy/contributor/UserDataContributorTest.java`

```java
package com.edgepoint.privacy.contributor;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserDataContributorTest {

    @Mock UserRepository users;
    UserDataContributor contributor;
    User user;

    @BeforeEach
    void setUp() {
        contributor = new UserDataContributor(users);
        user = new User();
        user.setUserId(42);
        user.setUsername("asha");
        user.setEmail("asha@college.test");
        user.setFullName("Asha Rao");
        user.setPhone("9999999999");
        user.setPasswordHash("hash");
        user.setIsActive(true);
        when(users.findById(42)).thenReturn(Optional.of(user));
        when(users.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void exportContainsTheAccountFields() {
        Map<String, Object> data = contributor.export(42);
        assertThat(contributor.section()).isEqualTo("account");
        assertThat(data).containsEntry("fullName", "Asha Rao")
                .containsEntry("email", "asha@college.test")
                .containsEntry("username", "asha")
                .containsEntry("phone", "9999999999")
                .doesNotContainKey("passwordHash");
    }

    @Test
    void onlyNameAndPhoneAreCorrectable() {
        assertThat(contributor.correctableFields()).containsExactlyInAnyOrder("fullName", "phone");
    }

    @Test
    void correctUpdatesTheGivenFieldsOnly() {
        contributor.correct(42, Map.of("phone", "8888888888"));
        assertThat(user.getPhone()).isEqualTo("8888888888");
        assertThat(user.getFullName()).isEqualTo("Asha Rao");
        verify(users).save(user);
    }

    @Test
    void correctRejectsBlankValues() {
        assertThatThrownBy(() -> contributor.correct(42, Map.of("fullName", "  ")))
                .isInstanceOf(BusinessRuleViolationException.class);
        verify(users, never()).save(any());
    }

    @Test
    void correctRejectsAFieldThatIsNotCorrectable() {
        assertThatThrownBy(() -> contributor.correct(42, Map.of("email", "evil@x.test")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void anonymiseReplacesIdentifiersAndDisablesTheAccount() {
        contributor.anonymise(42);

        assertThat(user.getUsername()).isEqualTo("erased-42");
        assertThat(user.getEmail()).isEqualTo("erased-42@invalid.local");
        assertThat(user.getFullName()).isEqualTo("Erased User");
        assertThat(user.getPhone()).isNull();
        assertThat(user.getIsActive()).isFalse();
        assertThat(user.getPasswordHash()).isNotEqualTo("hash").startsWith("!");
        assertThat(user.getAnonymisedAt()).isNotNull();
    }

    @Test
    void anonymiseTwiceChangesNothingSecondTime() {
        user.setAnonymisedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        user.setFullName("Erased User");

        contributor.anonymise(42);

        verify(users, never()).save(any());
        assertThat(user.getAnonymisedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @Test
    void unknownUserIsNotFound() {
        when(users.findById(7)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> contributor.anonymise(7)).isInstanceOf(ResourceNotFoundException.class);
    }
}
```

`backend/src/test/java/com/edgepoint/privacy/contributor/StudentDataContributorTest.java`

```java
package com.edgepoint.privacy.contributor;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StudentDataContributorTest {

    @Mock StudentProfileRepository profiles;
    StudentDataContributor contributor;
    StudentProfile profile;

    @BeforeEach
    void setUp() {
        contributor = new StudentDataContributor(profiles);
        profile = new StudentProfile();
        profile.setStudentUserId(42);
        profile.setRollNumber("R-100");
        profile.setAdmissionYear(2024);
        profile.setCurrentSemester(3);
        profile.setParentName("Ravi Rao");
        profile.setParentPhone("9000000000");
        profile.setParentEmail("ravi@home.test");
        profile.setDateOfBirth(LocalDate.of(2005, 4, 2));
        profile.setAddress("12 Lake Road");
        when(profiles.findById(42)).thenReturn(Optional.of(profile));
        when(profiles.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void exportListsTheProfileFields() {
        Map<String, Object> data = contributor.export(42);
        assertThat(contributor.section()).isEqualTo("student");
        assertThat(data).containsEntry("rollNumber", "R-100")
                .containsEntry("parentName", "Ravi Rao")
                .containsEntry("dateOfBirth", "2005-04-02")
                .containsEntry("address", "12 Lake Road");
    }

    @Test
    void exportIsEmptyWhenTheUserHasNoStudentProfile() {
        when(profiles.findById(7)).thenReturn(Optional.empty());
        assertThat(contributor.export(7)).isEmpty();
    }

    @Test
    void correctableFieldsAreTheContactFieldsOnly() {
        assertThat(contributor.correctableFields())
                .containsExactlyInAnyOrder("parentName", "parentPhone", "parentEmail", "address");
    }

    @Test
    void correctUpdatesAddress() {
        contributor.correct(42, Map.of("address", "7 New Street"));
        assertThat(profile.getAddress()).isEqualTo("7 New Street");
        verify(profiles).save(profile);
    }

    @Test
    void parentPhoneCannotBeBlankBecauseTheColumnIsMandatory() {
        assertThatThrownBy(() -> contributor.correct(42, Map.of("parentPhone", "")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void anonymiseClearsPersonalFieldsButKeepsTheRollNumber() {
        contributor.anonymise(42);

        assertThat(profile.getDateOfBirth()).isNull();
        assertThat(profile.getAddress()).isNull();
        assertThat(profile.getParentName()).isNull();
        assertThat(profile.getParentEmail()).isNull();
        assertThat(profile.getParentPhone()).isEqualTo("0000000000");
        assertThat(profile.getRollNumber()).isEqualTo("R-100");
    }

    @Test
    void anonymiseWithoutAProfileDoesNothing() {
        when(profiles.findById(7)).thenReturn(Optional.empty());
        contributor.anonymise(7);
        verify(profiles, never()).save(any());
    }
}
```

`backend/src/test/java/com/edgepoint/privacy/contributor/TeacherDataContributorTest.java`

```java
package com.edgepoint.privacy.contributor;

import com.edgepoint.teacher.domain.TeacherProfile;
import com.edgepoint.teacher.repository.TeacherProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherDataContributorTest {

    @Mock TeacherProfileRepository profiles;

    @Test
    void exportListsTheProfileFields() {
        TeacherProfile p = new TeacherProfile();
        p.setTeacherUserId(5);
        p.setEmployeeId("E-9");
        p.setHireDate(LocalDate.of(2020, 6, 1));
        p.setSpecialization("Physics");
        p.setQualification("PhD");
        when(profiles.findById(5)).thenReturn(Optional.of(p));
        TeacherDataContributor contributor = new TeacherDataContributor(profiles);

        Map<String, Object> data = contributor.export(5);

        assertThat(contributor.section()).isEqualTo("teacher");
        assertThat(data).containsEntry("employeeId", "E-9").containsEntry("hireDate", "2020-06-01")
                .containsEntry("specialization", "Physics").containsEntry("qualification", "PhD");
    }

    @Test
    void exportIsEmptyWithoutAProfile() {
        when(profiles.findById(7)).thenReturn(Optional.empty());
        assertThat(new TeacherDataContributor(profiles).export(7)).isEmpty();
    }

    @Test
    void nothingIsCorrectableOrAnonymisedBecauseTheProfileHoldsNoDirectIdentifiers() {
        TeacherDataContributor contributor = new TeacherDataContributor(profiles);
        assertThat(contributor.correctableFields()).isEmpty();

        contributor.anonymise(5);

        verify(profiles, never()).save(any());
    }
}
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd backend && mvn test -Dtest='UserDataContributorTest,StudentDataContributorTest,TeacherDataContributorTest'`
Expected: FAIL — contributor classes do not exist.

- [ ] **Step 3: Implement**

`PersonalDataContributor.java`
```java
package com.edgepoint.privacy.contributor;

import java.util.Map;
import java.util.Set;

/**
 * A module's hook into the privacy workflows. Implement it as a Spring bean and the module's data
 * is automatically included in access exports, corrections and erasure.
 */
public interface PersonalDataContributor {

    /** Key of this module's block in the export bundle. */
    String section();

    /** The user's data held by this module; an empty map when there is none. Never include secrets. */
    Map<String, Object> export(Integer userId);

    /** The only field names {@link #correct} accepts. */
    Set<String> correctableFields();

    /** Apply a correction; callers pass only keys from {@link #correctableFields()}. */
    void correct(Integer userId, Map<String, String> fields);

    /** Remove direct identifiers while keeping the record. Must be safe to call twice. */
    void anonymise(Integer userId);
}
```

`UserDataContributor.java`
```java
package com.edgepoint.privacy.contributor;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserDataContributor implements PersonalDataContributor {

    private final UserRepository users;

    @Override
    public String section() {
        return "account";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        User u = load(userId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fullName", u.getFullName());
        data.put("email", u.getEmail());
        data.put("username", u.getUsername());
        data.put("phone", u.getPhone());
        data.put("createdAt", String.valueOf(u.getCreatedAt()));
        return data;
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of("fullName", "phone");
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        User u = load(userId);
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String value = e.getValue();
            if (!correctableFields().contains(e.getKey())) {
                throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
            if (value == null || value.isBlank()) {
                throw new BusinessRuleViolationException("Value is required for " + e.getKey());
            }
            switch (e.getKey()) {
                case "fullName" -> u.setFullName(value.trim());
                case "phone" -> u.setPhone(value.trim());
                default -> throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
        }
        users.save(u);
    }

    @Override
    public void anonymise(Integer userId) {
        User u = load(userId);
        if (u.getAnonymisedAt() != null) {
            return;
        }
        u.setUsername("erased-" + userId);
        u.setEmail("erased-" + userId + "@invalid.local");
        u.setFullName("Erased User");
        u.setPhone(null);
        u.setIsActive(false);
        u.setPasswordHash("!" + UUID.randomUUID());
        u.setAnonymisedAt(LocalDateTime.now());
        users.save(u);
    }

    private User load(Integer userId) {
        return users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
```

`StudentDataContributor.java`
```java
package com.edgepoint.privacy.contributor;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class StudentDataContributor implements PersonalDataContributor {

    /** parent_phone is NOT NULL, so anonymisation stores this fixed placeholder. */
    static final String PHONE_PLACEHOLDER = "0000000000";

    private final StudentProfileRepository profiles;

    @Override
    public String section() {
        return "student";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        Map<String, Object> data = new LinkedHashMap<>();
        profiles.findById(userId).ifPresent(p -> {
            data.put("rollNumber", p.getRollNumber());
            data.put("admissionYear", p.getAdmissionYear());
            data.put("currentSemester", p.getCurrentSemester());
            data.put("parentName", p.getParentName());
            data.put("parentPhone", p.getParentPhone());
            data.put("parentEmail", p.getParentEmail());
            data.put("dateOfBirth", p.getDateOfBirth() == null ? null : p.getDateOfBirth().toString());
            data.put("address", p.getAddress());
        });
        return data;
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of("parentName", "parentPhone", "parentEmail", "address");
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        Optional<StudentProfile> found = profiles.findById(userId);
        if (found.isEmpty()) {
            return;
        }
        StudentProfile p = found.get();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String value = e.getValue();
            if (value == null || value.isBlank()) {
                throw new BusinessRuleViolationException("Value is required for " + e.getKey());
            }
            switch (e.getKey()) {
                case "parentName" -> p.setParentName(value.trim());
                case "parentPhone" -> p.setParentPhone(value.trim());
                case "parentEmail" -> p.setParentEmail(value.trim());
                case "address" -> p.setAddress(value.trim());
                default -> throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
        }
        profiles.save(p);
    }

    @Override
    public void anonymise(Integer userId) {
        profiles.findById(userId).ifPresent(p -> {
            p.setDateOfBirth(null);
            p.setAddress(null);
            p.setParentName(null);
            p.setParentEmail(null);
            p.setParentPhone(PHONE_PLACEHOLDER);
            profiles.save(p);
        });
    }
}
```

`TeacherDataContributor.java`
```java
package com.edgepoint.privacy.contributor;

import com.edgepoint.teacher.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TeacherDataContributor implements PersonalDataContributor {

    private final TeacherProfileRepository profiles;

    @Override
    public String section() {
        return "teacher";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        Map<String, Object> data = new LinkedHashMap<>();
        profiles.findById(userId).ifPresent(p -> {
            data.put("employeeId", p.getEmployeeId());
            data.put("hireDate", p.getHireDate() == null ? null : p.getHireDate().toString());
            data.put("specialization", p.getSpecialization());
            data.put("qualification", p.getQualification());
        });
        return data;
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of();
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        // Nothing in the teacher profile is self-correctable; name and phone live on the account.
    }

    @Override
    public void anonymise(Integer userId) {
        // employee_id is the pseudonymous record key and the other columns are not direct identifiers,
        // so nothing is cleared here; the account contributor removes the name, email and phone.
    }
}
```

- [ ] **Step 4: Run the tests**

Run: `cd backend && mvn test -Dtest='UserDataContributorTest,StudentDataContributorTest,TeacherDataContributorTest'`
Expected: PASS (8 + 7 + 3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/contributor backend/src/test/java/com/edgepoint/privacy/contributor
git commit -m "Add personal-data contributors for account, student and teacher

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: ErasureService

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/service/ErasureService.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/service/ErasureServiceTest.java`

**Interfaces:**
- Consumes: `List<PersonalDataContributor>`, `PrivacyAuditService#record(...)` (Tasks 2, 3).
- Produces: `ErasureService(List<PersonalDataContributor> contributors, PrivacyAuditService audit)`; `void erase(Integer collegeId, Integer userId, Integer actorId, String reason)` — `@Transactional`, anonymises through every contributor then writes audit action `ERASURE_EXECUTED`; the reason string is stored as the audit details (callers must not put PII in it).

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/com/edgepoint/privacy/service/ErasureServiceTest.java`

```java
package com.edgepoint.privacy.service;

import com.edgepoint.privacy.contributor.PersonalDataContributor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ErasureServiceTest {

    @Mock PersonalDataContributor first;
    @Mock PersonalDataContributor second;
    @Mock PrivacyAuditService audit;

    @Test
    void anonymisesThroughEveryContributorThenAudits() {
        new ErasureService(List.of(first, second), audit).erase(7, 42, 99, "Request 3");

        InOrder order = inOrder(first, second, audit);
        order.verify(first).anonymise(42);
        order.verify(second).anonymise(42);
        order.verify(audit).record(7, 99, 42, "ERASURE_EXECUTED", "Request 3");
    }

    @Test
    void aFailingContributorStopsTheErasureAndNothingIsAudited() {
        doThrow(new IllegalStateException("db down")).when(second).anonymise(42);

        assertThatThrownBy(() -> new ErasureService(List.of(first, second), audit).erase(7, 42, 99, "Request 3"))
                .isInstanceOf(IllegalStateException.class);

        verify(audit, never()).record(anyInt(), any(), anyInt(), anyString(), anyString());
    }

    @Test
    void actorMayBeNullForSystemRuns() {
        new ErasureService(List.of(first), audit).erase(7, 42, null, "Retention policy ACCOUNT_RECORDS");

        verify(audit).record(7, null, 42, "ERASURE_EXECUTED", "Retention policy ACCOUNT_RECORDS");
    }
}
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd backend && mvn test -Dtest=ErasureServiceTest`
Expected: FAIL — `ErasureService` does not exist.

- [ ] **Step 3: Implement**

```java
package com.edgepoint.privacy.service;

import com.edgepoint.privacy.contributor.PersonalDataContributor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Anonymises a user across every module in one transaction; academic records stay, linked by user id. */
@Service
@RequiredArgsConstructor
public class ErasureService {

    private final List<PersonalDataContributor> contributors;
    private final PrivacyAuditService audit;

    @Transactional
    public void erase(Integer collegeId, Integer userId, Integer actorId, String reason) {
        for (PersonalDataContributor contributor : contributors) {
            contributor.anonymise(userId);
        }
        audit.record(collegeId, actorId, userId, "ERASURE_EXECUTED", reason);
    }
}
```

- [ ] **Step 4: Run the test**

Run: `cd backend && mvn test -Dtest=ErasureServiceTest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/service/ErasureService.java backend/src/test/java/com/edgepoint/privacy/service/ErasureServiceTest.java
git commit -m "Add ErasureService

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Consent and notice service

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/dto/PurposeView.java`, `NoticeView.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/service/ConsentService.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/service/ConsentServiceTest.java`

**Interfaces:**
- Consumes: `PrivacyPurposeRepository`, `PrivacyNoticeRepository`, `ConsentRecordRepository`, `PrivacyAuditService`, `PrivacyTenant` (Tasks 1, 2).
- Produces:
  ```java
  public record PurposeView(Integer purposeId, String code, String name, String description,
                            LegalBasis legalBasis, boolean withdrawable,
                            ConsentStatus status, LocalDateTime recordedAt) {}   // status/recordedAt null = never answered
  public record NoticeView(Integer noticeId, Integer version, String body, LocalDateTime effectiveFrom,
                           boolean requiresAction, List<PurposeView> purposes) {} // noticeId null when nothing is published

  ConsentService(PrivacyPurposeRepository purposes, PrivacyNoticeRepository notices,
                 ConsentRecordRepository consents, PrivacyAuditService audit, PrivacyTenant tenant)
  NoticeView currentNotice()                                   // for the current user/college; seeds default purposes lazily
  List<PurposeView> myConsents()
  PurposeView recordConsent(Integer purposeId, ConsentStatus status, String sourceIp)
  PrivacyNotice publishNotice(String body)                     // next version number
  List<PrivacyNotice> listNotices(Integer collegeParam)
  ```
  Default purposes seeded per college when it has none: `ACADEMIC_RECORDS` (`LEGITIMATE_USE`, not withdrawable), `EMAIL_SMS_COMMS` (`CONSENT`), `PARENT_NOTIFICATIONS` (`CONSENT`).

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/com/edgepoint/privacy/service/ConsentServiceTest.java`

```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.NoticeView;
import com.edgepoint.privacy.dto.PurposeView;
import com.edgepoint.privacy.repository.ConsentRecordRepository;
import com.edgepoint.privacy.repository.PrivacyNoticeRepository;
import com.edgepoint.privacy.repository.PrivacyPurposeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ConsentServiceTest {

    static final int COLLEGE = 7;
    static final int USER = 42;

    @Mock PrivacyPurposeRepository purposes;
    @Mock PrivacyNoticeRepository notices;
    @Mock ConsentRecordRepository consents;
    @Mock PrivacyAuditService audit;
    @Mock PrivacyTenant tenant;

    ConsentService service;
    PrivacyPurpose academic;
    PrivacyPurpose comms;
    PrivacyNotice notice;

    @BeforeEach
    void setUp() {
        service = new ConsentService(purposes, notices, consents, audit, tenant);
        when(tenant.collegeId()).thenReturn(COLLEGE);
        when(tenant.userId()).thenReturn(USER);
        academic = purpose(1, "ACADEMIC_RECORDS", LegalBasis.LEGITIMATE_USE, false);
        comms = purpose(2, "EMAIL_SMS_COMMS", LegalBasis.CONSENT, true);
        notice = new PrivacyNotice();
        notice.setNoticeId(10); notice.setCollegeId(COLLEGE); notice.setVersion(2); notice.setBody("Notice v2");
        when(purposes.countByCollegeId(COLLEGE)).thenReturn(2L);
        when(purposes.findByCollegeIdAndActiveTrueOrderByPurposeId(COLLEGE)).thenReturn(List.of(academic, comms));
        when(purposes.findByPurposeIdAndCollegeId(1, COLLEGE)).thenReturn(Optional.of(academic));
        when(purposes.findByPurposeIdAndCollegeId(2, COLLEGE)).thenReturn(Optional.of(comms));
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.of(notice));
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(anyInt(), anyInt())).thenReturn(Optional.empty());
        when(consents.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    PrivacyPurpose purpose(int id, String code, LegalBasis basis, boolean withdrawable) {
        PrivacyPurpose p = new PrivacyPurpose();
        p.setPurposeId(id); p.setCollegeId(COLLEGE); p.setCode(code); p.setName(code);
        p.setLegalBasis(basis); p.setWithdrawable(withdrawable); p.setActive(true);
        return p;
    }

    ConsentRecord record(int purposeId, int noticeId, ConsentStatus status) {
        ConsentRecord r = new ConsentRecord();
        r.setConsentId(1); r.setUserId(USER); r.setPurposeId(purposeId); r.setNoticeId(noticeId); r.setStatus(status);
        return r;
    }

    @Test
    void defaultPurposesAreSeededWhenTheCollegeHasNone() {
        when(purposes.countByCollegeId(COLLEGE)).thenReturn(0L);

        service.currentNotice();

        ArgumentCaptor<PrivacyPurpose> saved = ArgumentCaptor.forClass(PrivacyPurpose.class);
        verify(purposes, times(3)).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(PrivacyPurpose::getCode)
                .containsExactly("ACADEMIC_RECORDS", "EMAIL_SMS_COMMS", "PARENT_NOTIFICATIONS");
        assertThat(saved.getAllValues().get(0).isWithdrawable()).isFalse();
        assertThat(saved.getAllValues().get(0).getLegalBasis()).isEqualTo(LegalBasis.LEGITIMATE_USE);
        assertThat(saved.getAllValues().get(1).getLegalBasis()).isEqualTo(LegalBasis.CONSENT);
    }

    @Test
    void noPublishedNoticeMeansNoActionIsRequired() {
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.empty());

        NoticeView view = service.currentNotice();

        assertThat(view.noticeId()).isNull();
        assertThat(view.requiresAction()).isFalse();
        assertThat(view.purposes()).hasSize(2);
    }

    @Test
    void actionIsRequiredUntilTheUserAnswersEveryConsentPurposeUnderTheCurrentNotice() {
        assertThat(service.currentNotice().requiresAction()).isTrue();

        // answered under the previous notice version only -> still required
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 9, ConsentStatus.GRANTED)));
        assertThat(service.currentNotice().requiresAction()).isTrue();

        // answered under the current notice -> done, even when the answer is "withdrawn"
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 10, ConsentStatus.WITHDRAWN)));
        NoticeView done = service.currentNotice();
        assertThat(done.requiresAction()).isFalse();
        assertThat(done.noticeId()).isEqualTo(10);
        assertThat(done.version()).isEqualTo(2);
        assertThat(done.body()).isEqualTo("Notice v2");
    }

    @Test
    void myConsentsShowsTheLatestStatusPerPurpose() {
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 10, ConsentStatus.GRANTED)));

        List<PurposeView> views = service.myConsents();

        assertThat(views).extracting(PurposeView::code).containsExactly("ACADEMIC_RECORDS", "EMAIL_SMS_COMMS");
        assertThat(views.get(0).status()).isNull();
        assertThat(views.get(1).status()).isEqualTo(ConsentStatus.GRANTED);
    }

    @Test
    void grantingAppendsALedgerRowTiedToTheCurrentNotice() {
        PurposeView view = service.recordConsent(2, ConsentStatus.GRANTED, "10.0.0.5");

        ArgumentCaptor<ConsentRecord> saved = ArgumentCaptor.forClass(ConsentRecord.class);
        verify(consents).save(saved.capture());
        ConsentRecord row = saved.getValue();
        assertThat(row.getCollegeId()).isEqualTo(COLLEGE);
        assertThat(row.getUserId()).isEqualTo(USER);
        assertThat(row.getPurposeId()).isEqualTo(2);
        assertThat(row.getNoticeId()).isEqualTo(10);
        assertThat(row.getStatus()).isEqualTo(ConsentStatus.GRANTED);
        assertThat(row.getSourceIp()).isEqualTo("10.0.0.5");
        assertThat(view.status()).isEqualTo(ConsentStatus.GRANTED);
        verify(audit).record(COLLEGE, USER, USER, "CONSENT_GRANTED", "purpose=EMAIL_SMS_COMMS");
    }

    @Test
    void repeatingTheSameAnswerUnderTheSameNoticeAddsNoRow() {
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 10, ConsentStatus.GRANTED)));

        service.recordConsent(2, ConsentStatus.GRANTED, "10.0.0.5");

        verify(consents, never()).save(any());
        verify(audit, never()).record(anyInt(), any(), any(), anyString(), anyString());
    }

    @Test
    void sameAnswerUnderANewNoticeIsRecordedAgain() {
        when(consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(USER, 2))
                .thenReturn(Optional.of(record(2, 9, ConsentStatus.GRANTED)));

        service.recordConsent(2, ConsentStatus.GRANTED, null);

        verify(consents).save(any());
    }

    @Test
    void aPurposeThatCannotBeWithdrawnRefusesWithdrawal() {
        assertThatThrownBy(() -> service.recordConsent(1, ConsentStatus.WITHDRAWN, null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("cannot be withdrawn");
        verify(consents, never()).save(any());
    }

    @Test
    void aPurposeOfAnotherCollegeLooksNonexistent() {
        when(purposes.findByPurposeIdAndCollegeId(55, COLLEGE)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.recordConsent(55, ConsentStatus.GRANTED, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void consentCannotBeRecordedBeforeAnyNoticeIsPublished() {
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.recordConsent(2, ConsentStatus.GRANTED, null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("notice");
    }

    @Test
    void publishingCreatesTheNextVersion() {
        when(notices.save(any())).thenAnswer(i -> i.getArgument(0));

        PrivacyNotice published = service.publishNotice("New text");

        assertThat(published.getVersion()).isEqualTo(3);
        assertThat(published.getCollegeId()).isEqualTo(COLLEGE);
        assertThat(published.getBody()).isEqualTo("New text");
        assertThat(published.getPublishedBy()).isEqualTo(USER);
        verify(audit).record(COLLEGE, USER, null, "NOTICE_PUBLISHED", "version=3");
    }

    @Test
    void firstNoticeIsVersionOneAndABlankBodyIsRejected() {
        when(notices.findFirstByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(Optional.empty());
        when(notices.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.publishNotice("Hello").getVersion()).isEqualTo(1);
        assertThatThrownBy(() -> service.publishNotice("   ")).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void listNoticesUsesTheResolvedCollege() {
        when(tenant.collegeId(3)).thenReturn(COLLEGE);
        when(notices.findByCollegeIdOrderByVersionDesc(COLLEGE)).thenReturn(new ArrayList<>(List.of(notice)));

        assertThat(service.listNotices(3)).containsExactly(notice);
    }
}
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd backend && mvn test -Dtest=ConsentServiceTest`
Expected: FAIL — DTOs and `ConsentService` do not exist.

- [ ] **Step 3: Implement the DTOs**

`backend/src/main/java/com/edgepoint/privacy/dto/PurposeView.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.ConsentStatus;
import com.edgepoint.privacy.domain.LegalBasis;

import java.time.LocalDateTime;

/** One purpose and the caller's latest answer; status and recordedAt are null when never answered. */
public record PurposeView(Integer purposeId, String code, String name, String description,
                          LegalBasis legalBasis, boolean withdrawable,
                          ConsentStatus status, LocalDateTime recordedAt) {
}
```

`backend/src/main/java/com/edgepoint/privacy/dto/NoticeView.java`
```java
package com.edgepoint.privacy.dto;

import java.time.LocalDateTime;
import java.util.List;

/** The current notice with the caller's consent state; noticeId is null when nothing is published yet. */
public record NoticeView(Integer noticeId, Integer version, String body, LocalDateTime effectiveFrom,
                         boolean requiresAction, List<PurposeView> purposes) {
}
```

- [ ] **Step 4: Implement the service**

`backend/src/main/java/com/edgepoint/privacy/service/ConsentService.java`
```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.NoticeView;
import com.edgepoint.privacy.dto.PurposeView;
import com.edgepoint.privacy.repository.ConsentRecordRepository;
import com.edgepoint.privacy.repository.PrivacyNoticeRepository;
import com.edgepoint.privacy.repository.PrivacyPurposeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ConsentService {

    private final PrivacyPurposeRepository purposes;
    private final PrivacyNoticeRepository notices;
    private final ConsentRecordRepository consents;
    private final PrivacyAuditService audit;
    private final PrivacyTenant tenant;

    private record Row(PrivacyPurpose purpose, ConsentRecord latest) {
    }

    @Transactional
    public NoticeView currentNotice() {
        Integer college = tenant.collegeId();
        Optional<PrivacyNotice> notice = notices.findFirstByCollegeIdOrderByVersionDesc(college);
        List<Row> rows = rows(college, tenant.userId());
        Integer noticeId = notice.map(PrivacyNotice::getNoticeId).orElse(null);
        boolean requiresAction = noticeId != null && rows.stream().anyMatch(r ->
                r.purpose().getLegalBasis() == LegalBasis.CONSENT
                        && (r.latest() == null || !noticeId.equals(r.latest().getNoticeId())));
        return new NoticeView(noticeId,
                notice.map(PrivacyNotice::getVersion).orElse(null),
                notice.map(PrivacyNotice::getBody).orElse(null),
                notice.map(PrivacyNotice::getEffectiveFrom).orElse(null),
                requiresAction,
                rows.stream().map(this::view).toList());
    }

    @Transactional
    public List<PurposeView> myConsents() {
        return rows(tenant.collegeId(), tenant.userId()).stream().map(this::view).toList();
    }

    @Transactional
    public PurposeView recordConsent(Integer purposeId, ConsentStatus status, String sourceIp) {
        Integer college = tenant.collegeId();
        Integer user = tenant.userId();
        PrivacyPurpose purpose = purposes.findByPurposeIdAndCollegeId(purposeId, college)
                .filter(PrivacyPurpose::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("PrivacyPurpose", "id", purposeId));
        PrivacyNotice notice = notices.findFirstByCollegeIdOrderByVersionDesc(college)
                .orElseThrow(() -> new BusinessRuleViolationException("No privacy notice has been published yet"));
        if (status == ConsentStatus.WITHDRAWN && !purpose.isWithdrawable()) {
            throw new BusinessRuleViolationException("Consent for this purpose cannot be withdrawn: " + purpose.getName());
        }
        Optional<ConsentRecord> latest = consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(user, purposeId);
        if (latest.isPresent() && latest.get().getStatus() == status
                && notice.getNoticeId().equals(latest.get().getNoticeId())) {
            return view(new Row(purpose, latest.get()));
        }
        ConsentRecord row = new ConsentRecord();
        row.setCollegeId(college);
        row.setUserId(user);
        row.setPurposeId(purposeId);
        row.setNoticeId(notice.getNoticeId());
        row.setStatus(status);
        row.setSourceIp(sourceIp);
        ConsentRecord saved = consents.save(row);
        audit.record(college, user, user, "CONSENT_" + status, "purpose=" + purpose.getCode());
        return view(new Row(purpose, saved));
    }

    @Transactional
    public PrivacyNotice publishNotice(String body) {
        if (body == null || body.isBlank()) {
            throw new BusinessRuleViolationException("Notice text is required");
        }
        Integer college = tenant.collegeId();
        int next = notices.findFirstByCollegeIdOrderByVersionDesc(college)
                .map(n -> n.getVersion() + 1).orElse(1);
        PrivacyNotice notice = new PrivacyNotice();
        notice.setCollegeId(college);
        notice.setVersion(next);
        notice.setBody(body.trim());
        notice.setPublishedBy(tenant.userId());
        PrivacyNotice saved = notices.save(notice);
        audit.record(college, tenant.userId(), null, "NOTICE_PUBLISHED", "version=" + next);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<PrivacyNotice> listNotices(Integer collegeParam) {
        return notices.findByCollegeIdOrderByVersionDesc(tenant.collegeId(collegeParam));
    }

    private List<Row> rows(Integer college, Integer user) {
        ensureDefaultPurposes(college);
        return purposes.findByCollegeIdAndActiveTrueOrderByPurposeId(college).stream()
                .map(p -> new Row(p, consents.findFirstByUserIdAndPurposeIdOrderByConsentIdDesc(user, p.getPurposeId()).orElse(null)))
                .toList();
    }

    private PurposeView view(Row r) {
        PrivacyPurpose p = r.purpose();
        ConsentRecord c = r.latest();
        return new PurposeView(p.getPurposeId(), p.getCode(), p.getName(), p.getDescription(), p.getLegalBasis(),
                p.isWithdrawable(), c == null ? null : c.getStatus(), c == null ? null : c.getRecordedAt());
    }

    private void ensureDefaultPurposes(Integer college) {
        if (purposes.countByCollegeId(college) > 0) {
            return;
        }
        seed(college, "ACADEMIC_RECORDS", "Academic records",
                "Enrolment, attendance, marks and results needed to run your course.", LegalBasis.LEGITIMATE_USE, false);
        seed(college, "EMAIL_SMS_COMMS", "Email and SMS communications",
                "Notices, reminders and announcements sent to you by email or SMS.", LegalBasis.CONSENT, true);
        seed(college, "PARENT_NOTIFICATIONS", "Notifications to parent or guardian",
                "Attendance and marks alerts sent to the parent or guardian contact on your profile.", LegalBasis.CONSENT, true);
    }

    private void seed(Integer college, String code, String name, String description, LegalBasis basis, boolean withdrawable) {
        PrivacyPurpose p = new PrivacyPurpose();
        p.setCollegeId(college);
        p.setCode(code);
        p.setName(name);
        p.setDescription(description);
        p.setLegalBasis(basis);
        p.setWithdrawable(withdrawable);
        p.setActive(true);
        purposes.save(p);
    }
}
```

> After seeding, `findByCollegeIdAndActiveTrueOrderByPurposeId` returns the saved rows in a real database. In the unit test the repository is mocked, so the seeding test only checks the saves.

- [ ] **Step 5: Run the test**

Run: `cd backend && mvn test -Dtest=ConsentServiceTest`
Expected: PASS (13 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/dto backend/src/main/java/com/edgepoint/privacy/service/ConsentService.java \
  backend/src/test/java/com/edgepoint/privacy/service/ConsentServiceTest.java
git commit -m "Add consent and notice service

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: DataRequestService (submit, review, resolve, export)

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/dto/DataRequestView.java`, `RequestEventView.java`, `DataRequestDetail.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/service/DataRequestService.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/service/DataRequestServiceTest.java`

**Interfaces:**
- Consumes: `DataRequestRepository`, `DataRequestEventRepository`, `List<PersonalDataContributor>`, `ErasureService#erase(Integer collegeId, Integer userId, Integer actorId, String reason)`, `PrivacyAuditService#record(...)`, `PrivacyTenant`, `PrivacyProperties#getResponseDays()`, Spring's `ObjectMapper`.
- Produces:
  ```java
  public record DataRequestView(Integer requestId, Integer userId, RequestType type, RequestStatus status,
          String details, LocalDateTime submittedAt, LocalDateTime dueAt, LocalDateTime resolvedAt,
          String resolutionNote, boolean overdue) { static DataRequestView from(DataRequest r) }
  public record RequestEventView(RequestStatus fromStatus, RequestStatus toStatus, Integer actorId,
          String note, LocalDateTime occurredAt) { static RequestEventView from(DataRequestEvent e) }
  public record DataRequestDetail(DataRequestView request, String correctionPayload, List<RequestEventView> events) {}

  DataRequestService(DataRequestRepository requests, DataRequestEventRepository events,
          List<PersonalDataContributor> contributors, ErasureService erasure, PrivacyAuditService audit,
          PrivacyTenant tenant, PrivacyProperties properties, ObjectMapper mapper)
  DataRequest submit(RequestType type, String details, Map<String,String> correction)
  List<DataRequest> mine()
  DataRequestDetail detailMine(Integer requestId)
  DataRequest cancel(Integer requestId)
  String exportFor(Integer requestId)                       // JSON bundle, requester only
  Page<DataRequest> queue(Integer collegeParam, RequestStatus status, boolean overdueOnly, Pageable pageable)
  DataRequestDetail detailAdmin(Integer requestId)
  DataRequest review(Integer requestId)                     // SUBMITTED -> IN_REVIEW, assigns the caller
  DataRequest resolve(Integer requestId, RequestStatus outcome, String note)
  ```

- [ ] **Step 1: Write the failing test**

`backend/src/test/java/com/edgepoint/privacy/service/DataRequestServiceTest.java`

```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
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

    PrivacyProperties properties = new PrivacyProperties();
    ObjectMapper mapper = new ObjectMapper();
    DataRequestService service;

    @BeforeEach
    void setUp() {
        service = new DataRequestService(requests, events, List.of(account, student), erasure, audit, tenant, properties, mapper);
        when(tenant.collegeId()).thenReturn(COLLEGE);
        when(tenant.userId()).thenReturn(STUDENT);
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
        assertThatThrownBy(() -> service.review(11)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.resolve(11, RequestStatus.COMPLETED, "ok")).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> service.detailAdmin(11)).isInstanceOf(ResourceNotFoundException.class);
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
}
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd backend && mvn test -Dtest=DataRequestServiceTest`
Expected: FAIL — DTOs and `DataRequestService` do not exist.

- [ ] **Step 3: Implement the DTOs**

`backend/src/main/java/com/edgepoint/privacy/dto/DataRequestView.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;

import java.time.LocalDateTime;

public record DataRequestView(Integer requestId, Integer userId, RequestType type, RequestStatus status,
                              String details, LocalDateTime submittedAt, LocalDateTime dueAt,
                              LocalDateTime resolvedAt, String resolutionNote, boolean overdue) {

    public static DataRequestView from(DataRequest r) {
        boolean overdue = !r.getStatus().isTerminal() && r.getDueAt() != null && r.getDueAt().isBefore(LocalDateTime.now());
        return new DataRequestView(r.getRequestId(), r.getUserId(), r.getType(), r.getStatus(), r.getDetails(),
                r.getSubmittedAt(), r.getDueAt(), r.getResolvedAt(), r.getResolutionNote(), overdue);
    }
}
```

`backend/src/main/java/com/edgepoint/privacy/dto/RequestEventView.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.DataRequestEvent;
import com.edgepoint.privacy.domain.RequestStatus;

import java.time.LocalDateTime;

public record RequestEventView(RequestStatus fromStatus, RequestStatus toStatus, Integer actorId,
                               String note, LocalDateTime occurredAt) {

    public static RequestEventView from(DataRequestEvent e) {
        return new RequestEventView(e.getFromStatus(), e.getToStatus(), e.getActorId(), e.getNote(), e.getOccurredAt());
    }
}
```

`backend/src/main/java/com/edgepoint/privacy/dto/DataRequestDetail.java`
```java
package com.edgepoint.privacy.dto;

import java.util.List;

public record DataRequestDetail(DataRequestView request, String correctionPayload, List<RequestEventView> events) {
}
```

- [ ] **Step 4: Implement the service**

`backend/src/main/java/com/edgepoint/privacy/service/DataRequestService.java`
```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.privacy.config.PrivacyProperties;
import com.edgepoint.privacy.contributor.PersonalDataContributor;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.DataRequestDetail;
import com.edgepoint.privacy.dto.DataRequestView;
import com.edgepoint.privacy.dto.RequestEventView;
import com.edgepoint.privacy.repository.DataRequestEventRepository;
import com.edgepoint.privacy.repository.DataRequestRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DataRequestService {

    private final DataRequestRepository requests;
    private final DataRequestEventRepository events;
    private final List<PersonalDataContributor> contributors;
    private final ErasureService erasure;
    private final PrivacyAuditService audit;
    private final PrivacyTenant tenant;
    private final PrivacyProperties properties;
    private final ObjectMapper mapper;

    // ---------------------------------------------------------------- principal side

    @Transactional
    public DataRequest submit(RequestType type, String details, Map<String, String> correction) {
        Integer college = tenant.collegeId();
        Integer user = tenant.userId();
        String payload = null;
        if (type == RequestType.CORRECTION) {
            payload = validatedCorrection(correction);
        } else if (type == RequestType.GRIEVANCE) {
            if (details == null || details.isBlank()) {
                throw new BusinessRuleViolationException("Please describe your grievance");
            }
        } else if (type == RequestType.ERASURE
                && requests.existsByUserIdAndTypeAndStatusIn(user, RequestType.ERASURE, RequestStatus.OPEN)) {
            throw new BusinessRuleViolationException("You already have an open erasure request");
        }
        LocalDateTime now = LocalDateTime.now();
        DataRequest r = new DataRequest();
        r.setCollegeId(college);
        r.setUserId(user);
        r.setType(type);
        r.setStatus(RequestStatus.SUBMITTED);
        r.setDetails(details == null || details.isBlank() ? null : details.trim());
        r.setCorrectionPayload(payload);
        r.setSubmittedAt(now);
        r.setDueAt(now.plusDays(properties.getResponseDays()));
        DataRequest saved = requests.save(r);
        recordEvent(saved, null, RequestStatus.SUBMITTED, user, null);
        audit.record(college, user, user, "REQUEST_SUBMITTED", "type=" + type + ", requestId=" + saved.getRequestId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DataRequest> mine() {
        return requests.findByUserIdOrderBySubmittedAtDesc(tenant.userId());
    }

    @Transactional(readOnly = true)
    public DataRequestDetail detailMine(Integer requestId) {
        return detail(loadOwn(requestId));
    }

    @Transactional
    public DataRequest cancel(Integer requestId) {
        DataRequest r = loadOwn(requestId);
        Integer user = tenant.userId();
        transition(r, RequestStatus.CANCELLED, user, null);
        r.setResolvedAt(LocalDateTime.now());
        DataRequest saved = requests.save(r);
        audit.record(r.getCollegeId(), user, user, "REQUEST_CANCELLED", "requestId=" + requestId);
        return saved;
    }

    @Transactional
    public String exportFor(Integer requestId) {
        DataRequest r = loadOwn(requestId);
        if (r.getType() != RequestType.ACCESS || r.getStatus() != RequestStatus.COMPLETED || r.getExportPayload() == null) {
            throw new BusinessRuleViolationException("No export is available for this request");
        }
        audit.record(r.getCollegeId(), r.getUserId(), r.getUserId(), "EXPORT_DOWNLOADED", "requestId=" + requestId);
        return r.getExportPayload();
    }

    // ---------------------------------------------------------------- admin side

    @Transactional(readOnly = true)
    public Page<DataRequest> queue(Integer collegeParam, RequestStatus status, boolean overdueOnly, Pageable pageable) {
        Integer college = tenant.collegeId(collegeParam);
        Pageable oldestDueFirst = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by("dueAt").ascending());
        if (overdueOnly) {
            return requests.findByCollegeIdAndStatusInAndDueAtBefore(college, RequestStatus.OPEN, LocalDateTime.now(), oldestDueFirst);
        }
        if (status != null) {
            return requests.findByCollegeIdAndStatus(college, status, oldestDueFirst);
        }
        return requests.findByCollegeId(college, oldestDueFirst);
    }

    @Transactional(readOnly = true)
    public DataRequestDetail detailAdmin(Integer requestId) {
        return detail(load(requestId, tenant.collegeId()));
    }

    @Transactional
    public DataRequest review(Integer requestId) {
        Integer college = tenant.collegeId();
        Integer admin = tenant.userId();
        DataRequest r = load(requestId, college);
        forbidSelfAction(r, admin);
        transition(r, RequestStatus.IN_REVIEW, admin, null);
        r.setAssignedTo(admin);
        DataRequest saved = requests.save(r);
        audit.record(college, admin, r.getUserId(), "REQUEST_IN_REVIEW", "requestId=" + requestId);
        return saved;
    }

    @Transactional
    public DataRequest resolve(Integer requestId, RequestStatus outcome, String note) {
        Integer college = tenant.collegeId();
        Integer admin = tenant.userId();
        DataRequest r = load(requestId, college);
        forbidSelfAction(r, admin);
        if (note == null || note.isBlank()) {
            throw new BusinessRuleViolationException("A resolution note is required");
        }
        if (!r.getStatus().canTransitionTo(outcome)) {
            throw new BusinessRuleViolationException("Cannot move a request from " + r.getStatus() + " to " + outcome);
        }
        if (outcome == RequestStatus.PARTIALLY_COMPLETED && r.getType() != RequestType.ERASURE) {
            throw new BusinessRuleViolationException("Only erasure requests can be partially completed");
        }
        if (outcome != RequestStatus.REJECTED) {
            execute(r, admin);
        }
        transition(r, outcome, admin, note.trim());
        r.setResolutionNote(note.trim());
        if (outcome == RequestStatus.REJECTED) {
            r.setRejectionReason(note.trim());
        }
        r.setResolvedAt(LocalDateTime.now());
        DataRequest saved = requests.save(r);
        audit.record(college, admin, r.getUserId(), "REQUEST_" + outcome, "requestId=" + requestId);
        return saved;
    }

    // ---------------------------------------------------------------- internals

    private void execute(DataRequest r, Integer admin) {
        switch (r.getType()) {
            case ACCESS -> r.setExportPayload(toJson(buildExport(r.getUserId())));
            case CORRECTION -> applyCorrection(r, admin);
            case ERASURE -> erasure.erase(r.getCollegeId(), r.getUserId(), admin, "requestId=" + r.getRequestId());
            case GRIEVANCE -> { /* answered through the resolution note only */ }
        }
    }

    private Map<String, Object> buildExport(Integer userId) {
        Map<String, Object> bundle = new LinkedHashMap<>();
        bundle.put("generatedAt", LocalDateTime.now().toString());
        for (PersonalDataContributor c : contributors) {
            Map<String, Object> data = c.export(userId);
            if (data != null && !data.isEmpty()) {
                bundle.put(c.section(), data);
            }
        }
        return bundle;
    }

    private void applyCorrection(DataRequest r, Integer admin) {
        Map<String, String> payload = fromJson(r.getCorrectionPayload());
        for (PersonalDataContributor c : contributors) {
            Map<String, String> mine = payload.entrySet().stream()
                    .filter(e -> c.correctableFields().contains(e.getKey()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
            if (!mine.isEmpty()) {
                c.correct(r.getUserId(), mine);
            }
        }
        // field names only: the new values are personal data and stay out of the audit trail
        audit.record(r.getCollegeId(), admin, r.getUserId(), "CORRECTION_APPLIED", "fields=" + new TreeSet<>(payload.keySet()));
    }

    private String validatedCorrection(Map<String, String> correction) {
        if (correction == null || correction.isEmpty()) {
            throw new BusinessRuleViolationException("Say which field to correct and the new value");
        }
        Set<String> allowed = contributors.stream()
                .flatMap(c -> c.correctableFields().stream())
                .collect(Collectors.toSet());
        for (Map.Entry<String, String> e : correction.entrySet()) {
            if (!allowed.contains(e.getKey())) {
                throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
            if (e.getValue() == null || e.getValue().isBlank()) {
                throw new BusinessRuleViolationException("Value is required for " + e.getKey());
            }
        }
        return toJson(correction);
    }

    private void transition(DataRequest r, RequestStatus next, Integer actor, String note) {
        RequestStatus from = r.getStatus();
        if (!from.canTransitionTo(next)) {
            throw new BusinessRuleViolationException("Cannot move a request from " + from + " to " + next);
        }
        r.setStatus(next);
        recordEvent(r, from, next, actor, note);
    }

    private void recordEvent(DataRequest r, RequestStatus from, RequestStatus to, Integer actor, String note) {
        DataRequestEvent e = new DataRequestEvent();
        e.setRequestId(r.getRequestId());
        e.setFromStatus(from);
        e.setToStatus(to);
        e.setActorId(actor);
        e.setNote(note);
        events.save(e);
    }

    private void forbidSelfAction(DataRequest r, Integer actor) {
        if (r.getUserId().equals(actor)) {
            throw new BusinessRuleViolationException("You cannot act on your own request");
        }
    }

    private DataRequest load(Integer requestId, Integer college) {
        return requests.findByRequestIdAndCollegeId(requestId, college)
                .orElseThrow(() -> new ResourceNotFoundException("DataRequest", "id", requestId));
    }

    /** The request must exist in the caller's college and belong to the caller; anything else is "not found". */
    private DataRequest loadOwn(Integer requestId) {
        DataRequest r = load(requestId, tenant.collegeId());
        if (!r.getUserId().equals(tenant.userId())) {
            throw new ResourceNotFoundException("DataRequest", "id", requestId);
        }
        return r;
    }

    private DataRequestDetail detail(DataRequest r) {
        return new DataRequestDetail(DataRequestView.from(r), r.getCorrectionPayload(),
                events.findByRequestIdOrderByEventId(r.getRequestId()).stream().map(RequestEventView::from).toList());
    }

    private String toJson(Object value) {
        try {
            return mapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise privacy payload", e);
        }
    }

    private Map<String, String> fromJson(String json) {
        try {
            return mapper.readValue(json, new TypeReference<Map<String, String>>() { });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Stored correction payload is not valid JSON", e);
        }
    }
}
```

> The message "You cannot act on your own request" contains "own request", which the test asserts.

- [ ] **Step 5: Run the test**

Run: `cd backend && mvn test -Dtest=DataRequestServiceTest`
Expected: PASS (27 tests). If `aFailingActionLeavesTheRequestUnresolved` fails, check that `execute(...)` runs before `transition(...)` and `requests.save` in `resolve`; the order matters.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/dto backend/src/main/java/com/edgepoint/privacy/service/DataRequestService.java \
  backend/src/test/java/com/edgepoint/privacy/service/DataRequestServiceTest.java
git commit -m "Add data-principal request service

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Retention service and scheduler

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/dto/RetentionPolicyUpdate.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/service/RetentionService.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/service/RetentionScheduler.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/service/RetentionServiceTest.java`, `RetentionSchedulerTest.java`

**Interfaces:**
- Consumes: `RetentionPolicyRepository`, `RetentionRunRepository`, `RetentionCandidateRepository#findExpiredInactive(Integer collegeId, LocalDateTime cutoff, List<String> roleNames)`, `ErasureService#erase(...)`, `PrivacyAuditService`, `PrivacyTenant`, `PrivacyProperties#isRetentionDryRun()`, `CollegeRepository#findAll()`.
- Produces:
  ```java
  public record RetentionPolicyUpdate(@NotBlank String dataCategory, @Min(1) int retentionDays,
          @NotNull RetentionTrigger triggerEvent, @NotNull RetentionAction action, boolean enabled) {}

  RetentionService(RetentionPolicyRepository policyRepository, RetentionRunRepository runRepository,
          RetentionCandidateRepository candidates, ErasureService erasure, PrivacyAuditService audit, PrivacyTenant tenant)
  List<RetentionPolicy> policies(Integer collegeParam)                    // seeds the disabled default on first read
  List<RetentionPolicy> updatePolicies(List<RetentionPolicyUpdate> updates)
  RetentionRun run(Integer collegeId, boolean dryRun, Integer actorId)    // NOT transactional (see note)
  RetentionRun runNow(boolean dryRun)                                     // college and actor from the tenant
  Page<RetentionRun> runs(Integer collegeParam, Pageable pageable)
  RetentionScheduler(CollegeRepository colleges, RetentionService service, PrivacyProperties properties)
  void runNightly()
  ```

- [ ] **Step 1: Write the failing tests**

`backend/src/test/java/com/edgepoint/privacy/service/RetentionServiceTest.java`

```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.RetentionPolicyUpdate;
import com.edgepoint.privacy.repository.RetentionCandidateRepository;
import com.edgepoint.privacy.repository.RetentionPolicyRepository;
import com.edgepoint.privacy.repository.RetentionRunRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RetentionServiceTest {

    static final int COLLEGE = 7;
    static final List<String> ROLES = List.of("STUDENT", "TEACHER");

    @Mock RetentionPolicyRepository policyRepository;
    @Mock RetentionRunRepository runRepository;
    @Mock RetentionCandidateRepository candidates;
    @Mock ErasureService erasure;
    @Mock PrivacyAuditService audit;
    @Mock PrivacyTenant tenant;

    RetentionService service;
    RetentionPolicy policy;

    @BeforeEach
    void setUp() {
        service = new RetentionService(policyRepository, runRepository, candidates, erasure, audit, tenant);
        when(tenant.collegeId()).thenReturn(COLLEGE);
        when(tenant.userId()).thenReturn(99);
        policy = new RetentionPolicy();
        policy.setPolicyId(1); policy.setCollegeId(COLLEGE);
        policy.setDataCategory(RetentionPolicy.ACCOUNT_RECORDS); policy.setRetentionDays(100); policy.setEnabled(true);
        when(policyRepository.findByCollegeIdAndEnabledTrue(COLLEGE)).thenReturn(List.of(policy));
        when(runRepository.save(any())).thenAnswer(i -> {
            RetentionRun r = i.getArgument(0);
            if (r.getRunId() == null) r.setRunId(5);
            return r;
        });
        when(policyRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    User user(int id) {
        User u = new User();
        u.setUserId(id);
        return u;
    }

    @Test
    void dryRunCountsButNeverErases() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of(user(1), user(2)));

        RetentionRun run = service.run(COLLEGE, true, 99);

        verify(erasure, never()).erase(any(), any(), any(), any());
        assertThat(run.isDryRun()).isTrue();
        assertThat(run.getRecordsProcessed()).isEqualTo(2);
        assertThat(run.getRecordsFailed()).isZero();
        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.COMPLETED);
        assertThat(run.getFinishedAt()).isNotNull();
        verify(audit).record(COLLEGE, 99, null, "RETENTION_DRY_RUN", "runId=5, processed=2, failed=0");
    }

    @Test
    void liveRunAnonymisesEveryCandidate() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of(user(1), user(2)));

        RetentionRun run = service.run(COLLEGE, false, null);

        verify(erasure).erase(COLLEGE, 1, null, "Retention policy ACCOUNT_RECORDS");
        verify(erasure).erase(COLLEGE, 2, null, "Retention policy ACCOUNT_RECORDS");
        assertThat(run.getRecordsProcessed()).isEqualTo(2);
        verify(audit).record(COLLEGE, null, null, "RETENTION_RUN", "runId=5, processed=2, failed=0");
    }

    @Test
    void oneFailureDoesNotStopTheBatch() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of(user(1), user(2), user(3)));
        doThrow(new IllegalStateException("boom")).when(erasure).erase(COLLEGE, 2, null, "Retention policy ACCOUNT_RECORDS");

        RetentionRun run = service.run(COLLEGE, false, null);

        verify(erasure).erase(COLLEGE, 3, null, "Retention policy ACCOUNT_RECORDS");
        assertThat(run.getRecordsProcessed()).isEqualTo(2);
        assertThat(run.getRecordsFailed()).isEqualTo(1);
        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.COMPLETED);
    }

    @Test
    void theCutoffIsTodayMinusTheRetentionDays() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of());

        service.run(COLLEGE, true, null);

        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(candidates).findExpiredInactive(eq(COLLEGE), cutoff.capture(), eq(ROLES));
        assertThat(cutoff.getValue()).isBetween(LocalDateTime.now().minusDays(100).minusMinutes(1),
                LocalDateTime.now().minusDays(100).plusMinutes(1));
    }

    @Test
    void withNoEnabledPolicyNothingIsQueriedOrErased() {
        when(policyRepository.findByCollegeIdAndEnabledTrue(COLLEGE)).thenReturn(List.of());

        RetentionRun run = service.run(COLLEGE, false, null);

        verifyNoInteractions(candidates, erasure);
        assertThat(run.getRecordsProcessed()).isZero();
        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.COMPLETED);
    }

    @Test
    void aQueryFailureMarksTheRunFailedWithoutThrowing() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenThrow(new IllegalStateException("db"));

        RetentionRun run = service.run(COLLEGE, false, null);

        assertThat(run.getStatus()).isEqualTo(RetentionRunStatus.FAILED);
        assertThat(run.getFinishedAt()).isNotNull();
    }

    @Test
    void runNowUsesTheCallersCollegeAndIdentity() {
        when(candidates.findExpiredInactive(eq(COLLEGE), any(), eq(ROLES))).thenReturn(List.of());

        RetentionRun run = service.runNow(true);

        assertThat(run.getCollegeId()).isEqualTo(COLLEGE);
        verify(audit).record(COLLEGE, 99, null, "RETENTION_DRY_RUN", "runId=5, processed=0, failed=0");
    }

    @Test
    void firstReadSeedsADisabledDefaultPolicy() {
        when(tenant.collegeId(null)).thenReturn(COLLEGE);
        when(policyRepository.findByCollegeId(COLLEGE)).thenReturn(List.of());

        List<RetentionPolicy> result = service.policies(null);

        assertThat(result).hasSize(1);
        RetentionPolicy seeded = result.get(0);
        assertThat(seeded.getDataCategory()).isEqualTo("ACCOUNT_RECORDS");
        assertThat(seeded.getRetentionDays()).isEqualTo(1825);
        assertThat(seeded.isEnabled()).isFalse();
        assertThat(seeded.getAction()).isEqualTo(RetentionAction.ANONYMISE);
        assertThat(seeded.getTriggerEvent()).isEqualTo(RetentionTrigger.ACCOUNT_DEACTIVATED);
    }

    @Test
    void updateChangesAnExistingPolicyAndAudits() {
        when(policyRepository.findByCollegeIdAndDataCategory(COLLEGE, "ACCOUNT_RECORDS")).thenReturn(Optional.of(policy));
        when(policyRepository.findByCollegeId(COLLEGE)).thenReturn(List.of(policy));

        service.updatePolicies(List.of(new RetentionPolicyUpdate("ACCOUNT_RECORDS", 400,
                RetentionTrigger.ACCOUNT_DEACTIVATED, RetentionAction.ANONYMISE, false)));

        assertThat(policy.getRetentionDays()).isEqualTo(400);
        assertThat(policy.isEnabled()).isFalse();
        verify(policyRepository).save(policy);
        verify(audit).record(COLLEGE, 99, null, "RETENTION_POLICY_UPDATED", "category=ACCOUNT_RECORDS, days=400, enabled=false");
    }

    @Test
    void updateRejectsUnknownCategoriesAndNonPositiveDays() {
        assertThatThrownBy(() -> service.updatePolicies(List.of(new RetentionPolicyUpdate("MARKS", 10,
                RetentionTrigger.ACCOUNT_DEACTIVATED, RetentionAction.ANONYMISE, true))))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.updatePolicies(List.of(new RetentionPolicyUpdate("ACCOUNT_RECORDS", 0,
                RetentionTrigger.ACCOUNT_DEACTIVATED, RetentionAction.ANONYMISE, true))))
                .isInstanceOf(BusinessRuleViolationException.class);
        assertThatThrownBy(() -> service.updatePolicies(List.of(new RetentionPolicyUpdate("ACCOUNT_RECORDS", 30,
                null, null, true))))
                .isInstanceOf(BusinessRuleViolationException.class);
        verify(policyRepository, never()).save(any());
    }

    @Test
    void runsAreListedForTheResolvedCollege() {
        when(tenant.collegeId(3)).thenReturn(COLLEGE);
        when(runRepository.findByCollegeIdOrderByRunIdDesc(eq(COLLEGE), any())).thenReturn(Page.empty());
        service.runs(3, PageRequest.of(0, 10));
        verify(runRepository).findByCollegeIdOrderByRunIdDesc(eq(COLLEGE), any());
    }
}
```

`backend/src/test/java/com/edgepoint/privacy/service/RetentionSchedulerTest.java`

```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.College;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.privacy.config.PrivacyProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RetentionSchedulerTest {

    @Mock CollegeRepository colleges;
    @Mock RetentionService service;

    College college(int id, boolean deleted) {
        College c = new College();
        c.setCollegeId(id);
        c.setIsDeleted(deleted);
        return c;
    }

    @Test
    void runsOncePerLiveCollegeInDryRunByDefault() {
        when(colleges.findAll()).thenReturn(List.of(college(1, false), college(2, true), college(3, false)));

        new RetentionScheduler(colleges, service, new PrivacyProperties()).runNightly();

        verify(service).run(eq(1), eq(true), isNull());
        verify(service).run(eq(3), eq(true), isNull());
        verify(service, never()).run(eq(2), anyBoolean(), any());
    }

    @Test
    void goesLiveOnlyWhenDryRunIsSwitchedOff() {
        PrivacyProperties live = new PrivacyProperties();
        live.setRetentionDryRun(false);
        when(colleges.findAll()).thenReturn(List.of(college(1, false)));

        new RetentionScheduler(colleges, service, live).runNightly();

        verify(service).run(eq(1), eq(false), isNull());
    }

    @Test
    void oneCollegeFailingDoesNotStopTheOthers() {
        when(colleges.findAll()).thenReturn(List.of(college(1, false), college(3, false)));
        when(service.run(eq(1), anyBoolean(), any())).thenThrow(new IllegalStateException("boom"));

        new RetentionScheduler(colleges, service, new PrivacyProperties()).runNightly();

        verify(service).run(eq(3), eq(true), isNull());
    }
}
```

- [ ] **Step 2: Run them and see them fail**

Run: `cd backend && mvn test -Dtest='RetentionServiceTest,RetentionSchedulerTest'`
Expected: FAIL — classes do not exist.

- [ ] **Step 3: Implement**

`backend/src/main/java/com/edgepoint/privacy/dto/RetentionPolicyUpdate.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RetentionAction;
import com.edgepoint.privacy.domain.RetentionTrigger;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RetentionPolicyUpdate(@NotBlank String dataCategory, @Min(1) int retentionDays,
                                    @NotNull RetentionTrigger triggerEvent, @NotNull RetentionAction action,
                                    boolean enabled) {
}
```

`backend/src/main/java/com/edgepoint/privacy/service/RetentionService.java`
```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.RetentionPolicyUpdate;
import com.edgepoint.privacy.repository.RetentionCandidateRepository;
import com.edgepoint.privacy.repository.RetentionPolicyRepository;
import com.edgepoint.privacy.repository.RetentionRunRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RetentionService {

    static final List<String> ELIGIBLE_ROLES = List.of("STUDENT", "TEACHER");
    static final int DEFAULT_RETENTION_DAYS = 1825;

    private final RetentionPolicyRepository policyRepository;
    private final RetentionRunRepository runRepository;
    private final RetentionCandidateRepository candidates;
    private final ErasureService erasure;
    private final PrivacyAuditService audit;
    private final PrivacyTenant tenant;

    @Transactional
    public List<RetentionPolicy> policies(Integer collegeParam) {
        Integer college = tenant.collegeId(collegeParam);
        List<RetentionPolicy> existing = policyRepository.findByCollegeId(college);
        if (!existing.isEmpty()) {
            return existing;
        }
        RetentionPolicy seeded = new RetentionPolicy();
        seeded.setCollegeId(college);
        seeded.setDataCategory(RetentionPolicy.ACCOUNT_RECORDS);
        seeded.setRetentionDays(DEFAULT_RETENTION_DAYS);
        seeded.setEnabled(false);
        return List.of(policyRepository.save(seeded));
    }

    @Transactional
    public List<RetentionPolicy> updatePolicies(List<RetentionPolicyUpdate> updates) {
        Integer college = tenant.collegeId();
        for (RetentionPolicyUpdate u : updates) {
            if (!RetentionPolicy.ACCOUNT_RECORDS.equals(u.dataCategory())) {
                throw new BusinessRuleViolationException("Unknown data category: " + u.dataCategory());
            }
            if (u.retentionDays() < 1) {
                throw new BusinessRuleViolationException("Retention period must be at least 1 day");
            }
            if (u.triggerEvent() == null || u.action() == null) {
                throw new BusinessRuleViolationException("Trigger event and action are required");
            }
        }
        for (RetentionPolicyUpdate u : updates) {
            RetentionPolicy p = policyRepository.findByCollegeIdAndDataCategory(college, u.dataCategory())
                    .orElseGet(() -> {
                        RetentionPolicy created = new RetentionPolicy();
                        created.setCollegeId(college);
                        created.setDataCategory(u.dataCategory());
                        return created;
                    });
            p.setRetentionDays(u.retentionDays());
            p.setTriggerEvent(u.triggerEvent());
            p.setAction(u.action());
            p.setEnabled(u.enabled());
            policyRepository.save(p);
            audit.record(college, tenant.userId(), null, "RETENTION_POLICY_UPDATED",
                    "category=" + u.dataCategory() + ", days=" + u.retentionDays() + ", enabled=" + u.enabled());
        }
        return policyRepository.findByCollegeId(college);
    }

    /**
     * Deliberately not {@code @Transactional}: each erasure commits on its own, so one failing user rolls
     * back only itself instead of marking a surrounding transaction rollback-only.
     */
    public RetentionRun run(Integer collegeId, boolean dryRun, Integer actorId) {
        RetentionRun run = new RetentionRun();
        run.setCollegeId(collegeId);
        run.setDryRun(dryRun);
        run.setStartedAt(LocalDateTime.now());
        run = runRepository.save(run);
        int processed = 0;
        int failed = 0;
        try {
            for (RetentionPolicy policy : policyRepository.findByCollegeIdAndEnabledTrue(collegeId)) {
                LocalDateTime cutoff = LocalDateTime.now().minusDays(policy.getRetentionDays());
                for (User user : candidates.findExpiredInactive(collegeId, cutoff, ELIGIBLE_ROLES)) {
                    if (dryRun) {
                        processed++;
                        continue;
                    }
                    try {
                        erasure.erase(collegeId, user.getUserId(), actorId, "Retention policy " + policy.getDataCategory());
                        processed++;
                    } catch (RuntimeException e) {
                        failed++;
                        log.warn("Retention erasure failed for user {} in college {}: {}", user.getUserId(), collegeId, e.toString());
                    }
                }
            }
            run.setStatus(RetentionRunStatus.COMPLETED);
        } catch (RuntimeException e) {
            run.setStatus(RetentionRunStatus.FAILED);
            log.error("Retention run for college {} failed: {}", collegeId, e.toString());
        }
        run.setRecordsProcessed(processed);
        run.setRecordsFailed(failed);
        run.setFinishedAt(LocalDateTime.now());
        run = runRepository.save(run);
        audit.record(collegeId, actorId, null, dryRun ? "RETENTION_DRY_RUN" : "RETENTION_RUN",
                "runId=" + run.getRunId() + ", processed=" + processed + ", failed=" + failed);
        return run;
    }

    public RetentionRun runNow(boolean dryRun) {
        return run(tenant.collegeId(), dryRun, tenant.userId());
    }

    @Transactional(readOnly = true)
    public Page<RetentionRun> runs(Integer collegeParam, Pageable pageable) {
        return runRepository.findByCollegeIdOrderByRunIdDesc(tenant.collegeId(collegeParam), pageable);
    }
}
```

`backend/src/main/java/com/edgepoint/privacy/service/RetentionScheduler.java`
```java
package com.edgepoint.privacy.service;

import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.privacy.config.PrivacyProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Nightly retention pass over every live college. Dry-run unless app.privacy.retention-dry-run=false.
 * Not cluster-safe (no distributed lock): run a single replica of this job, or keep it in dry-run.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RetentionScheduler {

    private final CollegeRepository colleges;
    private final RetentionService service;
    private final PrivacyProperties properties;

    @Scheduled(cron = "${app.privacy.retention-cron:0 30 2 * * *}")
    public void runNightly() {
        colleges.findAll().stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                .forEach(c -> {
                    try {
                        service.run(c.getCollegeId(), properties.isRetentionDryRun(), null);
                    } catch (RuntimeException e) {
                        log.error("Nightly retention failed for college {}: {}", c.getCollegeId(), e.toString());
                    }
                });
    }
}
```

- [ ] **Step 4: Run the tests**

Run: `cd backend && mvn test -Dtest='RetentionServiceTest,RetentionSchedulerTest'`
Expected: PASS (11 + 3 tests). `RetentionSchedulerTest` uses `any()` without importing it: add `import static org.mockito.ArgumentMatchers.any;` there if the compiler complains (it is also covered by `Mockito.*`).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/dto/RetentionPolicyUpdate.java \
  backend/src/main/java/com/edgepoint/privacy/service/RetentionService.java \
  backend/src/main/java/com/edgepoint/privacy/service/RetentionScheduler.java \
  backend/src/test/java/com/edgepoint/privacy/service/RetentionServiceTest.java \
  backend/src/test/java/com/edgepoint/privacy/service/RetentionSchedulerTest.java
git commit -m "Add retention service and nightly scheduler

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: REST controllers and role checks

**Files:**
- Create: `backend/src/main/java/com/edgepoint/privacy/dto/ConsentRequest.java`, `DataRequestCreate.java`, `ResolveRequest.java`, `NoticeCreate.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/controller/PrivacyController.java`
- Create: `backend/src/main/java/com/edgepoint/privacy/controller/PrivacyAdminController.java`
- Test: `backend/src/test/java/com/edgepoint/privacy/controller/PrivacySecurityTest.java`

**Interfaces:**
- Consumes: `ConsentService`, `DataRequestService`, `RetentionService`, `PrivacyAuditService` (all earlier tasks), `ApiResponse.success(data, message)`.
- Produces: the REST API of the spec section 5 plus `GET /privacy/requests/{id}` and `GET /privacy/admin/requests/{id}`. JSON bodies:
  - `POST /privacy/consents` ← `{ "purposeId": 2, "status": "GRANTED" }`
  - `POST /privacy/requests` ← `{ "type": "CORRECTION", "details": "...", "correction": { "phone": "..." } }`
  - `POST /privacy/admin/requests/{id}/resolve` ← `{ "outcome": "COMPLETED", "note": "..." }`
  - `POST /privacy/admin/notices` ← `{ "body": "..." }`
  - `PUT /privacy/admin/retention-policies` ← `[ { "dataCategory": "ACCOUNT_RECORDS", "retentionDays": 1825, "triggerEvent": "ACCOUNT_DEACTIVATED", "action": "ANONYMISE", "enabled": false } ]`
  - `POST /privacy/admin/retention/run?dryRun=true` (default `true`).

- [ ] **Step 1: Write the failing security test**

`backend/src/test/java/com/edgepoint/privacy/controller/PrivacySecurityTest.java`

```java
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
```

> If the repo's Spring Boot version is 3.4 or newer, `@MockBean` is deprecated; replace it with `@MockitoBean` from `org.springframework.test.context.bean.override.mockito.MockitoBean`. If MockMvc security tests do not run at all in this repo (Task 0 baseline), report that instead of weakening the test.

- [ ] **Step 2: Run it and see it fail**

Run: `cd backend && mvn test -Dtest=PrivacySecurityTest`
Expected: FAIL — controllers and request DTOs do not exist (compile errors, or 404s once they compile).

- [ ] **Step 3: Implement the request DTOs**

`backend/src/main/java/com/edgepoint/privacy/dto/ConsentRequest.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.ConsentStatus;
import jakarta.validation.constraints.NotNull;

public record ConsentRequest(@NotNull Integer purposeId, @NotNull ConsentStatus status) {
}
```

`backend/src/main/java/com/edgepoint/privacy/dto/DataRequestCreate.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RequestType;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record DataRequestCreate(@NotNull RequestType type, String details, Map<String, String> correction) {
}
```

`backend/src/main/java/com/edgepoint/privacy/dto/ResolveRequest.java`
```java
package com.edgepoint.privacy.dto;

import com.edgepoint.privacy.domain.RequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolveRequest(@NotNull RequestStatus outcome, @NotBlank String note) {
}
```

`backend/src/main/java/com/edgepoint/privacy/dto/NoticeCreate.java`
```java
package com.edgepoint.privacy.dto;

import jakarta.validation.constraints.NotBlank;

public record NoticeCreate(@NotBlank String body) {
}
```

- [ ] **Step 4: Implement the principal controller**

`backend/src/main/java/com/edgepoint/privacy/controller/PrivacyController.java`
```java
package com.edgepoint.privacy.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.dto.*;
import com.edgepoint.privacy.service.ConsentService;
import com.edgepoint.privacy.service.DataRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/privacy")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Privacy", description = "Notice, consent and data-principal requests")
public class PrivacyController {

    private static final String PRINCIPALS = "hasAnyRole('STUDENT','TEACHER')";

    private final ConsentService consentService;
    private final DataRequestService requestService;

    @GetMapping("/notice/current")
    @Operation(summary = "Current privacy notice with my consent state")
    public ResponseEntity<ApiResponse<NoticeView>> currentNotice() {
        return ResponseEntity.ok(ApiResponse.success(consentService.currentNotice(), "Current privacy notice"));
    }

    @GetMapping("/consents/me")
    @Operation(summary = "My consent per purpose")
    public ResponseEntity<ApiResponse<List<PurposeView>>> myConsents() {
        return ResponseEntity.ok(ApiResponse.success(consentService.myConsents(), "Consents"));
    }

    @PostMapping("/consents")
    @Operation(summary = "Grant or withdraw consent for one purpose")
    public ResponseEntity<ApiResponse<PurposeView>> recordConsent(@Valid @RequestBody ConsentRequest body,
                                                                  HttpServletRequest http) {
        PurposeView view = consentService.recordConsent(body.purposeId(), body.status(), http.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success(view, "Consent recorded"));
    }

    @PostMapping("/requests")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "Raise an access, correction, erasure or grievance request")
    public ResponseEntity<ApiResponse<DataRequestView>> submit(@Valid @RequestBody DataRequestCreate body) {
        DataRequest saved = requestService.submit(body.type(), body.details(), body.correction());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(DataRequestView.from(saved), "Request submitted"));
    }

    @GetMapping("/requests/me")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "My requests, newest first")
    public ResponseEntity<ApiResponse<List<DataRequestView>>> myRequests() {
        List<DataRequestView> views = requestService.mine().stream().map(DataRequestView::from).toList();
        return ResponseEntity.ok(ApiResponse.success(views, "Requests"));
    }

    @GetMapping("/requests/{id}")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "One of my requests with its history")
    public ResponseEntity<ApiResponse<DataRequestDetail>> myRequest(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.detailMine(id), "Request"));
    }

    @PostMapping("/requests/{id}/cancel")
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "Cancel my request while it is still submitted")
    public ResponseEntity<ApiResponse<DataRequestView>> cancel(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(DataRequestView.from(requestService.cancel(id)), "Request cancelled"));
    }

    @GetMapping(value = "/requests/{id}/export", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize(PRINCIPALS)
    @Operation(summary = "Download the data bundle of my completed access request")
    public ResponseEntity<String> export(@PathVariable Integer id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"my-data-request-" + id + ".json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestService.exportFor(id));
    }
}
```

- [ ] **Step 5: Implement the admin controller**

`backend/src/main/java/com/edgepoint/privacy/controller/PrivacyAdminController.java`
```java
package com.edgepoint.privacy.controller;

import com.edgepoint.core.dto.ApiResponse;
import com.edgepoint.privacy.domain.*;
import com.edgepoint.privacy.dto.*;
import com.edgepoint.privacy.service.ConsentService;
import com.edgepoint.privacy.service.DataRequestService;
import com.edgepoint.privacy.service.PrivacyAuditService;
import com.edgepoint.privacy.service.RetentionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Reads are open to COLLEGEADMIN and SUPERADMIN (a SUPERADMIN names the college with ?collegeId=; a
 * COLLEGEADMIN always gets their own). Everything that changes data is COLLEGEADMIN only.
 */
@RestController
@RequestMapping("/privacy/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN','COLLEGEADMIN')")
@Tag(name = "Privacy admin", description = "Request queue, notices, retention and audit")
public class PrivacyAdminController {

    private static final String COLLEGE_ADMIN = "hasRole('COLLEGEADMIN')";

    private final DataRequestService requestService;
    private final ConsentService consentService;
    private final RetentionService retentionService;
    private final PrivacyAuditService auditService;

    @GetMapping("/requests")
    @Operation(summary = "Request queue, oldest due first")
    public ResponseEntity<ApiResponse<Page<DataRequestView>>> queue(
            @RequestParam(required = false) Integer collegeId,
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(defaultValue = "false") boolean overdue,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<DataRequestView> page = requestService.queue(collegeId, status, overdue, pageable).map(DataRequestView::from);
        return ResponseEntity.ok(ApiResponse.success(page, "Requests"));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "One request with its history")
    public ResponseEntity<ApiResponse<DataRequestDetail>> request(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(requestService.detailAdmin(id), "Request"));
    }

    @PostMapping("/requests/{id}/review")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Start reviewing a request and assign it to me")
    public ResponseEntity<ApiResponse<DataRequestView>> review(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success(DataRequestView.from(requestService.review(id)), "Request is in review"));
    }

    @PostMapping("/requests/{id}/resolve")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Complete, partially complete or reject a request in review")
    public ResponseEntity<ApiResponse<DataRequestView>> resolve(@PathVariable Integer id,
                                                                @Valid @RequestBody ResolveRequest body) {
        DataRequest resolved = requestService.resolve(id, body.outcome(), body.note());
        return ResponseEntity.ok(ApiResponse.success(DataRequestView.from(resolved), "Request " + resolved.getStatus()));
    }

    @GetMapping("/notices")
    @Operation(summary = "All notice versions, newest first")
    public ResponseEntity<ApiResponse<List<PrivacyNotice>>> notices(@RequestParam(required = false) Integer collegeId) {
        return ResponseEntity.ok(ApiResponse.success(consentService.listNotices(collegeId), "Notices"));
    }

    @PostMapping("/notices")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Publish a new notice version")
    public ResponseEntity<ApiResponse<PrivacyNotice>> publishNotice(@Valid @RequestBody NoticeCreate body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(consentService.publishNotice(body.body()), "Notice published"));
    }

    @GetMapping("/retention-policies")
    @Operation(summary = "Retention policies")
    public ResponseEntity<ApiResponse<List<RetentionPolicy>>> policies(@RequestParam(required = false) Integer collegeId) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.policies(collegeId), "Retention policies"));
    }

    @PutMapping("/retention-policies")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Update retention policies")
    public ResponseEntity<ApiResponse<List<RetentionPolicy>>> updatePolicies(
            @RequestBody List<RetentionPolicyUpdate> updates) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.updatePolicies(updates), "Retention policies updated"));
    }

    @PostMapping("/retention/run")
    @PreAuthorize(COLLEGE_ADMIN)
    @Operation(summary = "Run retention now; dry run unless dryRun=false")
    public ResponseEntity<ApiResponse<RetentionRun>> run(@RequestParam(defaultValue = "true") boolean dryRun) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.runNow(dryRun), dryRun ? "Dry run finished" : "Retention run finished"));
    }

    @GetMapping("/retention/runs")
    @Operation(summary = "Retention run history")
    public ResponseEntity<ApiResponse<Page<RetentionRun>>> runs(@RequestParam(required = false) Integer collegeId,
                                                               @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(retentionService.runs(collegeId, pageable), "Retention runs"));
    }

    @GetMapping("/audit")
    @Operation(summary = "Privacy audit trail, newest first")
    public ResponseEntity<ApiResponse<Page<PrivacyAuditLog>>> audit(@RequestParam(required = false) Integer collegeId,
                                                                   @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditService.search(collegeId, pageable), "Privacy audit"));
    }
}
```

- [ ] **Step 6: Run the security test, then every privacy test**

Run: `cd backend && mvn test -Dtest=PrivacySecurityTest`
Expected: PASS (11 tests). Two things commonly break here: (a) the mocked `consentService.currentNotice()` returns `null`, which `ApiResponse.success(null, ...)` accepts, so it still answers 200; (b) the invalid-body test needs `GlobalExceptionHandler` to map `MethodArgumentNotValidException` to 400. If it maps it to something else, assert what the handler actually returns and note it.

Run: `cd backend && mvn test -Dtest='com.edgepoint.privacy.**.*Test'`
Expected: every privacy test passes together, and the full `mvn test` shows no new failures versus the Task 0 baseline.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/edgepoint/privacy/dto backend/src/main/java/com/edgepoint/privacy/controller \
  backend/src/test/java/com/edgepoint/privacy/controller
git commit -m "Add privacy REST controllers with role checks

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Frontend test toolchain, privacy API module and query keys

The frontend has no test runner today (`package.json` has only `dev`, `build`, `lint`, `preview`). This task adds Vitest and Testing Library so the UI tasks can be built test-first.

**Files:**
- Modify: `frontend/package.json`, `frontend/package-lock.json` (via `npm install`)
- Create: `frontend/vitest.config.ts`, `frontend/src/test/setup.ts`, `frontend/src/test/renderWithProviders.tsx`, `frontend/src/test/smoke.test.tsx`
- Create: `frontend/src/api/privacy.ts`, `frontend/src/api/privacy.test.ts`
- Modify: `frontend/src/api/queryKeys.ts` (add `privacy` keys)
- Create: `frontend/src/lib/privacyLabels.ts`

**Interfaces:**
- Produces (used by Tasks 10–13): everything exported from `api/privacy.ts` (listed in Step 6), `queryKeys.privacy.*` (Step 7), `renderWithProviders(ui, { route? })`, and from `lib/privacyLabels.ts`: `REQUEST_TYPE_LABELS`, `STATUS_LABELS`, `CORRECTABLE_FIELDS`, `formatDate(iso)`.

- [ ] **Step 1: Write the failing smoke test**

`frontend/src/test/smoke.test.tsx`

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/common';

describe('test toolchain', () => {
  it('renders a component and supports jest-dom matchers', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/test/smoke.test.tsx`
Expected: FAIL — vitest is not installed (`npx` offers to download it or the command is not found). That is the red state.

- [ ] **Step 3: Install the toolchain and configure it**

```bash
cd frontend
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add to `scripts` in `frontend/package.json`: `"test": "vitest run"`.

`frontend/vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

`frontend/src/test/setup.ts`
```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

`frontend/src/test/renderWithProviders.tsx`
```tsx
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
```

- [ ] **Step 4: Run the smoke test**

Run: `cd frontend && npx vitest run src/test/smoke.test.tsx`
Expected: PASS. Then run `npm run build` and `npm run lint` and confirm the new files introduce no type or lint errors (`tsc -b` includes `src/test`).

- [ ] **Step 5: Write the failing API test**

`frontend/src/api/privacy.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './client';
import {
  cancelRequest, createRequest, downloadExport, getAdminRequests, getCurrentNotice, getMyRequests,
  publishNotice, recordConsent, resolveRequest, reviewRequest, runRetention, saveRetentionPolicies,
} from './privacy';

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const ok = (data: unknown) => ({ data: { success: true, message: '', timestamp: '', data } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiClient.get).mockResolvedValue(ok([]));
  vi.mocked(apiClient.post).mockResolvedValue(ok({}));
  vi.mocked(apiClient.put).mockResolvedValue(ok([]));
});

describe('privacy api', () => {
  it('reads the current notice and returns the unwrapped envelope', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(ok({ noticeId: 1 }));
    const res = await getCurrentNotice();
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/notice/current');
    expect(res.data).toEqual({ noticeId: 1 });
  });

  it('records a consent decision', async () => {
    await recordConsent(2, 'GRANTED');
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/consents', { purposeId: 2, status: 'GRANTED' });
  });

  it('creates, lists and cancels my requests', async () => {
    await createRequest({ type: 'GRIEVANCE', details: 'x' });
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/requests', { type: 'GRIEVANCE', details: 'x' });
    await getMyRequests();
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/requests/me');
    await cancelRequest(9);
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/requests/9/cancel');
  });

  it('downloads an export as a blob', async () => {
    const blob = new Blob(['{}']);
    vi.mocked(apiClient.get).mockResolvedValue({ data: blob });
    expect(await downloadExport(4)).toBe(blob);
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/requests/4/export', { responseType: 'blob' });
  });

  it('passes queue filters as query params and drops empty ones', async () => {
    await getAdminRequests({ status: 'IN_REVIEW', overdue: true, page: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/privacy/admin/requests', {
      params: { status: 'IN_REVIEW', overdue: true, page: 2 },
    });
    await getAdminRequests({});
    expect(apiClient.get).toHaveBeenLastCalledWith('/privacy/admin/requests', { params: {} });
  });

  it('reviews and resolves a request', async () => {
    await reviewRequest(3);
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/requests/3/review');
    await resolveRequest(3, { outcome: 'REJECTED', note: 'No' });
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/requests/3/resolve', { outcome: 'REJECTED', note: 'No' });
  });

  it('publishes a notice, saves policies and runs retention', async () => {
    await publishNotice('text');
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/notices', { body: 'text' });
    const policy = { dataCategory: 'ACCOUNT_RECORDS', retentionDays: 30, triggerEvent: 'ACCOUNT_DEACTIVATED' as const, action: 'ANONYMISE' as const, enabled: true };
    await saveRetentionPolicies([policy]);
    expect(apiClient.put).toHaveBeenCalledWith('/privacy/admin/retention-policies', [policy]);
    await runRetention(true);
    expect(apiClient.post).toHaveBeenCalledWith('/privacy/admin/retention/run', null, { params: { dryRun: true } });
  });
});
```

- [ ] **Step 6: Run it and see it fail, then implement the module**

Run: `cd frontend && npx vitest run src/api/privacy.test.ts`
Expected: FAIL — `./privacy` does not exist.

`frontend/src/api/privacy.ts`
```ts
import { apiClient } from './client';
import type { ApiResponse } from './notificationConfig';

export type LegalBasis = 'CONSENT' | 'LEGITIMATE_USE';
export type ConsentStatus = 'GRANTED' | 'WITHDRAWN';
export type RequestType = 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'GRIEVANCE';
export type RequestStatus =
  | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'REJECTED' | 'CANCELLED';
export type ResolveOutcome = 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'REJECTED';

// Shapes match com.edgepoint.privacy.dto.* and the entities returned by PrivacyAdminController.
export interface PurposeView {
  purposeId: number;
  code: string;
  name: string;
  description: string | null;
  legalBasis: LegalBasis;
  withdrawable: boolean;
  status: ConsentStatus | null;
  recordedAt: string | null;
}

export interface NoticeView {
  noticeId: number | null;
  version: number | null;
  body: string | null;
  effectiveFrom: string | null;
  requiresAction: boolean;
  purposes: PurposeView[];
}

export interface DataRequestView {
  requestId: number;
  userId: number;
  type: RequestType;
  status: RequestStatus;
  details: string | null;
  submittedAt: string;
  dueAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  overdue: boolean;
}

export interface RequestEventView {
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  actorId: number | null;
  note: string | null;
  occurredAt: string;
}

export interface DataRequestDetail {
  request: DataRequestView;
  correctionPayload: string | null;
  events: RequestEventView[];
}

export interface CreateRequestBody {
  type: RequestType;
  details?: string;
  correction?: Record<string, string>;
}

export interface PrivacyNotice {
  noticeId: number;
  collegeId: number;
  version: number;
  body: string;
  effectiveFrom: string;
  publishedBy: number | null;
}

export interface RetentionPolicyInput {
  dataCategory: string;
  retentionDays: number;
  triggerEvent: 'ACCOUNT_DEACTIVATED';
  action: 'ANONYMISE';
  enabled: boolean;
}

export interface RetentionPolicy extends RetentionPolicyInput {
  policyId: number;
  collegeId: number;
}

export interface RetentionRun {
  runId: number;
  collegeId: number;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  recordsProcessed: number;
  recordsFailed: number;
}

export interface PrivacyAuditEntry {
  auditId: number;
  collegeId: number;
  actorId: number | null;
  subjectUserId: number | null;
  action: string;
  details: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface QueueFilters {
  status?: RequestStatus;
  overdue?: boolean;
  page?: number;
}

type Envelope<T> = Promise<ApiResponse<T>>;

// ---- principal side
export async function getCurrentNotice(): Envelope<NoticeView> {
  const { data } = await apiClient.get<ApiResponse<NoticeView>>('/privacy/notice/current');
  return data;
}

export async function recordConsent(purposeId: number, status: ConsentStatus): Envelope<PurposeView> {
  const { data } = await apiClient.post<ApiResponse<PurposeView>>('/privacy/consents', { purposeId, status });
  return data;
}

export async function createRequest(body: CreateRequestBody): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>('/privacy/requests', body);
  return data;
}

export async function getMyRequests(): Envelope<DataRequestView[]> {
  const { data } = await apiClient.get<ApiResponse<DataRequestView[]>>('/privacy/requests/me');
  return data;
}

export async function getMyRequest(id: number): Envelope<DataRequestDetail> {
  const { data } = await apiClient.get<ApiResponse<DataRequestDetail>>(`/privacy/requests/${id}`);
  return data;
}

export async function cancelRequest(id: number): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>(`/privacy/requests/${id}/cancel`);
  return data;
}

export async function downloadExport(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/privacy/requests/${id}/export`, { responseType: 'blob' });
  return data;
}

// ---- admin side
export async function getAdminRequests(filters: QueueFilters): Envelope<Page<DataRequestView>> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.status) params.status = filters.status;
  if (filters.overdue) params.overdue = true;
  if (filters.page) params.page = filters.page;
  const { data } = await apiClient.get<ApiResponse<Page<DataRequestView>>>('/privacy/admin/requests', { params });
  return data;
}

export async function getAdminRequest(id: number): Envelope<DataRequestDetail> {
  const { data } = await apiClient.get<ApiResponse<DataRequestDetail>>(`/privacy/admin/requests/${id}`);
  return data;
}

export async function reviewRequest(id: number): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>(`/privacy/admin/requests/${id}/review`);
  return data;
}

export async function resolveRequest(
  id: number,
  body: { outcome: ResolveOutcome; note: string },
): Envelope<DataRequestView> {
  const { data } = await apiClient.post<ApiResponse<DataRequestView>>(`/privacy/admin/requests/${id}/resolve`, body);
  return data;
}

export async function getNotices(): Envelope<PrivacyNotice[]> {
  const { data } = await apiClient.get<ApiResponse<PrivacyNotice[]>>('/privacy/admin/notices');
  return data;
}

export async function publishNotice(body: string): Envelope<PrivacyNotice> {
  const { data } = await apiClient.post<ApiResponse<PrivacyNotice>>('/privacy/admin/notices', { body });
  return data;
}

export async function getRetentionPolicies(): Envelope<RetentionPolicy[]> {
  const { data } = await apiClient.get<ApiResponse<RetentionPolicy[]>>('/privacy/admin/retention-policies');
  return data;
}

export async function saveRetentionPolicies(policies: RetentionPolicyInput[]): Envelope<RetentionPolicy[]> {
  const { data } = await apiClient.put<ApiResponse<RetentionPolicy[]>>('/privacy/admin/retention-policies', policies);
  return data;
}

export async function runRetention(dryRun: boolean): Envelope<RetentionRun> {
  const { data } = await apiClient.post<ApiResponse<RetentionRun>>('/privacy/admin/retention/run', null, {
    params: { dryRun },
  });
  return data;
}

export async function getRetentionRuns(): Envelope<Page<RetentionRun>> {
  const { data } = await apiClient.get<ApiResponse<Page<RetentionRun>>>('/privacy/admin/retention/runs');
  return data;
}

export async function getPrivacyAudit(page: number): Envelope<Page<PrivacyAuditEntry>> {
  const { data } = await apiClient.get<ApiResponse<Page<PrivacyAuditEntry>>>('/privacy/admin/audit', {
    params: page ? { page } : {},
  });
  return data;
}
```

Run: `cd frontend && npx vitest run src/api/privacy.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Add the query keys and the label helpers**

In `frontend/src/api/queryKeys.ts`, add inside the `queryKeys` object (next to the other resources, keeping `as const` style; read the file's end first, because other work may have edited it):

```ts
  privacy: {
    notice: ['privacy', 'notice'] as const,
    myRequests: ['privacy', 'requests', 'me'] as const,
    myRequest: (id: number) => ['privacy', 'requests', 'me', id] as const,
    adminRequests: (filters: object) => ['privacy', 'admin', 'requests', filters] as const,
    adminRequest: (id: number) => ['privacy', 'admin', 'requests', id] as const,
    notices: ['privacy', 'admin', 'notices'] as const,
    policies: ['privacy', 'admin', 'policies'] as const,
    runs: ['privacy', 'admin', 'runs'] as const,
    audit: (page: number) => ['privacy', 'admin', 'audit', page] as const,
  },
```

Every privacy mutation invalidates the whole `['privacy']` prefix.

`frontend/src/lib/privacyLabels.ts`
```ts
import type { RequestStatus, RequestType } from '../api/privacy';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ACCESS: 'Access my data',
  CORRECTION: 'Correct my data',
  ERASURE: 'Erase my data',
  GRIEVANCE: 'Raise a grievance',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In review',
  COMPLETED: 'Completed',
  PARTIALLY_COMPLETED: 'Partially completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

interface FieldOption {
  value: string;
  label: string;
}

const NAME_AND_PHONE: FieldOption[] = [
  { value: 'fullName', label: 'Full name' },
  { value: 'phone', label: 'Phone' },
];

/** Mirrors the backend contributors' correctable fields, per role. */
export const CORRECTABLE_FIELDS: Record<string, FieldOption[]> = {
  STUDENT: [
    ...NAME_AND_PHONE,
    { value: 'parentName', label: 'Parent or guardian name' },
    { value: 'parentPhone', label: 'Parent or guardian phone' },
    { value: 'parentEmail', label: 'Parent or guardian email' },
    { value: 'address', label: 'Address' },
  ],
  TEACHER: NAME_AND_PHONE,
};

export function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}
```

- [ ] **Step 8: Verify and commit**

Run: `cd frontend && npx vitest run && npm run build && npm run lint`
Expected: all green (7 + 1 tests), no type or lint errors.

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/test frontend/src/api/privacy.ts \
  frontend/src/api/privacy.test.ts frontend/src/api/queryKeys.ts frontend/src/lib/privacyLabels.ts
git commit -m "Add vitest toolchain, privacy API client and query keys

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Consent gate

**Files:**
- Create: `frontend/src/components/privacy/ConsentGate.tsx`
- Test: `frontend/src/components/privacy/ConsentGate.test.tsx`

**Interfaces:**
- Consumes: `getCurrentNotice`, `recordConsent`, `PurposeView` (Task 9), `useAuthStore` (`user.roleName`), `Modal`, `Button`, `queryKeys.privacy.notice`, `getErrorMessage`.
- Produces: `export function ConsentGate(): JSX.Element | null` — renders nothing unless the signed-in user is a `STUDENT` or `TEACHER` and the notice says `requiresAction`; then shows a modal that cannot be dismissed, with one checkbox per withdrawable consent purpose (unticked by default), and on save records `GRANTED` for ticked boxes and for non-withdrawable consent purposes, `WITHDRAWN` for the rest.

- [ ] **Step 1: Write the failing test**

`frontend/src/components/privacy/ConsentGate.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentGate } from './ConsentGate';
import { renderWithProviders } from '../../test/renderWithProviders';
import { useAuthStore } from '../../store/authStore';
import * as privacy from '../../api/privacy';

vi.mock('../../api/privacy');

const purposes = [
  { purposeId: 1, code: 'ACADEMIC_RECORDS', name: 'Academic records', description: 'Needed to run your course.', legalBasis: 'LEGITIMATE_USE', withdrawable: false, status: null, recordedAt: null },
  { purposeId: 2, code: 'EMAIL_SMS_COMMS', name: 'Email and SMS communications', description: 'Notices by email or SMS.', legalBasis: 'CONSENT', withdrawable: true, status: null, recordedAt: null },
  { purposeId: 3, code: 'PARENT_NOTIFICATIONS', name: 'Notifications to parent or guardian', description: 'Alerts to your guardian.', legalBasis: 'CONSENT', withdrawable: true, status: null, recordedAt: null },
];

function notice(requiresAction: boolean) {
  return {
    success: true, message: '', timestamp: '',
    data: { noticeId: 10, version: 2, body: 'We process your data to run the college.', effectiveFrom: '2026-10-01T00:00:00', requiresAction, purposes },
  };
}

function signInAs(roleName: string) {
  useAuthStore.setState({ user: { roleName } as never, isAuthenticated: true });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.recordConsent).mockResolvedValue({ success: true, message: '', timestamp: '', data: purposes[1] } as never);
});

describe('ConsentGate', () => {
  it('stays out of the way of roles that are not data principals', async () => {
    signInAs('COLLEGEADMIN');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);

    renderWithProviders(<ConsentGate />);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(privacy.getCurrentNotice).not.toHaveBeenCalled();
    expect(screen.queryByText(/We process your data/)).not.toBeInTheDocument();
  });

  it('shows nothing when no answer is needed', async () => {
    signInAs('STUDENT');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(false) as never);

    renderWithProviders(<ConsentGate />);

    await waitFor(() => expect(privacy.getCurrentNotice).toHaveBeenCalled());
    expect(screen.queryByText(/We process your data/)).not.toBeInTheDocument();
  });

  it('presents the notice with an unticked box per consent purpose and no box for required processing', async () => {
    signInAs('STUDENT');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);

    renderWithProviders(<ConsentGate />);

    expect(await screen.findByText('We process your data to run the college.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Email and SMS communications/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Notifications to parent or guardian/ })).not.toBeChecked();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.getByText('Academic records')).toBeInTheDocument();
  });

  it('records an explicit answer for every consent purpose and nothing for required processing', async () => {
    const user = userEvent.setup();
    signInAs('TEACHER');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);
    renderWithProviders(<ConsentGate />);

    await user.click(await screen.findByRole('checkbox', { name: /Email and SMS communications/ }));
    await user.click(screen.getByRole('button', { name: 'Save my choices' }));

    await waitFor(() => expect(privacy.recordConsent).toHaveBeenCalledTimes(2));
    expect(privacy.recordConsent).toHaveBeenCalledWith(2, 'GRANTED');
    expect(privacy.recordConsent).toHaveBeenCalledWith(3, 'WITHDRAWN');
    expect(privacy.recordConsent).not.toHaveBeenCalledWith(1, expect.anything());
  });

  it('shows the server error and keeps the gate closed to the app when saving fails', async () => {
    const user = userEvent.setup();
    signInAs('STUDENT');
    vi.mocked(privacy.getCurrentNotice).mockResolvedValue(notice(true) as never);
    vi.mocked(privacy.recordConsent).mockRejectedValue(new Error('Server unavailable'));
    renderWithProviders(<ConsentGate />);

    await user.click(await screen.findByRole('button', { name: 'Save my choices' }));

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(screen.getByText('We process your data to run the college.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/components/privacy/ConsentGate.test.tsx`
Expected: FAIL — `./ConsentGate` does not exist.

- [ ] **Step 3: Implement**

`frontend/src/components/privacy/ConsentGate.tsx`
```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal } from '../common';
import { useAuthStore } from '../../store/authStore';
import { getCurrentNotice, recordConsent, type PurposeView } from '../../api/privacy';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

const PRINCIPAL_ROLES = ['STUDENT', 'TEACHER'];

/**
 * Blocks the app with the privacy notice until a student or teacher has answered every consent purpose
 * under the latest notice version. Nothing is pre-ticked.
 */
export function ConsentGate() {
  const roleName = useAuthStore((s) => s.user?.roleName);
  const isPrincipal = !!roleName && PRINCIPAL_ROLES.includes(roleName);
  const queryClient = useQueryClient();
  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.privacy.notice,
    queryFn: getCurrentNotice,
    enabled: isPrincipal,
  });
  const notice = data?.data;

  const save = useMutation({
    mutationFn: async (asked: PurposeView[]) => {
      for (const purpose of asked) {
        const granted = !purpose.withdrawable || ticked[purpose.purposeId] === true;
        await recordConsent(purpose.purposeId, granted ? 'GRANTED' : 'WITHDRAWN');
      }
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
    },
    onError: (err) => setError(getErrorMessage(err).message),
  });

  if (!isPrincipal || !notice?.requiresAction) return null;

  const asked = notice.purposes.filter((p) => p.legalBasis === 'CONSENT');
  const required = notice.purposes.filter((p) => p.legalBasis !== 'CONSENT');

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      closeOnOverlayClick={false}
      size="lg"
      title={`Privacy notice (version ${notice.version})`}
      footer={
        <Button onClick={() => save.mutate(asked)} isLoading={save.isPending}>
          Save my choices
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-slate-700">
        <p className="whitespace-pre-line">{notice.body}</p>

        {required.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900">Needed to run your enrolment</h4>
            <ul className="mt-1 list-disc pl-5">
              {required.map((p) => (
                <li key={p.purposeId}>
                  <span className="font-medium">{p.name}</span>
                  {p.description ? `: ${p.description}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {asked.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900">Your choices</h4>
            <ul className="mt-1 space-y-2">
              {asked.map((p) => (
                <li key={p.purposeId}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!p.withdrawable || ticked[p.purposeId] === true}
                      disabled={!p.withdrawable}
                      onChange={(e) => setTicked((prev) => ({ ...prev, [p.purposeId]: e.target.checked }))}
                    />
                    <span>
                      <span className="font-medium">{p.name}</span>
                      {p.description ? <span className="block text-slate-500">{p.description}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">You can change these choices later on the My Privacy page.</p>
          </div>
        )}

        {error && <p role="alert" className="text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `cd frontend && npx vitest run src/components/privacy/ConsentGate.test.tsx`
Expected: PASS (5 tests). If a query by role fails because `Modal` hides content from the accessibility tree, switch that assertion to `getByLabelText` / `getByText` rather than loosening what is asserted.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/privacy
git commit -m "Add privacy consent gate

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: "My Privacy" page (students and teachers)

**Files:**
- Create: `frontend/src/components/privacy/StatusBadge.tsx`
- Create: `frontend/src/pages/MyPrivacyPage.tsx`
- Test: `frontend/src/pages/MyPrivacyPage.test.tsx`

**Interfaces:**
- Consumes: Task 9's API functions, `queryKeys.privacy.*`, `REQUEST_TYPE_LABELS`, `STATUS_LABELS`, `CORRECTABLE_FIELDS`, `formatDate`; `useAuthStore`; UI kit `Button, Card, Input, Loading, Modal, Select, Textarea` from `../components/common` (check that `Input` takes a `label` prop like `Select` and `Textarea`; adapt the JSX if it does not).
- Produces: `export function MyPrivacyPage()` and `export function StatusBadge({ status }: { status: RequestStatus })` (reused by Task 12).

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/MyPrivacyPage.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyPrivacyPage } from './MyPrivacyPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { useAuthStore } from '../store/authStore';
import * as privacy from '../api/privacy';

vi.mock('../api/privacy');

const envelope = (data: unknown) => ({ success: true, message: '', timestamp: '', data }) as never;

const base = {
  userId: 5, details: null, resolvedAt: null, resolutionNote: null, overdue: false,
  submittedAt: '2026-10-01T10:00:00', dueAt: '2026-10-31T10:00:00',
};

const requests = [
  { ...base, requestId: 1, type: 'ACCESS', status: 'SUBMITTED' },
  { ...base, requestId: 2, type: 'ACCESS', status: 'COMPLETED' },
  { ...base, requestId: 3, type: 'ERASURE', status: 'IN_REVIEW' },
];

const notice = {
  noticeId: 10, version: 2, body: 'Notice text', effectiveFrom: '2026-10-01T00:00:00', requiresAction: false,
  purposes: [
    { purposeId: 1, code: 'ACADEMIC_RECORDS', name: 'Academic records', description: null, legalBasis: 'LEGITIMATE_USE', withdrawable: false, status: null, recordedAt: null },
    { purposeId: 2, code: 'EMAIL_SMS_COMMS', name: 'Email and SMS communications', description: null, legalBasis: 'CONSENT', withdrawable: true, status: 'GRANTED', recordedAt: '2026-10-02T00:00:00' },
    { purposeId: 3, code: 'PARENT_NOTIFICATIONS', name: 'Notifications to parent or guardian', description: null, legalBasis: 'CONSENT', withdrawable: true, status: null, recordedAt: null },
  ],
};

function signInAs(roleName: string) {
  useAuthStore.setState({ user: { roleName } as never, isAuthenticated: true });
}

beforeEach(() => {
  vi.resetAllMocks();
  signInAs('STUDENT');
  vi.mocked(privacy.getCurrentNotice).mockResolvedValue(envelope(notice));
  vi.mocked(privacy.getMyRequests).mockResolvedValue(envelope(requests));
  vi.mocked(privacy.createRequest).mockResolvedValue(envelope(requests[0]));
  vi.mocked(privacy.recordConsent).mockResolvedValue(envelope(notice.purposes[1]));
  vi.mocked(privacy.cancelRequest).mockResolvedValue(envelope(requests[0]));
});

describe('MyPrivacyPage', () => {
  it('lists my requests with their status and offers only the actions that apply', async () => {
    renderWithProviders(<MyPrivacyPage />);

    expect(await screen.findByText(/^Request #1 ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Request #2 ·/)).toBeInTheDocument();
    expect(screen.getByText(/^Request #3 ·/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Cancel request' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Download my data' })).toHaveLength(1);
  });

  it('cancels a submitted request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.click(await screen.findByRole('button', { name: 'Cancel request' }));

    await waitFor(() => expect(privacy.cancelRequest).toHaveBeenCalledWith(1));
  });

  it('does not submit a grievance without a description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'GRIEVANCE');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));

    expect(await screen.findByText('Please describe your grievance')).toBeInTheDocument();
    expect(privacy.createRequest).not.toHaveBeenCalled();
  });

  it('submits a correction with the chosen field and value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'CORRECTION');
    await user.selectOptions(screen.getByLabelText('Field to correct'), 'phone');
    await user.type(screen.getByLabelText('New value'), '8888888888');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));

    await waitFor(() =>
      expect(privacy.createRequest).toHaveBeenCalledWith({ type: 'CORRECTION', correction: { phone: '8888888888' } }),
    );
  });

  it('refuses a correction with an empty value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'CORRECTION');
    await user.click(screen.getByRole('button', { name: 'Submit request' }));

    expect(await screen.findByText('Enter the new value')).toBeInTheDocument();
    expect(privacy.createRequest).not.toHaveBeenCalled();
  });

  it('offers a teacher only the fields a teacher can correct', async () => {
    signInAs('TEACHER');
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'CORRECTION');

    const options = within(screen.getByLabelText('Field to correct')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Full name', 'Phone']);
  });

  it('tells an erasure requester that academic records are kept', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.selectOptions(await screen.findByLabelText('Request type'), 'ERASURE');

    expect(screen.getByText(/marks and attendance are kept/i)).toBeInTheDocument();
  });

  it('lets me withdraw a granted consent and give a missing one', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyPrivacyPage />);

    await user.click(await screen.findByRole('button', { name: 'Withdraw consent: Email and SMS communications' }));
    await waitFor(() => expect(privacy.recordConsent).toHaveBeenCalledWith(2, 'WITHDRAWN'));

    await user.click(screen.getByRole('button', { name: 'Give consent: Notifications to parent or guardian' }));
    await waitFor(() => expect(privacy.recordConsent).toHaveBeenCalledWith(3, 'GRANTED'));
  });

  it('shows required processing without any switch', async () => {
    renderWithProviders(<MyPrivacyPage />);
    expect(await screen.findByText('Academic records')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /consent: Academic records/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/pages/MyPrivacyPage.test.tsx`
Expected: FAIL — `./MyPrivacyPage` does not exist.

- [ ] **Step 3: Implement the badge**

`frontend/src/components/privacy/StatusBadge.tsx`
```tsx
import type { RequestStatus } from '../../api/privacy';
import { STATUS_LABELS } from '../../lib/privacyLabels';

const STYLES: Record<RequestStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700',
  IN_REVIEW: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  PARTIALLY_COMPLETED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 4: Implement the page**

`frontend/src/pages/MyPrivacyPage.tsx`
```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Loading, Modal, Select, Textarea } from '../components/common';
import { StatusBadge } from '../components/privacy/StatusBadge';
import { useAuthStore } from '../store/authStore';
import {
  cancelRequest, createRequest, downloadExport, getCurrentNotice, getMyRequest, getMyRequests, recordConsent,
  type ConsentStatus, type DataRequestView, type RequestType,
} from '../api/privacy';
import { getErrorMessage } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { CORRECTABLE_FIELDS, REQUEST_TYPE_LABELS, formatDate } from '../lib/privacyLabels';

const TYPE_OPTIONS = (Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((value) => ({
  value,
  label: REQUEST_TYPE_LABELS[value],
}));

export function MyPrivacyPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((s) => s.user?.roleName ?? '');
  const fields = CORRECTABLE_FIELDS[roleName] ?? CORRECTABLE_FIELDS.TEACHER;

  const notice = useQuery({ queryKey: queryKeys.privacy.notice, queryFn: getCurrentNotice });
  const requests = useQuery({ queryKey: queryKeys.privacy.myRequests, queryFn: getMyRequests });

  const [type, setType] = useState<RequestType>('ACCESS');
  const [details, setDetails] = useState('');
  const [field, setField] = useState(fields[0].value);
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['privacy'] });
  const onError = (err: unknown) => setPageError(getErrorMessage(err).message);

  const submit = useMutation({
    mutationFn: createRequest,
    onSuccess: () => {
      setDetails('');
      setValue('');
      setFormError(null);
      setPageError(null);
      refresh();
    },
    onError: (err) => setFormError(getErrorMessage(err).message),
  });
  const consent = useMutation({
    mutationFn: ({ purposeId, status }: { purposeId: number; status: ConsentStatus }) => recordConsent(purposeId, status),
    onSuccess: () => { setPageError(null); refresh(); },
    onError,
  });
  const cancel = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => { setPageError(null); refresh(); },
    onError,
  });

  const handleSubmit = () => {
    setFormError(null);
    if (type === 'GRIEVANCE' && !details.trim()) {
      setFormError('Please describe your grievance');
      return;
    }
    if (type === 'CORRECTION' && !value.trim()) {
      setFormError('Enter the new value');
      return;
    }
    submit.mutate({
      type,
      details: details.trim() || undefined,
      correction: type === 'CORRECTION' ? { [field]: value.trim() } : undefined,
    });
  };

  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadExport(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-request-${id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      onError(err);
    }
  };

  const purposes = notice.data?.data.purposes ?? [];

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Privacy</h1>
        <p className="text-sm text-slate-500">Control how your personal data is used and ask the college about it.</p>
      </div>

      {pageError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{pageError}</p>}

      <Card title="Your consents" description={notice.data?.data.version ? `Privacy notice version ${notice.data.data.version}` : undefined}>
        {notice.isLoading ? (
          <Loading />
        ) : (
          <ul className="divide-y divide-slate-100">
            {purposes.map((p) => (
              <li key={p.purposeId} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
                </div>
                {p.legalBasis !== 'CONSENT' || !p.withdrawable ? (
                  <span className="text-sm text-slate-500">Required for your enrolment</span>
                ) : p.status === 'GRANTED' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Withdraw consent: ${p.name}`}
                    onClick={() => consent.mutate({ purposeId: p.purposeId, status: 'WITHDRAWN' })}
                  >
                    Withdraw
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    aria-label={`Give consent: ${p.name}`}
                    onClick={() => consent.mutate({ purposeId: p.purposeId, status: 'GRANTED' })}
                  >
                    Give consent
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Make a request" description="The college must respond by the due date shown on your request.">
        <div className="space-y-4">
          <Select
            label="Request type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => { setType(e.target.value as RequestType); setFormError(null); }}
          />
          {type === 'CORRECTION' && (
            <>
              <Select label="Field to correct" options={fields} value={field} onChange={(e) => setField(e.target.value)} />
              <Input label="New value" value={value} onChange={(e) => setValue(e.target.value)} />
            </>
          )}
          {type === 'ERASURE' && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Your identity is removed from your account, but your marks and attendance are kept without your name
              because the college must retain academic records.
            </p>
          )}
          <Textarea
            label={type === 'GRIEVANCE' ? 'Describe your grievance' : 'Details (optional)'}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <Button onClick={handleSubmit} isLoading={submit.isPending}>Submit request</Button>
        </div>
      </Card>

      <Card title="Your requests">
        {requests.isLoading ? (
          <Loading />
        ) : (requests.data?.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">You have not made any requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(requests.data?.data ?? []).map((r: DataRequestView) => (
              <li key={r.requestId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-900">
                    Request #{r.requestId} · {REQUEST_TYPE_LABELS[r.type]}
                  </p>
                  <p className="text-sm text-slate-500">
                    Submitted {formatDate(r.submittedAt)} · Response due {formatDate(r.dueAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <Button size="sm" variant="ghost" onClick={() => setHistoryId(r.requestId)}>History</Button>
                  {r.status === 'SUBMITTED' && (
                    <Button size="sm" variant="outline" onClick={() => cancel.mutate(r.requestId)}>Cancel request</Button>
                  )}
                  {r.type === 'ACCESS' && r.status === 'COMPLETED' && (
                    <Button size="sm" onClick={() => handleDownload(r.requestId)}>Download my data</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {historyId !== null && <HistoryModal requestId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}

function HistoryModal({ requestId, onClose }: { requestId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.privacy.myRequest(requestId),
    queryFn: () => getMyRequest(requestId),
  });
  const detail = data?.data;
  return (
    <Modal isOpen onClose={onClose} title={`Request #${requestId} history`}>
      {isLoading || !detail ? (
        <Loading />
      ) : (
        <ol className="space-y-2 text-sm">
          {detail.events.map((e, i) => (
            <li key={i}>
              <span className="font-medium">{e.toStatus.replace('_', ' ').toLowerCase()}</span>
              <span className="text-slate-500"> · {formatDate(e.occurredAt)}</span>
              {e.note && <p className="text-slate-600">{e.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
```

- [ ] **Step 5: Run the test**

Run: `cd frontend && npx vitest run src/pages/MyPrivacyPage.test.tsx`
Expected: PASS (9 tests). Then `npm run build && npm run lint` for type and lint errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/privacy/StatusBadge.tsx frontend/src/pages/MyPrivacyPage.tsx frontend/src/pages/MyPrivacyPage.test.tsx
git commit -m "Add My Privacy page for students and teachers

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: College-admin Privacy area

**Files** (all under `frontend/src/pages/collegeadmin/`):
- Create: `privacy/PrivacyRequestsTab.tsx`, `privacy/PrivacyRequestDetailPage.tsx`, `privacy/PrivacyNoticeTab.tsx`, `privacy/PrivacyRetentionTab.tsx`, `privacy/PrivacyAuditTab.tsx`, `PrivacyAdminPage.tsx`
- Test: `privacy/PrivacyRequestsTab.test.tsx`, `privacy/PrivacyRequestDetailPage.test.tsx`, `privacy/PrivacyNoticeTab.test.tsx`, `privacy/PrivacyRetentionTab.test.tsx`, `privacy/PrivacyAuditTab.test.tsx`, `PrivacyAdminPage.test.tsx`

**Interfaces:**
- Consumes: Task 9 API functions and types, `StatusBadge` (Task 11), `queryKeys.privacy.*`, labels, UI kit (`Button, Card, Input, Loading, Select, Textarea`).
- Produces: `PrivacyAdminPage` (tabs: Requests, Privacy notice, Retention, Audit log), `PrivacyRequestDetailPage` (route param `:id`), and the four tab components, each a named export with no props. The detail page links back to `/privacy-admin`; the queue links each row to `/privacy-admin/requests/{id}`.

Build the subtasks in this order; each one is red, green, commit.

#### 12a. Request queue tab

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/collegeadmin/privacy/PrivacyRequestsTab.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyRequestsTab } from './PrivacyRequestsTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const page = (content: unknown[]) =>
  ({ success: true, message: '', timestamp: '', data: { content, totalElements: content.length, totalPages: 1, number: 0, size: 20 } }) as never;

const row = (requestId: number, overrides: object = {}) => ({
  requestId, userId: 40 + requestId, type: 'ERASURE', status: 'SUBMITTED', details: null,
  submittedAt: '2026-09-01T10:00:00', dueAt: '2026-10-01T10:00:00', resolvedAt: null, resolutionNote: null, overdue: false,
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getAdminRequests).mockResolvedValue(page([row(1, { overdue: true }), row(2)]));
});

describe('PrivacyRequestsTab', () => {
  it('lists requests, flags only the overdue ones and links to the detail page', async () => {
    renderWithProviders(<PrivacyRequestsTab />);

    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getAllByText('Overdue')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'Open' })[0]).toHaveAttribute('href', '/privacy-admin/requests/1');
  });

  it('filters by status and by overdue', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRequestsTab />);
    await screen.findByText('#1');

    await user.selectOptions(screen.getByLabelText('Status'), 'IN_REVIEW');
    await waitFor(() =>
      expect(privacy.getAdminRequests).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'IN_REVIEW' })),
    );

    await user.click(screen.getByLabelText('Overdue only'));
    await waitFor(() =>
      expect(privacy.getAdminRequests).toHaveBeenLastCalledWith(expect.objectContaining({ overdue: true })),
    );
  });

  it('says so when there is nothing to show', async () => {
    vi.mocked(privacy.getAdminRequests).mockResolvedValue(page([]));
    renderWithProviders(<PrivacyRequestsTab />);
    expect(await screen.findByText('No requests match these filters.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyRequestsTab.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

`frontend/src/pages/collegeadmin/privacy/PrivacyRequestsTab.tsx`
```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Loading, Select } from '../../../components/common';
import { StatusBadge } from '../../../components/privacy/StatusBadge';
import { getAdminRequests, type RequestStatus } from '../../../api/privacy';
import { queryKeys } from '../../../api/queryKeys';
import { REQUEST_TYPE_LABELS, STATUS_LABELS, formatDate } from '../../../lib/privacyLabels';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...(Object.keys(STATUS_LABELS) as RequestStatus[]).map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export function PrivacyRequestsTab() {
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [overdue, setOverdue] = useState(false);
  const [page, setPage] = useState(0);
  const filters = { status: status || undefined, overdue, page };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.privacy.adminRequests(filters),
    queryFn: () => getAdminRequests(filters),
  });
  const rows = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  return (
    <Card title="Request queue" description="Oldest due date first. Overdue requests are flagged.">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value as RequestStatus | ''); setPage(0); }}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => { setOverdue(e.target.checked); setPage(0); }}
          />
          Overdue only
        </label>
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No requests match these filters.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Request</th>
              <th>Type</th>
              <th>Requester</th>
              <th>Status</th>
              <th>Due</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.requestId}>
                <td className="py-2 font-medium">#{r.requestId}</td>
                <td>{REQUEST_TYPE_LABELS[r.type]}</td>
                <td>User {r.userId}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {formatDate(r.dueAt)}
                  {r.overdue && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Overdue</span>
                  )}
                </td>
                <td className="text-right">
                  <Link className="font-semibold text-[#9c6b1a] hover:underline" to={`/privacy-admin/requests/${r.requestId}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </Card>
  );
}
```

- [ ] **Step 4: Run, then commit**

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyRequestsTab.test.tsx` → Expected PASS (3 tests).

```bash
git add frontend/src/pages/collegeadmin/privacy/PrivacyRequestsTab.tsx frontend/src/pages/collegeadmin/privacy/PrivacyRequestsTab.test.tsx
git commit -m "Add privacy request queue tab

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

#### 12b. Request detail page

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/collegeadmin/privacy/PrivacyRequestDetailPage.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { PrivacyRequestDetailPage } from './PrivacyRequestDetailPage';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

function detail(overrides: object = {}, extra: object = {}) {
  return {
    success: true, message: '', timestamp: '',
    data: {
      request: {
        requestId: 5, userId: 42, type: 'ACCESS', status: 'IN_REVIEW', details: 'Please send my data',
        submittedAt: '2026-10-01T10:00:00', dueAt: '2026-10-31T10:00:00', resolvedAt: null, resolutionNote: null, overdue: false,
        ...overrides,
      },
      correctionPayload: null,
      events: [{ fromStatus: null, toStatus: 'SUBMITTED', actorId: 42, note: null, occurredAt: '2026-10-01T10:00:00' }],
      ...extra,
    },
  } as never;
}

function show() {
  return renderWithProviders(
    <Routes><Route path="/privacy-admin/requests/:id" element={<PrivacyRequestDetailPage />} /></Routes>,
    { route: '/privacy-admin/requests/5' },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.reviewRequest).mockResolvedValue({ success: true, message: '', timestamp: '', data: {} } as never);
  vi.mocked(privacy.resolveRequest).mockResolvedValue({ success: true, message: '', timestamp: '', data: {} } as never);
});

describe('PrivacyRequestDetailPage', () => {
  it('lets the admin start a review of a submitted request and offers no resolution yet', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ status: 'SUBMITTED' }));
    const user = userEvent.setup();
    show();

    await user.click(await screen.findByRole('button', { name: 'Start review' }));

    await waitFor(() => expect(privacy.reviewRequest).toHaveBeenCalledWith(5));
    expect(screen.queryByRole('button', { name: 'Resolve request' })).not.toBeInTheDocument();
  });

  it('requires a note before resolving and then sends the chosen outcome', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    const user = userEvent.setup();
    show();

    const resolve = await screen.findByRole('button', { name: 'Resolve request' });
    expect(resolve).toBeDisabled();

    await user.type(screen.getByLabelText('Resolution note'), 'Sent by email');
    expect(resolve).toBeEnabled();
    await user.click(resolve);

    await waitFor(() => expect(privacy.resolveRequest).toHaveBeenCalledWith(5, { outcome: 'COMPLETED', note: 'Sent by email' }));
  });

  it('does not offer partial completion for requests other than erasure', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    show();
    await screen.findByRole('button', { name: 'Resolve request' });
    expect(screen.queryByRole('option', { name: /Partially completed/ })).not.toBeInTheDocument();
  });

  it('makes the admin confirm an irreversible erasure, but not a rejection', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ type: 'ERASURE' }));
    const user = userEvent.setup();
    show();

    expect(await screen.findByText(/anonymises the person's name/)).toBeInTheDocument();
    const resolve = screen.getByRole('button', { name: 'Resolve request' });
    await user.type(screen.getByLabelText('Resolution note'), 'Academic records retained');
    expect(resolve).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Outcome'), 'PARTIALLY_COMPLETED');
    await user.click(screen.getByLabelText(/I understand this cannot be undone/));
    expect(resolve).toBeEnabled();
    await user.click(resolve);
    await waitFor(() =>
      expect(privacy.resolveRequest).toHaveBeenCalledWith(5, { outcome: 'PARTIALLY_COMPLETED', note: 'Academic records retained' }),
    );
  });

  it('lets a rejection through without the confirmation', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail({ type: 'ERASURE' }));
    const user = userEvent.setup();
    show();

    await user.selectOptions(await screen.findByLabelText('Outcome'), 'REJECTED');
    await user.type(screen.getByLabelText('Resolution note'), 'Identity not verified');

    expect(screen.getByRole('button', { name: 'Resolve request' })).toBeEnabled();
  });

  it('shows the requested correction and the history', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(
      detail({ type: 'CORRECTION' }, { correctionPayload: '{"phone":"8888888888"}' }),
    );
    show();

    expect(await screen.findByText('phone')).toBeInTheDocument();
    expect(screen.getByText('8888888888')).toBeInTheDocument();
    expect(screen.getByText(/submitted/i, { selector: 'li span' })).toBeInTheDocument();
  });

  it('shows the outcome of a finished request and no actions', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(
      detail({ status: 'REJECTED', resolutionNote: 'Identity not verified' }),
    );
    show();

    expect(await screen.findByText('Identity not verified')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve request' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument();
  });

  it('shows the server error when resolving fails', async () => {
    vi.mocked(privacy.getAdminRequest).mockResolvedValue(detail());
    vi.mocked(privacy.resolveRequest).mockRejectedValue(new Error('You cannot act on your own request'));
    const user = userEvent.setup();
    show();

    await user.type(await screen.findByLabelText('Resolution note'), 'ok');
    await user.click(screen.getByRole('button', { name: 'Resolve request' }));

    expect(await screen.findByText('You cannot act on your own request')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyRequestDetailPage.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement**

`frontend/src/pages/collegeadmin/privacy/PrivacyRequestDetailPage.tsx`
```tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Loading, Select, Textarea } from '../../../components/common';
import { StatusBadge } from '../../../components/privacy/StatusBadge';
import { getAdminRequest, resolveRequest, reviewRequest, type ResolveOutcome } from '../../../api/privacy';
import { getErrorMessage } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { REQUEST_TYPE_LABELS, formatDate } from '../../../lib/privacyLabels';

function parseCorrection(payload: string | null): [string, string][] {
  if (!payload) return [];
  try {
    return Object.entries(JSON.parse(payload) as Record<string, string>);
  } catch {
    return [];
  }
}

export function PrivacyRequestDetailPage() {
  const requestId = Number(useParams().id);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: queryKeys.privacy.adminRequest(requestId),
    queryFn: () => getAdminRequest(requestId),
  });

  const [outcome, setOutcome] = useState<ResolveOutcome>('COMPLETED');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['privacy'] });
  const onError = (err: unknown) => setError(getErrorMessage(err).message);

  const review = useMutation({
    mutationFn: () => reviewRequest(requestId),
    onSuccess: () => { setError(null); refresh(); },
    onError,
  });
  const resolve = useMutation({
    mutationFn: () => resolveRequest(requestId, { outcome, note: note.trim() }),
    onSuccess: () => { setError(null); refresh(); },
    onError,
  });

  if (!data) return <Loading />;
  const { request, correctionPayload, events } = data.data;
  const irreversible = request.type === 'ERASURE' && outcome !== 'REJECTED';
  const canResolve = note.trim().length > 0 && (!irreversible || confirmed);

  const outcomeOptions = [
    { value: 'COMPLETED', label: 'Completed' },
    ...(request.type === 'ERASURE' ? [{ value: 'PARTIALLY_COMPLETED', label: 'Partially completed (some records retained)' }] : []),
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-8">
      <Link to="/privacy-admin" className="text-sm font-semibold text-[#9c6b1a] hover:underline">← Back to requests</Link>

      <Card
        title={`Request #${request.requestId} · ${REQUEST_TYPE_LABELS[request.type]}`}
        description={`User ${request.userId} · Submitted ${formatDate(request.submittedAt)} · Due ${formatDate(request.dueAt)}`}
        headerActions={<StatusBadge status={request.status} />}
      >
        {request.details && <p className="whitespace-pre-line text-sm text-slate-700">{request.details}</p>}
        {parseCorrection(correctionPayload).length > 0 && (
          <dl className="mt-3 space-y-1 text-sm">
            {parseCorrection(correctionPayload).map(([field, value]) => (
              <div key={field} className="flex gap-2">
                <dt className="font-semibold text-slate-700">{field}</dt>
                <dd className="text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {request.resolutionNote && (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-700">{request.resolutionNote}</p>
        )}
      </Card>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {request.status === 'SUBMITTED' && (
        <Button onClick={() => review.mutate()} isLoading={review.isPending}>Start review</Button>
      )}

      {request.status === 'IN_REVIEW' && (
        <Card title="Resolve this request">
          <div className="space-y-4">
            <Select
              label="Outcome"
              options={outcomeOptions}
              value={outcome}
              onChange={(e) => { setOutcome(e.target.value as ResolveOutcome); setConfirmed(false); }}
            />
            <Textarea label="Resolution note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            {irreversible && (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p>
                  Erasure anonymises the person's name, email, phone and profile details. This cannot be undone.
                  Marks and attendance are kept without the person's identity.
                </p>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  I understand this cannot be undone
                </label>
              </div>
            )}
            <Button onClick={() => resolve.mutate()} disabled={!canResolve} isLoading={resolve.isPending}>
              Resolve request
            </Button>
          </div>
        </Card>
      )}

      <Card title="History">
        <ol className="space-y-2 text-sm">
          {events.map((e, i) => (
            <li key={i}>
              <span className="font-medium">{e.toStatus.replace('_', ' ').toLowerCase()}</span>
              <span className="text-slate-500"> · {formatDate(e.occurredAt)}{e.actorId ? ` · user ${e.actorId}` : ''}</span>
              {e.note && <p className="text-slate-600">{e.note}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Run, then commit**

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyRequestDetailPage.test.tsx` → Expected PASS (8 tests). If `getByText(/submitted/i, { selector: 'li span' })` matches more than one element, narrow the query to the history list rather than weakening the assertion.

```bash
git add frontend/src/pages/collegeadmin/privacy/PrivacyRequestDetailPage.tsx frontend/src/pages/collegeadmin/privacy/PrivacyRequestDetailPage.test.tsx
git commit -m "Add privacy request detail page with review and resolve

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

#### 12c. Notice tab

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/collegeadmin/privacy/PrivacyNoticeTab.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyNoticeTab } from './PrivacyNoticeTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const notices = [
  { noticeId: 2, collegeId: 7, version: 2, body: 'Second notice text', effectiveFrom: '2026-10-01T00:00:00', publishedBy: 1 },
  { noticeId: 1, collegeId: 7, version: 1, body: 'First notice text', effectiveFrom: '2026-09-01T00:00:00', publishedBy: 1 },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getNotices).mockResolvedValue({ success: true, message: '', timestamp: '', data: notices } as never);
  vi.mocked(privacy.publishNotice).mockResolvedValue({ success: true, message: '', timestamp: '', data: notices[0] } as never);
});

describe('PrivacyNoticeTab', () => {
  it('shows the current version and lists earlier ones', async () => {
    renderWithProviders(<PrivacyNoticeTab />);

    expect(await screen.findByText('Second notice text')).toBeInTheDocument();
    expect(screen.getByText(/Current notice: version 2/)).toBeInTheDocument();
    expect(screen.getByText(/Version 1/)).toBeInTheDocument();
  });

  it('explains when nothing has been published', async () => {
    vi.mocked(privacy.getNotices).mockResolvedValue({ success: true, message: '', timestamp: '', data: [] } as never);
    renderWithProviders(<PrivacyNoticeTab />);
    expect(await screen.findByText(/No notice has been published yet/)).toBeInTheDocument();
  });

  it('cannot publish empty text and publishes trimmed text otherwise', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyNoticeTab />);
    const publish = await screen.findByRole('button', { name: 'Publish new version' });
    expect(publish).toBeDisabled();

    await user.type(screen.getByLabelText('New notice text'), '  Updated terms  ');
    expect(publish).toBeEnabled();
    await user.click(publish);

    await waitFor(() => expect(privacy.publishNotice).toHaveBeenCalledWith('Updated terms'));
    await waitFor(() => expect(screen.getByLabelText('New notice text')).toHaveValue(''));
  });

  it('warns that publishing asks everyone to answer again', async () => {
    renderWithProviders(<PrivacyNoticeTab />);
    expect(await screen.findByText(/will be asked to review their choices again/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and see it fail**, then implement

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyNoticeTab.test.tsx`
Expected: FAIL — component does not exist.

`frontend/src/pages/collegeadmin/privacy/PrivacyNoticeTab.tsx`
```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Loading, Textarea } from '../../../components/common';
import { getNotices, publishNotice } from '../../../api/privacy';
import { getErrorMessage } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { formatDate } from '../../../lib/privacyLabels';

export function PrivacyNoticeTab() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: queryKeys.privacy.notices, queryFn: getNotices });
  const publish = useMutation({
    mutationFn: () => publishNotice(text.trim()),
    onSuccess: () => {
      setText('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
    },
    onError: (err) => setError(getErrorMessage(err).message),
  });

  if (isLoading) return <Loading />;
  const [current, ...earlier] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <Card title="Privacy notice">
        {current ? (
          <>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Current notice: version {current.version} (effective {formatDate(current.effectiveFrom)})
            </p>
            <p className="whitespace-pre-line text-sm text-slate-700">{current.body}</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">No notice has been published yet. Students and teachers see nothing until you publish one.</p>
        )}
        {earlier.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-500">
            {earlier.map((n) => (
              <li key={n.noticeId}>Version {n.version} · {formatDate(n.effectiveFrom)}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Publish a new version">
        <div className="space-y-4">
          <Textarea label="New notice text" value={text} onChange={(e) => setText(e.target.value)} rows={8} />
          <p className="text-sm text-slate-500">
            Everyone with a consent choice will be asked to review their choices again after you publish.
          </p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Button onClick={() => publish.mutate()} disabled={!text.trim()} isLoading={publish.isPending}>
            Publish new version
          </Button>
        </div>
      </Card>
    </div>
  );
}
```


- [ ] **Step 3: Run, then commit**

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyNoticeTab.test.tsx` → Expected PASS (4 tests).

```bash
git add frontend/src/pages/collegeadmin/privacy/PrivacyNoticeTab.tsx frontend/src/pages/collegeadmin/privacy/PrivacyNoticeTab.test.tsx
git commit -m "Add privacy notice tab

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

#### 12d. Retention tab

- [ ] **Step 1: Write the failing test**

`frontend/src/pages/collegeadmin/privacy/PrivacyRetentionTab.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyRetentionTab } from './PrivacyRetentionTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const envelope = (data: unknown) => ({ success: true, message: '', timestamp: '', data }) as never;

const policy = {
  policyId: 1, collegeId: 7, dataCategory: 'ACCOUNT_RECORDS', retentionDays: 1825,
  triggerEvent: 'ACCOUNT_DEACTIVATED', action: 'ANONYMISE', enabled: false,
};
const run = (runId: number, dryRun: boolean, processed: number, failed = 0) => ({
  runId, collegeId: 7, dryRun, startedAt: '2026-10-18T02:30:00', finishedAt: '2026-10-18T02:31:00',
  status: 'COMPLETED', recordsProcessed: processed, recordsFailed: failed,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getRetentionPolicies).mockResolvedValue(envelope([policy]));
  vi.mocked(privacy.getRetentionRuns).mockResolvedValue(envelope({ content: [run(2, true, 3)], totalElements: 1, totalPages: 1, number: 0, size: 20 }));
  vi.mocked(privacy.saveRetentionPolicies).mockResolvedValue(envelope([policy]));
  vi.mocked(privacy.runRetention).mockResolvedValue(envelope(run(3, true, 4)));
});

describe('PrivacyRetentionTab', () => {
  it('shows the shipped policy as disabled with its placeholder period', async () => {
    renderWithProviders(<PrivacyRetentionTab />);

    expect(await screen.findByLabelText('Retention period (days)')).toHaveValue(1825);
    expect(screen.getByLabelText('Enabled')).not.toBeChecked();
  });

  it('saves an edited period and the enabled switch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const days = await screen.findByLabelText('Retention period (days)');
    await user.clear(days);
    await user.type(days, '400');
    await user.click(screen.getByLabelText('Enabled'));
    await user.click(screen.getByRole('button', { name: 'Save policy' }));

    await waitFor(() =>
      expect(privacy.saveRetentionPolicies).toHaveBeenCalledWith([
        { dataCategory: 'ACCOUNT_RECORDS', retentionDays: 400, triggerEvent: 'ACCOUNT_DEACTIVATED', action: 'ANONYMISE', enabled: true },
      ]),
    );
  });

  it('refuses a period that is not a positive whole number', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const days = await screen.findByLabelText('Retention period (days)');
    await user.clear(days);
    await user.type(days, '0');
    await user.click(screen.getByRole('button', { name: 'Save policy' }));

    expect(await screen.findByText('Retention period must be a whole number of days, at least 1')).toBeInTheDocument();
    expect(privacy.saveRetentionPolicies).not.toHaveBeenCalled();
  });

  it('previews with a dry run and reports how many accounts would change', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    await user.click(await screen.findByRole('button', { name: 'Preview (dry run)' }));

    await waitFor(() => expect(privacy.runRetention).toHaveBeenCalledWith(true));
    expect(await screen.findByText('Dry run: 4 account(s) would be anonymised.')).toBeInTheDocument();
  });

  it('keeps the live run locked until the admin confirms', async () => {
    vi.mocked(privacy.runRetention).mockResolvedValue(envelope(run(4, false, 2, 1)));
    const user = userEvent.setup();
    renderWithProviders(<PrivacyRetentionTab />);

    const live = await screen.findByRole('button', { name: 'Run now (live)' });
    expect(live).toBeDisabled();

    await user.click(screen.getByLabelText(/I understand a live run permanently anonymises accounts/));
    expect(live).toBeEnabled();
    await user.click(live);

    await waitFor(() => expect(privacy.runRetention).toHaveBeenCalledWith(false));
    expect(await screen.findByText('Anonymised 2 account(s); 1 failed.')).toBeInTheDocument();
  });

  it('lists the run history', async () => {
    renderWithProviders(<PrivacyRetentionTab />);
    expect(await screen.findByText('Dry run')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and see it fail**, then implement

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyRetentionTab.test.tsx`
Expected: FAIL — component does not exist.

`frontend/src/pages/collegeadmin/privacy/PrivacyRetentionTab.tsx`
```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Loading } from '../../../components/common';
import {
  getRetentionPolicies, getRetentionRuns, runRetention, saveRetentionPolicies,
  type RetentionPolicy, type RetentionRun,
} from '../../../api/privacy';
import { getErrorMessage } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { formatDate } from '../../../lib/privacyLabels';

interface Edit {
  days: string;
  enabled: boolean;
}

export function PrivacyRetentionTab() {
  const queryClient = useQueryClient();
  const policies = useQuery({ queryKey: queryKeys.privacy.policies, queryFn: getRetentionPolicies });
  const runs = useQuery({ queryKey: queryKeys.privacy.runs, queryFn: getRetentionRuns });

  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['privacy'] });
  const onError = (err: unknown) => { setMessage(null); setError(getErrorMessage(err).message); };

  const editFor = (p: RetentionPolicy): Edit =>
    edits[p.dataCategory] ?? { days: String(p.retentionDays), enabled: p.enabled };

  const save = useMutation({
    mutationFn: () =>
      saveRetentionPolicies(
        (policies.data?.data ?? []).map((p) => ({
          dataCategory: p.dataCategory,
          retentionDays: Number(editFor(p).days),
          triggerEvent: p.triggerEvent,
          action: p.action,
          enabled: editFor(p).enabled,
        })),
      ),
    onSuccess: () => { setError(null); setMessage('Policy saved.'); setEdits({}); refresh(); },
    onError,
  });

  const run = useMutation({
    mutationFn: (dryRun: boolean) => runRetention(dryRun),
    onSuccess: (res) => {
      const r = res.data;
      setError(null);
      setMessage(
        r.dryRun
          ? `Dry run: ${r.recordsProcessed} account(s) would be anonymised.`
          : `Anonymised ${r.recordsProcessed} account(s); ${r.recordsFailed} failed.`,
      );
      setLiveConfirmed(false);
      refresh();
    },
    onError,
  });

  const handleSave = () => {
    const invalid = (policies.data?.data ?? []).some((p) => {
      const days = Number(editFor(p).days);
      return !Number.isInteger(days) || days < 1;
    });
    if (invalid) {
      setMessage(null);
      setError('Retention period must be a whole number of days, at least 1');
      return;
    }
    save.mutate();
  };

  if (policies.isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card
        title="Retention policy"
        description="Deactivated student and teacher accounts older than the period below are anonymised. Marks and attendance are kept."
      >
        {(policies.data?.data ?? []).map((p) => (
          <div key={p.dataCategory} className="space-y-4">
            <div className="max-w-xs">
              <Input
                label="Retention period (days)"
                type="number"
                min={1}
                value={editFor(p).days}
                onChange={(e) => setEdits((prev) => ({ ...prev, [p.dataCategory]: { ...editFor(p), days: e.target.value } }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editFor(p).enabled}
                onChange={(e) => setEdits((prev) => ({ ...prev, [p.dataCategory]: { ...editFor(p), enabled: e.target.checked } }))}
              />
              Enabled
            </label>
            <p className="text-xs text-slate-500">
              The default period is a placeholder, not legal advice. Agree the real period with your counsel before enabling.
            </p>
          </div>
        ))}
        <div className="mt-4">
          <Button onClick={handleSave} isLoading={save.isPending}>Save policy</Button>
        </div>
      </Card>

      <Card title="Run retention">
        <div className="space-y-4">
          <div>
            <Button variant="outline" onClick={() => run.mutate(true)} isLoading={run.isPending}>Preview (dry run)</Button>
            <p className="mt-1 text-xs text-slate-500">Counts what would change without changing anything.</p>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={liveConfirmed} onChange={(e) => setLiveConfirmed(e.target.checked)} />
              I understand a live run permanently anonymises accounts
            </label>
            <Button variant="danger" disabled={!liveConfirmed} onClick={() => run.mutate(false)}>Run now (live)</Button>
          </div>
        </div>
      </Card>

      <Card title="Run history">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">Started</th><th>Mode</th><th>Status</th><th>Processed</th><th>Failed</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(runs.data?.data.content ?? []).map((r: RetentionRun) => (
              <tr key={r.runId}>
                <td className="py-2">{formatDate(r.startedAt)}</td>
                <td>{r.dryRun ? 'Dry run' : 'Live'}</td>
                <td>{r.status}</td>
                <td>{r.recordsProcessed}</td>
                <td>{r.recordsFailed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Run, then commit**

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyRetentionTab.test.tsx` → Expected PASS (6 tests). The "Dry run" run-history cell and the "Preview (dry run)" button text differ, so `findByText('Dry run')` matches the table cell only; if it also matches the success message, tighten the query to `within(table)`.

```bash
git add frontend/src/pages/collegeadmin/privacy/PrivacyRetentionTab.tsx frontend/src/pages/collegeadmin/privacy/PrivacyRetentionTab.test.tsx
git commit -m "Add retention policy tab with dry run and guarded live run

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

#### 12e. Audit tab and the tabbed page

- [ ] **Step 1: Write the failing tests**

`frontend/src/pages/collegeadmin/privacy/PrivacyAuditTab.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyAuditTab } from './PrivacyAuditTab';
import { renderWithProviders } from '../../../test/renderWithProviders';
import * as privacy from '../../../api/privacy';

vi.mock('../../../api/privacy');

const entry = (auditId: number, action: string) => ({
  auditId, collegeId: 7, actorId: 99, subjectUserId: 42, action, details: 'requestId=3', createdAt: '2026-10-18T10:00:00',
});
const page = (content: unknown[], totalPages: number) =>
  ({ success: true, message: '', timestamp: '', data: { content, totalElements: content.length, totalPages, number: 0, size: 50 } }) as never;

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PrivacyAuditTab', () => {
  it('lists audit entries', async () => {
    vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(page([entry(2, 'ERASURE_EXECUTED'), entry(1, 'REQUEST_SUBMITTED')], 1));
    renderWithProviders(<PrivacyAuditTab />);

    expect(await screen.findByText('ERASURE_EXECUTED')).toBeInTheDocument();
    expect(screen.getByText('REQUEST_SUBMITTED')).toBeInTheDocument();
  });

  it('pages through the trail', async () => {
    vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(page([entry(1, 'REQUEST_SUBMITTED')], 2));
    const user = userEvent.setup();
    renderWithProviders(<PrivacyAuditTab />);

    await user.click(await screen.findByRole('button', { name: 'Next' }));

    await waitFor(() => expect(privacy.getPrivacyAudit).toHaveBeenLastCalledWith(1));
  });

  it('says so when the trail is empty', async () => {
    vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(page([], 1));
    renderWithProviders(<PrivacyAuditTab />);
    expect(await screen.findByText('No privacy activity recorded yet.')).toBeInTheDocument();
  });
});
```

`frontend/src/pages/collegeadmin/PrivacyAdminPage.test.tsx`

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyAdminPage } from './PrivacyAdminPage';
import { renderWithProviders } from '../../test/renderWithProviders';
import * as privacy from '../../api/privacy';

vi.mock('../../api/privacy');

const emptyPage = { success: true, message: '', timestamp: '', data: { content: [], totalElements: 0, totalPages: 1, number: 0, size: 20 } } as never;
const emptyList = { success: true, message: '', timestamp: '', data: [] } as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(privacy.getAdminRequests).mockResolvedValue(emptyPage);
  vi.mocked(privacy.getNotices).mockResolvedValue(emptyList);
  vi.mocked(privacy.getRetentionPolicies).mockResolvedValue(emptyList);
  vi.mocked(privacy.getRetentionRuns).mockResolvedValue(emptyPage);
  vi.mocked(privacy.getPrivacyAudit).mockResolvedValue(emptyPage);
});

describe('PrivacyAdminPage', () => {
  it('opens on the request queue and switches between the four tabs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PrivacyAdminPage />);

    expect(await screen.findByRole('heading', { name: 'Request queue' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Privacy notice' }));
    expect(await screen.findByRole('heading', { name: 'Publish a new version' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retention' }));
    expect(await screen.findByRole('heading', { name: 'Run retention' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Audit log' }));
    expect(await screen.findByText('No privacy activity recorded yet.')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run them and see them fail**, then implement

Run: `cd frontend && npx vitest run src/pages/collegeadmin/privacy/PrivacyAuditTab.test.tsx src/pages/collegeadmin/PrivacyAdminPage.test.tsx`
Expected: FAIL — components do not exist.

`frontend/src/pages/collegeadmin/privacy/PrivacyAuditTab.tsx`
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Loading } from '../../../components/common';
import { getPrivacyAudit } from '../../../api/privacy';
import { queryKeys } from '../../../api/queryKeys';

export function PrivacyAuditTab() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.privacy.audit(page),
    queryFn: () => getPrivacyAudit(page),
  });
  const rows = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  return (
    <Card title="Audit log" description="Every consent, request, erasure and retention action, newest first.">
      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No privacy activity recorded yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">When</th><th>Action</th><th>By</th><th>About</th><th>Details</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.auditId}>
                <td className="py-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="font-medium">{r.action}</td>
                <td>{r.actorId ? `User ${r.actorId}` : 'System'}</td>
                <td>{r.subjectUserId ? `User ${r.subjectUserId}` : '—'}</td>
                <td className="text-slate-500">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </Card>
  );
}
```

`frontend/src/pages/collegeadmin/PrivacyAdminPage.tsx`
```tsx
import { useState } from 'react';
import { PrivacyAuditTab } from './privacy/PrivacyAuditTab';
import { PrivacyNoticeTab } from './privacy/PrivacyNoticeTab';
import { PrivacyRequestsTab } from './privacy/PrivacyRequestsTab';
import { PrivacyRetentionTab } from './privacy/PrivacyRetentionTab';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'notice', label: 'Privacy notice' },
  { key: 'retention', label: 'Retention' },
  { key: 'audit', label: 'Audit log' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function PrivacyAdminPage() {
  const [tab, setTab] = useState<TabKey>('requests');

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy</h1>
        <p className="text-sm text-slate-500">Notice, consent, data-principal requests and retention for your college.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === t.key ? 'bg-[#9c6b1a] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'requests' && <PrivacyRequestsTab />}
      {tab === 'notice' && <PrivacyNoticeTab />}
      {tab === 'retention' && <PrivacyRetentionTab />}
      {tab === 'audit' && <PrivacyAuditTab />}
    </div>
  );
}
```

- [ ] **Step 3: Run the whole privacy UI suite, then commit**

Run: `cd frontend && npx vitest run src/pages/collegeadmin && npm run build && npm run lint`
Expected: all admin tests pass (3 + 8 + 4 + 6 + 3 + 1), no type or lint errors.

```bash
git add frontend/src/pages/collegeadmin/privacy/PrivacyAuditTab.tsx frontend/src/pages/collegeadmin/privacy/PrivacyAuditTab.test.tsx \
  frontend/src/pages/collegeadmin/PrivacyAdminPage.tsx frontend/src/pages/collegeadmin/PrivacyAdminPage.test.tsx
git commit -m "Add privacy audit tab and tabbed admin page

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Wire the UI into routes, navigation and layout

**Files:**
- Modify: `frontend/src/components/layout/navIconMap.tsx` (add a `privacy` icon)
- Modify: `frontend/src/strategies/roleStrategy.ts` (nav items for STUDENT, TEACHER, COLLEGEADMIN)
- Modify: `frontend/src/routes/index.tsx` (three routes)
- Modify: `frontend/src/components/layout/MainLayout.tsx` (mount `ConsentGate`)
- Test: `frontend/src/strategies/roleStrategy.privacy.test.ts`

**Interfaces:**
- Consumes: `MyPrivacyPage`, `PrivacyAdminPage`, `PrivacyRequestDetailPage`, `ConsentGate` (Tasks 10–12); `isRouteAllowed(roleName, path)` from `strategies/roleStrategy.ts` (it only looks at the first path segment and checks the role's `navItems`).
- Produces: routes `/my-privacy` (STUDENT, TEACHER), `/privacy-admin` and `/privacy-admin/requests/:id` (COLLEGEADMIN).

- [ ] **Step 1: Write the failing test**

`frontend/src/strategies/roleStrategy.privacy.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { isRouteAllowed } from './roleStrategy';

describe('privacy routes by role', () => {
  it.each(['STUDENT', 'TEACHER'])('%s can open My Privacy but not the admin area', (role) => {
    expect(isRouteAllowed(role, '/my-privacy')).toBe(true);
    expect(isRouteAllowed(role, '/privacy-admin')).toBe(false);
    expect(isRouteAllowed(role, '/privacy-admin/requests/5')).toBe(false);
  });

  it('college admin can open the admin area including request details, but not My Privacy', () => {
    expect(isRouteAllowed('COLLEGEADMIN', '/privacy-admin')).toBe(true);
    expect(isRouteAllowed('COLLEGEADMIN', '/privacy-admin/requests/5')).toBe(true);
    expect(isRouteAllowed('COLLEGEADMIN', '/my-privacy')).toBe(false);
  });

  it.each(['HOD', 'SUPERADMIN'])('%s has no privacy pages in this release', (role) => {
    expect(isRouteAllowed(role, '/my-privacy')).toBe(false);
    expect(isRouteAllowed(role, '/privacy-admin')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `cd frontend && npx vitest run src/strategies/roleStrategy.privacy.test.ts`
Expected: FAIL — the nav items do not exist yet, so the "true" assertions fail.

- [ ] **Step 3: Make the changes**

`frontend/src/components/layout/navIconMap.tsx`: add `ShieldCheck` to the `lucide-react` import list and `privacy: ShieldCheck,` to the `ICONS` map.

`frontend/src/strategies/roleStrategy.ts`: add one item to the `navItems` array of each strategy (read the file; keep the surrounding formatting):

```ts
// studentStrategy and teacherStrategy — add next to the existing 'support' item
{ key: 'privacy', label: 'My Privacy', path: '/my-privacy', icon: 'privacy', group: 'Support' },

// collegeAdminStrategy — add after 'collegeConfig'
{ key: 'privacyAdmin', label: 'Privacy', path: '/privacy-admin', icon: 'privacy', group: 'Management' },
```

`frontend/src/routes/index.tsx`: add the imports and three entries to `routeComponentMap`:

```tsx
import { MyPrivacyPage } from '../pages/MyPrivacyPage';
import { PrivacyAdminPage } from '../pages/collegeadmin/PrivacyAdminPage';
import { PrivacyRequestDetailPage } from '../pages/collegeadmin/privacy/PrivacyRequestDetailPage';

  '/my-privacy':                  MyPrivacyPage,
  '/privacy-admin':               PrivacyAdminPage,
  '/privacy-admin/requests/:id':  PrivacyRequestDetailPage,
```

`frontend/src/components/layout/MainLayout.tsx`: import `ConsentGate` from `../privacy/ConsentGate` and render `<ConsentGate />` as the last child of the outer `div` (the modal is portalled, so its position in the tree does not matter).

- [ ] **Step 4: Run all frontend checks**

Run: `cd frontend && npx vitest run && npm run build && npm run lint`
Expected: every test passes, the build and lint are clean.

- [ ] **Step 5: Check it in the running app**

Start the backend with the `dev` profile (H2) and the frontend dev server (see `docs/devsetup.md` and `.claude/launch.json` if present). The dev database starts empty, so look in `docs/devsetup.md` for how to create a college, a college admin and a student. If the repo offers no way to seed those, say so in the task report and verify what you can without them: the login page renders without console errors, and `npm run build` is clean. If seeding is possible, walk this path and report what you saw:

1. College admin: Privacy → Privacy notice → publish a notice.
2. Student: the consent modal appears and cannot be dismissed; tick one box, save; the modal disappears.
3. Student: My Privacy → submit an erasure request.
4. College admin: Privacy → Requests → open it → Start review → tick the confirmation → Completed with a note.
5. Student: the old session still works until the token expires (known limitation); a fresh login with the old username fails.
6. Audit log shows the steps.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/layout/navIconMap.tsx frontend/src/strategies/roleStrategy.ts \
  frontend/src/strategies/roleStrategy.privacy.test.ts frontend/src/routes/index.tsx frontend/src/components/layout/MainLayout.tsx
git commit -m "Wire privacy pages into routes, navigation and layout

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Documentation, graph update and final verification

**Files:**
- Create: `docs/PRIVACY.md`
- Modify: `docs/README.md` (index line), `docs/foundations/requirements.md`, `docs/foundations/contracts.md`, `docs/foundations/architecture.md`
- Modify: `docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md` only if implementation diverged from section 9

- [ ] **Step 1: Write `docs/PRIVACY.md`**

````markdown
# Privacy (DPDP) workflows

Notice and consent, data-principal requests and retention, per college. Design: `docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md`.

## What it does

| Area | Who | Where |
|---|---|---|
| Notice versions and per-purpose consent (append-only ledger) | Students and teachers answer; college admin publishes notices | Consent modal on first login and after each new notice; **My Privacy**; admin **Privacy → Privacy notice** |
| Requests: access, correction, erasure, grievance | Students and teachers raise; college admin reviews and resolves | **My Privacy**; admin **Privacy → Requests** |
| Retention: anonymise deactivated accounts after N days | College admin sets the policy; a nightly job runs it | Admin **Privacy → Retention** |
| Audit trail of every privacy action | College admin reads | Admin **Privacy → Audit log** |

## Erasure means anonymise

Name, email, username, phone, date of birth, address and parent contact details are replaced or cleared and the account is disabled. Marks, attendance and results stay, linked by user id and roll number. Nothing is hard-deleted.

## Configuration

| Property (env var) | Default | Meaning |
|---|---|---|
| `app.privacy.response-days` (`APP_PRIVACY_RESPONSE_DAYS`) | `30` | Days from submission to a request's due date. Confirm the legal figure with counsel. |
| `app.privacy.retention-dry-run` (`APP_PRIVACY_RETENTION_DRY_RUN`) | `true` | The nightly job only counts. Set `false` to let it anonymise. |
| `app.privacy.retention-cron` (`APP_PRIVACY_RETENTION_CRON`) | `0 30 2 * * *` | When the nightly job runs. |

Retention policies ship **disabled** with a placeholder of 1825 days. A college must enable and tune its own.

## Turning retention on safely

1. Admin → Privacy → Retention: set the period agreed with counsel and tick **Enabled**.
2. Use **Preview (dry run)** and read the count and the run history.
3. Only then set `APP_PRIVACY_RETENTION_DRY_RUN=false` and restart. Run the backend as a single replica for this job: it has no distributed lock.

## Adding a module's data to the workflows

Implement `com.edgepoint.privacy.contributor.PersonalDataContributor` as a Spring `@Component`:

```java
@Component
public class FeesDataContributor implements PersonalDataContributor {
    public String section() { return "fees"; }
    public Map<String, Object> export(Integer userId) { /* the user's fee data, no secrets */ }
    public Set<String> correctableFields() { return Set.of(); }
    public void correct(Integer userId, Map<String, String> fields) { }
    public void anonymise(Integer userId) { /* clear direct identifiers, keep the record; safe to call twice */ }
}
```

It is picked up automatically for access exports, corrections and erasure.

## Known limitations

- An access token issued before an erasure stays valid until it expires; the JWT filter does not check `is_active`.
- The nightly job is not cluster-safe.
- `HOD` and `SUPERADMIN` have no privacy pages in this release; a `SUPERADMIN` can read the admin API for one college with `?collegeId=`.
- Guardian consent for minors and breach notification are not built.
- The retention reference date for a deactivated account is `COALESCE(deleted_at, updated_at, created_at)`; there is no explicit deactivation timestamp.
````

- [ ] **Step 2: Update the index and foundations docs**

- `docs/README.md`: add one line linking `PRIVACY.md` next to the other guides, matching the existing list style.
- `docs/foundations/requirements.md`, `contracts.md`, `architecture.md`: read each first and append a short section in that file's own heading and table style, with this content.
  - requirements: three requirements (notice and consent; data-principal requests with a due date; retention and erasure that anonymises and keeps academic records), tagged PRIV-006 to PRIV-009 and COMP-001, plus the open items (response-day figure, real retention periods, functionality ID).
  - contracts: the eight `privacy_*`/`consent_*`/`data_request*`/`retention_*` tables plus `users.anonymised_at`, and the endpoint table from the design spec section 5 (including the two extra detail endpoints).
  - architecture: the `privacy` module, the `PersonalDataContributor` extension point, the anonymise-and-keep decision, the dry-run-by-default scheduler, and the known limitations above.

- [ ] **Step 3: Final verification (evidence before claims)**

Run each and read the output:

```bash
cd backend && mvn test 2>&1 | tail -40
cd ../frontend && npx vitest run && npm run build && npm run lint
cd .. && ls backend/src/main/resources/db/migration
grep -rn "audit.record" backend/src/main/java/com/edgepoint/privacy | grep -i -E "getFullName|getEmail|getPhone|getAddress|note"
```

Expected:
- Backend: every privacy test passes and there are no failures beyond the Task 0 baseline.
- Frontend: all tests, build and lint pass.
- Migration listing: the privacy migration has a version number higher than every other file. If `main` has gained migrations since Task 1 (`git fetch && git diff --stat origin/main -- backend/src/main/resources/db/migration`), rename the privacy file to the next free number and re-run the Postgres check from Task 1 Step 8.
- The last grep prints nothing: no audit call carries personal values or free-text notes.

- [ ] **Step 4: Update the knowledge graph and commit**

```bash
graphify update .
git add docs/PRIVACY.md docs/README.md docs/foundations
git commit -m "Document privacy workflows

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Do not add `graphify-out/` to this commit unless the repo already tracks it (check `git ls-files graphify-out | head`); follow whatever the repo does.

- [ ] **Step 5: Hand off**

Use the `superpowers:finishing-a-development-branch` skill. In the report, state plainly: what was verified (which test commands and their counts), what was not (the Postgres migration check and the end-to-end walk-through if Docker or seed data were unavailable), the migration number used, and the known limitations from `docs/PRIVACY.md`.
