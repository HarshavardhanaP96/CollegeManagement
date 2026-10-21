package com.edgepoint.privacy.service;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.repository.UserRepository;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.security.TenantContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
class PrivacyTenantTest {

    @Mock TenantContext context;
    @Mock UserRepository users;

    @Test
    void collegeAdminAlwaysGetsOwnCollegeEvenIfAnotherIsRequested() {
        when(context.getCollegeId()).thenReturn(7);
        assertThat(new PrivacyTenant(context, users).collegeId(99)).isEqualTo(7);
        assertThat(new PrivacyTenant(context, users).collegeId()).isEqualTo(7);
    }

    @Test
    void superadminWithoutCollegeMustSayWhichCollege() {
        when(context.getCollegeId()).thenReturn(null);
        PrivacyTenant tenant = new PrivacyTenant(context, users);

        assertThat(tenant.collegeId(5)).isEqualTo(5);
        assertThatThrownBy(() -> tenant.collegeId(null))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("collegeId");
        assertThatThrownBy(tenant::collegeId).isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void userIdIsRequired() {
        when(context.getCurrentUserId()).thenReturn(null);
        assertThatThrownBy(() -> new PrivacyTenant(context, users).userId())
                .isInstanceOf(BusinessRuleViolationException.class);
        when(context.getCurrentUserId()).thenReturn(42);
        assertThat(new PrivacyTenant(context, users).userId()).isEqualTo(42);
    }

    @Test
    void requireActiveUserRefusesAnErasedAccount() {
        when(context.getCurrentUserId()).thenReturn(42);
        User erased = new User();
        erased.setUserId(42);
        erased.setAnonymisedAt(LocalDateTime.now());
        when(users.findById(42)).thenReturn(Optional.of(erased));

        assertThatThrownBy(() -> new PrivacyTenant(context, users).requireActiveUser())
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("This account has been erased");
    }

    @Test
    void requireActiveUserAcceptsALiveAccount() {
        when(context.getCurrentUserId()).thenReturn(42);
        User live = new User();
        live.setUserId(42);
        when(users.findById(42)).thenReturn(Optional.of(live));

        new PrivacyTenant(context, users).requireActiveUser();
    }
}
