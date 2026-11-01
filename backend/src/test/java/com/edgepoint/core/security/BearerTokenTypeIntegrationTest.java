package com.edgepoint.core.security;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.domain.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Only access tokens authenticate API requests")
class BearerTokenTypeIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private TenantContext tenantContext;

    private static User teacher() {
        UserRole role = new UserRole();
        role.setRoleId(4);
        role.setRoleName("TEACHER");
        User user = new User();
        user.setUserId(77);
        user.setCollegeId(1);
        user.setRoleId(4);
        user.setRole(role);
        user.setUsername("bearer-type-teacher");
        return user;
    }

    @Test
    @DisplayName("an access token authenticates")
    void accessTokenAuthenticates() throws Exception {
        mockMvc.perform(get("/auth/validate-token")
                        .header("Authorization", "Bearer " + jwtService.generateToken(teacher())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("the tenant context does not outlive the request (threads are pooled)")
    void tenantContextIsClearedAfterRequest() throws Exception {
        mockMvc.perform(get("/auth/validate-token")
                        .header("Authorization", "Bearer " + jwtService.generateToken(teacher())))
                .andExpect(status().isOk());

        assertThat(tenantContext.getCollegeId()).isNull();
        assertThat(tenantContext.getCurrentUserId()).isNull();
    }

    @Test
    @DisplayName("a refresh token used as a bearer token is not authenticated")
    void refreshTokenIsRejectedAsBearer() throws Exception {
        mockMvc.perform(get("/auth/validate-token")
                        .header("Authorization", "Bearer " + jwtService.generateRefreshToken(teacher())))
                .andExpect(status().is4xxClientError());
    }
}
