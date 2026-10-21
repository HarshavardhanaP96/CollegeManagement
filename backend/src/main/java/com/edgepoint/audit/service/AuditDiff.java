package com.edgepoint.audit.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/** Pure helpers that turn Hibernate entity state arrays into audit-safe maps. */
public final class AuditDiff {

    private static final Set<String> IGNORED = Set.of(
            "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "deletedBy");

    /** Entities that carry personal data and are covered by the privacy workflows: never audited generically. */
    private static final Set<String> EXCLUDED_ENTITIES = Set.of("DataRequest");

    /** Personal-data fields of entities whose audit rows must not hold the values (DPDP erasure). */
    private static final Set<String> PII_ENTITIES = Set.of("User", "StudentProfile");
    private static final Set<String> PII_FIELDS = Set.of(
            "fullName", "email", "username", "phone", "parentName", "parentPhone", "parentEmail",
            "address", "dateOfBirth");
    static final String REDACTED = "[redacted]";

    private AuditDiff() {
    }

    public static boolean isExcluded(String entityType) {
        return entityType != null && EXCLUDED_ENTITIES.contains(entityType);
    }

    private static boolean masked(String entityType, String field) {
        return entityType != null && PII_ENTITIES.contains(entityType) && PII_FIELDS.contains(field);
    }

    static boolean isSensitive(String name) {
        String n = name.toLowerCase();
        return n.contains("password") || n.contains("token") || n.contains("secret");
    }

    private static boolean skip(String name) {
        return isSensitive(name) || IGNORED.contains(name);
    }

    /** Scalars only: associated entities/proxies must never be stringified (lazy loads, huge output). */
    private static boolean isScalar(Object v) {
        return v == null || v instanceof Number || v instanceof Boolean || v instanceof CharSequence
                || v instanceof Enum<?> || v instanceof java.time.temporal.TemporalAccessor;
    }

    public static Map<String, Object> snapshot(String[] names, Object[] state) {
        return snapshot(null, names, state);
    }

    public static Map<String, Object> snapshot(String entityType, String[] names, Object[] state) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i < names.length; i++) {
            if (skip(names[i]) || state[i] == null || !isScalar(state[i])) continue;
            out.put(names[i], masked(entityType, names[i]) ? REDACTED : display(state[i]));
        }
        return out;
    }

    public static Map<String, Object> changes(String[] names, Object[] before, Object[] after) {
        return changes(null, names, before, after);
    }

    public static Map<String, Object> changes(String entityType, String[] names, Object[] before, Object[] after) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i < names.length; i++) {
            if (skip(names[i]) || !isScalar(before[i]) || !isScalar(after[i])
                    || Objects.equals(before[i], after[i])) continue;
            Map<String, Object> change = new LinkedHashMap<>();
            boolean mask = masked(entityType, names[i]);
            change.put("from", mask ? REDACTED : display(before[i]));
            change.put("to", mask ? REDACTED : display(after[i]));
            out.put(names[i], change);
        }
        return out;
    }

    public static boolean isSoftDelete(String[] names, Object[] before, Object[] after) {
        for (int i = 0; i < names.length; i++) {
            if ("isDeleted".equals(names[i])) {
                return !Boolean.TRUE.equals(before[i]) && Boolean.TRUE.equals(after[i]);
            }
        }
        return false;
    }

    private static Object display(Object v) {
        if (v == null || v instanceof Number || v instanceof Boolean || v instanceof String) return v;
        return v.toString(); // enums and temporals
    }
}
