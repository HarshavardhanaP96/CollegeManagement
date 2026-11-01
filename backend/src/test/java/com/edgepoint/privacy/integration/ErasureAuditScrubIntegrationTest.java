package com.edgepoint.privacy.integration;

import com.edgepoint.academic.domain.Course;
import com.edgepoint.academic.domain.Department;
import com.edgepoint.academic.repository.CourseRepository;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.audit.repository.AuditLogRepository;
import com.edgepoint.core.domain.College;
import com.edgepoint.core.domain.User;
import com.edgepoint.core.domain.UserRole;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.repository.UserRoleRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.privacy.domain.DataRequest;
import com.edgepoint.privacy.domain.RequestStatus;
import com.edgepoint.privacy.domain.RequestType;
import com.edgepoint.privacy.repository.DataRequestRepository;
import com.edgepoint.privacy.service.ErasureService;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Proves the generic audit_log never holds personal data and that erasure scrubs what was written earlier. */
@SpringBootTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@ActiveProfiles("test")
class ErasureAuditScrubIntegrationTest {

    static final List<String> PII = List.of(
            "Priya Raghunathan", "priya.raghunathan@example.org", "priya.rn", "9123456780",
            "Meena Raghunathan", "9000011122", "meena.rn@example.org", "42 Lotus Lane", "2005-03-14",
            "Priya R Nair", "9123450000", "Meena R Nair", "7 Orchid Road", "Secret grievance 55555",
            "{\"phone\":\"9123450000\"}");

    @Autowired CollegeRepository colleges;
    @Autowired UserRoleRepository roles;
    @Autowired UserRepository users;
    @Autowired StudentProfileRepository profiles;
    @Autowired DepartmentRepository departments;
    @Autowired CourseRepository courses;
    @Autowired DataRequestRepository requests;
    @Autowired AuditLogRepository auditLogs;
    @Autowired ErasureService erasure;
    @Autowired TenantContext tenantContext;
    @Autowired PlatformTransactionManager txManager;

    Integer collegeId;
    Integer userId;

    @BeforeEach
    void setUp() {
        College college = new College();
        college.setCollegeName("Scrub College");
        college.setCollegeCode("SCRUB");
        collegeId = colleges.save(college).getCollegeId();
        UserRole role = new UserRole();
        role.setRoleId(94);
        role.setRoleName("STUDENT_SCRUB");
        roles.save(role);
        tenantContext.setContext(null, collegeId, 2);

        Department dept = new Department();
        dept.setCollegeId(collegeId); dept.setDeptName("Maths"); dept.setDeptCode("MTH");
        Integer deptId = departments.save(dept).getDeptId();
        Course course = new Course();
        course.setCollegeId(collegeId); course.setCourseName("BSc"); course.setCourseCode("BSC");
        Integer courseId = courses.save(course).getCourseId();

        new TransactionTemplate(txManager).executeWithoutResult(status -> {
            User u = new User();
            u.setCollegeId(collegeId); u.setRoleId(94);
            u.setUsername("priya.rn"); u.setEmail("priya.raghunathan@example.org");
            u.setPasswordHash("x"); u.setFullName("Priya Raghunathan"); u.setPhone("9123456780");
            User saved = users.save(u);
            userId = saved.getUserId();

            StudentProfile p = new StudentProfile();
            p.setUser(saved);
            p.setRollNumber("SCRUB-1"); p.setDeptId(deptId); p.setCourseId(courseId); p.setAdmissionYear(2024);
            p.setParentName("Meena Raghunathan"); p.setParentPhone("9000011122"); p.setParentEmail("meena.rn@example.org");
            p.setAddress("42 Lotus Lane"); p.setDateOfBirth(LocalDate.of(2005, 3, 14));
            profiles.save(p);
        });
    }

    @AfterEach
    void tearDown() {
        tenantContext.clear();
        SecurityContextHolder.clearContext();
        auditLogs.deleteAll();
        requests.deleteAll();
        profiles.deleteAll();
        users.deleteAll();
        courses.deleteAll();
        departments.deleteAll();
        roles.deleteById(94);
        colleges.deleteAll();
    }

    private String everythingInAuditLog() {
        StringBuilder sb = new StringBuilder();
        for (AuditLog a : auditLogs.findAll()) {
            if (!collegeId.equals(a.getCollegeId())) continue;
            sb.append(a.getEntityType()).append('|').append(a.getChanges()).append('|')
                    .append(a.getActorUsername()).append('\n');
        }
        return sb.toString();
    }

    private void editAsTheUser() {
        // A real request carries both: JwtAuthenticationFilter sets the principal (audit actor) and the tenant.
        tenantContext.setContext(userId, collegeId, 94);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "priya.rn", null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
        User u = users.findById(userId).orElseThrow();
        u.setFullName("Priya R Nair");
        u.setPhone("9123450000");
        users.saveAndFlush(u);
        StudentProfile p = profiles.findById(userId).orElseThrow();
        p.setParentName("Meena R Nair");
        p.setAddress("7 Orchid Road");
        profiles.saveAndFlush(p);

        DataRequest r = new DataRequest();
        r.setCollegeId(collegeId); r.setUserId(userId); r.setType(RequestType.GRIEVANCE);
        r.setStatus(RequestStatus.SUBMITTED);
        r.setDetails("Secret grievance 55555");
        r.setCorrectionPayload("{\"phone\":\"9123450000\"}");
        r.setSubmittedAt(LocalDateTime.now()); r.setDueAt(LocalDateTime.now().plusDays(30));
        requests.saveAndFlush(r);
        r.setDetails("Secret grievance 55555 edited");
        requests.saveAndFlush(r);
    }

    @Test
    void auditRowsNeverHoldPersonalDataEvenBeforeAnyErasure() {
        editAsTheUser();

        String log = everythingInAuditLog();

        assertThat(log).contains("User|").contains("StudentProfile|");
        for (String pii : PII) {
            if (pii.equals("priya.rn")) continue; // actor_username is scrubbed by erasure, see below
            assertThat(log).as(pii).doesNotContain(pii);
        }
        assertThat(auditLogs.findAll()).noneMatch(a -> "DataRequest".equals(a.getEntityType()));
    }

    @Test
    void erasureScrubsEveryTraceFromTheAuditLog() {
        editAsTheUser();
        assertThat(everythingInAuditLog()).as("actor username is recorded for the user's own edits").contains("priya.rn");

        SecurityContextHolder.clearContext();
        tenantContext.setContext(null, collegeId, 2);
        erasure.erase(collegeId, userId, null, "test");

        String log = everythingInAuditLog();
        for (String pii : PII) {
            assertThat(log).as(pii).doesNotContain(pii);
        }
        assertThat(auditLogs.findAll()).noneMatch(a -> "DataRequest".equals(a.getEntityType()));
        assertThat(users.findById(userId).orElseThrow().getAnonymisedAt()).isNotNull();
    }
}
