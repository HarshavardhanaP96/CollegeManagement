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
