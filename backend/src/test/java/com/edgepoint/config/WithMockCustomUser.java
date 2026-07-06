// ============================================
// src/test/java/com/collegeManagement/config/WithMockCustomUser.java
// ============================================

package com.edgepoint.config;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockCustomUserSecurityContextFactory.class)
public @interface WithMockCustomUser {
    int userId() default 1;
    int collegeId() default 1;
    int roleId() default 1;
    String username() default "testuser";
}
