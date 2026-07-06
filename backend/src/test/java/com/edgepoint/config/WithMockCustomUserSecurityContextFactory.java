// ============================================
// src/test/java/com/collegeManagement/config/WithMockCustomUserSecurityContextFactory.java
// ============================================

package com.edgepoint.config;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

public class WithMockCustomUserSecurityContextFactory implements WithSecurityContextFactory<WithMockCustomUser> {

    @Override
    public SecurityContext createSecurityContext(WithMockCustomUser customUser) {
        MockSecurityContext.setAuthentication(
                customUser.userId(),
                customUser.collegeId(),
                customUser.roleId(),
                customUser.username()
        );
        return SecurityContextHolder.getContext();
    }
}
