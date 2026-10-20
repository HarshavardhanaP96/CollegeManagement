package com.edgepoint.audit.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/** Pure helpers that turn Hibernate entity state arrays into audit-safe maps. */
public final class AuditDiff {

    private static final Set<String> IGNORED = Set.of(
            "createdAt", "updatedAt", "createdBy", "updatedBy", "deletedAt", "deletedBy");

    private AuditDiff() {
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
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i < names.length; i++) {
            if (skip(names[i]) || state[i] == null || !isScalar(state[i])) continue;
            out.put(names[i], display(state[i]));
        }
        return out;
    }

    public static Map<String, Object> changes(String[] names, Object[] before, Object[] after) {
        Map<String, Object> out = new LinkedHashMap<>();
        for (int i = 0; i < names.length; i++) {
            if (skip(names[i]) || !isScalar(before[i]) || !isScalar(after[i])
                    || Objects.equals(before[i], after[i])) continue;
            Map<String, Object> change = new LinkedHashMap<>();
            change.put("from", display(before[i]));
            change.put("to", display(after[i]));
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
