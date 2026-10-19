package com.edgepoint.privacy.contributor;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StudentDataContributorTest {

    @Mock StudentProfileRepository profiles;
    StudentDataContributor contributor;
    StudentProfile profile;

    @BeforeEach
    void setUp() {
        contributor = new StudentDataContributor(profiles);
        profile = new StudentProfile();
        profile.setStudentUserId(42);
        profile.setRollNumber("R-100");
        profile.setAdmissionYear(2024);
        profile.setCurrentSemester(3);
        profile.setParentName("Ravi Rao");
        profile.setParentPhone("9000000000");
        profile.setParentEmail("ravi@home.test");
        profile.setDateOfBirth(LocalDate.of(2005, 4, 2));
        profile.setAddress("12 Lake Road");
        when(profiles.findById(42)).thenReturn(Optional.of(profile));
        when(profiles.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void exportListsTheProfileFields() {
        Map<String, Object> data = contributor.export(42);
        assertThat(contributor.section()).isEqualTo("student");
        assertThat(data).containsEntry("rollNumber", "R-100")
                .containsEntry("parentName", "Ravi Rao")
                .containsEntry("dateOfBirth", "2005-04-02")
                .containsEntry("address", "12 Lake Road");
    }

    @Test
    void exportIsEmptyWhenTheUserHasNoStudentProfile() {
        when(profiles.findById(7)).thenReturn(Optional.empty());
        assertThat(contributor.export(7)).isEmpty();
    }

    @Test
    void correctableFieldsAreTheContactFieldsOnly() {
        assertThat(contributor.correctableFields())
                .containsExactlyInAnyOrder("parentName", "parentPhone", "parentEmail", "address");
    }

    @Test
    void correctUpdatesAddress() {
        contributor.correct(42, Map.of("address", "7 New Street"));
        assertThat(profile.getAddress()).isEqualTo("7 New Street");
        verify(profiles).save(profile);
    }

    @Test
    void parentPhoneCannotBeBlankBecauseTheColumnIsMandatory() {
        assertThatThrownBy(() -> contributor.correct(42, Map.of("parentPhone", "")))
                .isInstanceOf(BusinessRuleViolationException.class);
    }

    @Test
    void anonymiseClearsPersonalFieldsButKeepsTheRollNumber() {
        contributor.anonymise(42);

        assertThat(profile.getDateOfBirth()).isNull();
        assertThat(profile.getAddress()).isNull();
        assertThat(profile.getParentName()).isNull();
        assertThat(profile.getParentEmail()).isNull();
        assertThat(profile.getParentPhone()).isEqualTo("0000000000");
        assertThat(profile.getRollNumber()).isEqualTo("R-100");
    }

    @Test
    void anonymiseWithoutAProfileDoesNothing() {
        when(profiles.findById(7)).thenReturn(Optional.empty());
        contributor.anonymise(7);
        verify(profiles, never()).save(any());
    }

    @Test
    void appliesOnlyToUsersWithAStudentProfile() {
        when(profiles.existsById(42)).thenReturn(true);
        when(profiles.existsById(5)).thenReturn(false);
        assertThat(contributor.appliesTo(42)).isTrue();
        assertThat(contributor.appliesTo(5)).isFalse();
    }
}
