package com.edgepoint.privacy.contributor;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserDataContributorTest {

    @Mock UserRepository users;
    UserDataContributor contributor;
    User user;

    @BeforeEach
    void setUp() {
        contributor = new UserDataContributor(users);
        user = new User();
        user.setUserId(42);
        user.setUsername("asha");
        user.setEmail("asha@college.test");
        user.setFullName("Asha Rao");
        user.setPhone("9999999999");
        user.setPasswordHash("hash");
        user.setIsActive(true);
        when(users.findById(42)).thenReturn(Optional.of(user));
        when(users.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void exportContainsTheAccountFields() {
        Map<String, Object> data = contributor.export(42);
        assertThat(contributor.section()).isEqualTo("account");
        assertThat(data).containsEntry("fullName", "Asha Rao")
                .containsEntry("email", "asha@college.test")
                .containsEntry("username", "asha")
                .containsEntry("phone", "9999999999")
                .doesNotContainKey("passwordHash");
    }

    @Test
    void onlyNameAndPhoneAreCorrectable() {
        assertThat(contributor.correctableFields()).containsExactlyInAnyOrder("fullName", "phone");
    }

    @Test
    void correctUpdatesTheGivenFieldsOnly() {
        contributor.correct(42, Map.of("phone", "8888888888"));
        assertThat(user.getPhone()).isEqualTo("8888888888");
        assertThat(user.getFullName()).isEqualTo("Asha Rao");
        verify(users).save(user);
    }

    @Test
    void correctRejectsBlankValues() {
        assertThatThrownBy(() -> contributor.correct(42, Map.of("fullName", "  ")))
                .isInstanceOf(BusinessRuleViolationException.class);
        verify(users, never()).save(any());
    }

    @Test
    void correctRejectsAFieldThatIsNotCorrectable() {
        assertThatThrownBy(() -> contributor.correct(42, Map.of("email", "evil@x.test")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void anonymiseReplacesIdentifiersAndDisablesTheAccount() {
        contributor.anonymise(42);

        assertThat(user.getUsername()).isEqualTo("erased-42");
        assertThat(user.getEmail()).isEqualTo("erased-42@invalid.local");
        assertThat(user.getFullName()).isEqualTo("Erased User");
        assertThat(user.getPhone()).isNull();
        assertThat(user.getIsActive()).isFalse();
        assertThat(user.getPasswordHash()).isNotEqualTo("hash").startsWith("!");
        assertThat(user.getAnonymisedAt()).isNotNull();
    }

    @Test
    void anonymiseTwiceChangesNothingSecondTime() {
        user.setAnonymisedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        user.setFullName("Erased User");

        contributor.anonymise(42);

        verify(users, never()).save(any());
        assertThat(user.getAnonymisedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 0, 0));
    }

    @Test
    void unknownUserIsNotFound() {
        when(users.findById(7)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> contributor.anonymise(7)).isInstanceOf(ResourceNotFoundException.class);
    }
}
