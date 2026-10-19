package com.edgepoint.privacy.service;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.security.TenantContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrivacyTenantTest {

    @Mock TenantContext context;

    @Test
    void collegeAdminAlwaysGetsOwnCollegeEvenIfAnotherIsRequested() {
        when(context.getCollegeId()).thenReturn(7);
        assertThat(new PrivacyTenant(context).collegeId(99)).isEqualTo(7);
        assertThat(new PrivacyTenant(context).collegeId()).isEqualTo(7);
    }

    @Test
    void superadminWithoutCollegeMustSayWhichCollege() {
        when(context.getCollegeId()).thenReturn(null);
        PrivacyTenant tenant = new PrivacyTenant(context);

        assertThat(tenant.collegeId(5)).isEqualTo(5);
        assertThatThrownBy(() -> tenant.collegeId(null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("collegeId");
        assertThatThrownBy(tenant::collegeId).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void userIdIsRequired() {
        when(context.getCurrentUserId()).thenReturn(null);
        assertThatThrownBy(() -> new PrivacyTenant(context).userId())
                .isInstanceOf(BusinessRuleViolationException.class);
        when(context.getCurrentUserId()).thenReturn(42);
        assertThat(new PrivacyTenant(context).userId()).isEqualTo(42);
    }
}
