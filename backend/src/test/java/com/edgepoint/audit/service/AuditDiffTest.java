package com.edgepoint.audit.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AuditDiff Unit Tests")
class AuditDiffTest {

    private static final String[] NAMES = {"deptName", "deptCode", "passwordHash", "updatedAt"};

    @Test
    @DisplayName("update diff lists only changed fields with from/to")
    void updateDiffContainsOnlyChangedFields() {
        Object[] before = {"Physics", "PHY", "h1", null};
        Object[] after = {"Applied Physics", "PHY", "h1", null};

        Map<String, Object> diff = AuditDiff.changes(NAMES, before, after);

        assertThat(diff).containsOnlyKeys("deptName");
        assertThat(diff.get("deptName")).isEqualTo(Map.of("from", "Physics", "to", "Applied Physics"));
    }

    @Test
    @DisplayName("sensitive fields are never recorded")
    void sensitiveFieldsAreRedacted() {
        Object[] before = {"A", "C", "old-hash", null};
        Object[] after = {"A", "C", "new-hash", null};

        assertThat(AuditDiff.changes(NAMES, before, after)).isEmpty();
        assertThat(AuditDiff.snapshot(NAMES, after)).doesNotContainKey("passwordHash");
    }

    @Test
    @DisplayName("bookkeeping timestamps are ignored in diffs")
    void timestampsIgnored() {
        Object[] before = {"A", "C", "h", null};
        Object[] after = {"A", "C", "h", "2026-01-01T00:00"};

        assertThat(AuditDiff.changes(NAMES, before, after)).isEmpty();
    }

    @Test
    @DisplayName("snapshot for create contains non-null values")
    void snapshotSkipsNulls() {
        Map<String, Object> snap = AuditDiff.snapshot(NAMES, new Object[]{"Physics", null, "h", null});

        assertThat(snap).containsOnlyKeys("deptName");
    }

    @Test
    @DisplayName("soft delete flag flips are classified as delete")
    void softDeleteDetected() {
        String[] names = {"isDeleted", "deptName"};
        assertThat(AuditDiff.isSoftDelete(names, new Object[]{false, "A"}, new Object[]{true, "A"})).isTrue();
        assertThat(AuditDiff.isSoftDelete(names, new Object[]{false, "A"}, new Object[]{false, "B"})).isFalse();
    }

    @Test
    @DisplayName("associated entities are never stringified into the audit trail")
    void associationsSkipped() {
        String[] names = {"deptName", "college"};
        Object entity = new Object() {
            @Override public String toString() { throw new IllegalStateException("must not be touched"); }
        };

        assertThat(AuditDiff.snapshot(names, new Object[]{"A", entity})).containsOnlyKeys("deptName");
        assertThat(AuditDiff.changes(names, new Object[]{"A", null}, new Object[]{"A", entity})).isEmpty();
    }
}
