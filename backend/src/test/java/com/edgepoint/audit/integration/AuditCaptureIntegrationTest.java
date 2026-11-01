package com.edgepoint.audit.integration;

import com.edgepoint.academic.domain.Department;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.audit.repository.AuditLogRepository;
import com.edgepoint.core.domain.College;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.core.repository.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

@SpringBootTest(properties = {
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.generate_statistics=true"})
@ActiveProfiles("test")
@DisplayName("Audit capture through Hibernate")
class AuditCaptureIntegrationTest {

    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private CollegeRepository collegeRepository;
    @Autowired private TenantContext tenantContext;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private PlatformTransactionManager transactionManager;
    @SpyBean private UserRepository userRepository;

    private Integer collegeId;

    @BeforeEach
    void setUp() {
        College college = new College();
        college.setCollegeName("Audit Test College");
        college.setCollegeCode("ATC");
        collegeId = collegeRepository.save(college).getCollegeId();
        tenantContext.setContext(null, collegeId, 2);
    }

    @AfterEach
    void tearDown() {
        tenantContext.clear();
        SecurityContextHolder.clearContext();
        auditLogRepository.deleteAll();
        departmentRepository.deleteAll();
        collegeRepository.deleteAll();
    }

    private List<AuditLog> entries() {
        return auditLogRepository.findAll().stream()
                .filter(a -> a.getCollegeId().equals(collegeId))
                .toList();
    }

    private Department newDepartment() {
        return newDepartment("PHY");
    }

    private Department newDepartment(String code) {
        Department d = new Department();
        d.setCollegeId(collegeId);
        d.setDeptName("Physics");
        d.setDeptCode(code);
        return d;
    }

    @Test
    @DisplayName("a 60-row save writes 60 entries on the business transaction's own connection, with no user lookups")
    void bulkSaveUsesOneConnection() {
        tenantContext.setContext(42, collegeId, 2);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher1", null, List.of()));
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.clear();

        new TransactionTemplate(transactionManager).executeWithoutResult(tx ->
                departmentRepository.saveAll(IntStream.range(0, 60).mapToObj(i -> newDepartment("D" + i)).toList()));

        assertThat(stats.getConnectCount()).isEqualTo(1);
        assertThat(stats.getSessionOpenCount()).isEqualTo(1);
        verifyNoInteractions(userRepository);
        List<AuditLog> rows = entries();
        assertThat(rows).hasSize(60).allSatisfy(r -> {
            assertThat(r.getAction()).isEqualTo(AuditAction.CREATE);
            assertThat(r.getActorUserId()).isEqualTo(42);
            assertThat(r.getActorUsername()).isEqualTo("teacher1");
        });
    }

    @Test
    @DisplayName("a rolled-back change leaves no audit entry, because it never happened")
    void rollbackWritesNothing() {
        new TransactionTemplate(transactionManager).executeWithoutResult(tx -> {
            departmentRepository.saveAndFlush(newDepartment());
            tx.setRollbackOnly();
        });

        assertThat(entries()).isEmpty();
    }

    @Test
    @DisplayName("saving, editing and soft-deleting a record writes CREATE, UPDATE and DELETE entries")
    void recordsLifecycle() {
        Department saved = departmentRepository.save(newDepartment());

        saved.setDeptName("Applied Physics");
        departmentRepository.saveAndFlush(saved);

        saved.setIsDeleted(true);
        departmentRepository.saveAndFlush(saved);

        List<AuditLog> rows = entries();
        assertThat(rows).extracting(AuditLog::getAction)
                .containsExactlyInAnyOrder(AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE);
        assertThat(rows).allSatisfy(r -> {
            assertThat(r.getEntityType()).isEqualTo("Department");
            assertThat(r.getEntityId()).isEqualTo(String.valueOf(saved.getDeptId()));
        });
        AuditLog update = rows.stream().filter(r -> r.getAction() == AuditAction.UPDATE).findFirst().orElseThrow();
        assertThat(update.getChanges()).contains("Physics").contains("Applied Physics");
    }

    @Test
    @DisplayName("search filters by action and returns newest first")
    void searchFiltersAndOrders() {
        Department saved = departmentRepository.save(newDepartment());
        saved.setDeptName("Renamed");
        departmentRepository.saveAndFlush(saved);

        var all = auditLogRepository.search(collegeId, null, null, null, null,
                org.springframework.data.domain.PageRequest.of(0, 10));
        var updates = auditLogRepository.search(collegeId, AuditAction.UPDATE, "Department", null, null,
                org.springframework.data.domain.PageRequest.of(0, 10));

        assertThat(all.getContent()).extracting(AuditLog::getAction)
                .containsExactly(AuditAction.UPDATE, AuditAction.CREATE);
        assertThat(updates.getContent()).extracting(AuditLog::getAction).containsExactly(AuditAction.UPDATE);
    }
}
