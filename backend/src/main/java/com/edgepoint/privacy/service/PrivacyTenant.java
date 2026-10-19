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
