// src/main/java/com/collegeManagement/security/TenantContext.java
package com.collegeManagement.production.security;

import org.springframework.stereotype.Component;

@Component
public class TenantContext {

    private static final ThreadLocal<Integer> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<Integer> currentCollegeId = new ThreadLocal<>();
    private static final ThreadLocal<Integer> currentRoleId = new ThreadLocal<>();

    public void setContext(Integer userId, Integer collegeId, Integer roleId) {
        currentUserId.set(userId);
        currentCollegeId.set(collegeId);
        currentRoleId.set(roleId);
    }

    public void clear() {
        currentUserId.remove();
        currentCollegeId.remove();
        currentRoleId.remove();
    }

    public Integer getCurrentUserId() {
        return currentUserId.get();
    }

    public Integer getCollegeId() {
        return currentCollegeId.get();
    }

    public Integer getRoleId() {
        return currentRoleId.get();
    }
}
