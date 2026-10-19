package com.edgepoint.audit.integration;

import com.edgepoint.academic.domain.Department;
import com.edgepoint.academic.repository.DepartmentRepository;
import com.edgepoint.audit.domain.AuditAction;
import com.edgepoint.audit.domain.AuditLog;
import com.edgepoint.audit.repository.AuditLogRepository;
import com.edgepoint.core.domain.College;
import com.edgepoint.core.repository.CollegeRepository;
import com.edgepoint.core.security.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@ActiveProfiles("test")
@DisplayName("Audit capture through Hibernate")
class AuditCaptureIntegrationTest {

    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private CollegeRepository collegeRepository;
    @Autowired private TenantContext tenantContext;

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
        Department d = new Department();
        d.setCollegeId(collegeId);
        d.setDeptName("Physics");
        d.setDeptCode("PHY");
        return d;
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
