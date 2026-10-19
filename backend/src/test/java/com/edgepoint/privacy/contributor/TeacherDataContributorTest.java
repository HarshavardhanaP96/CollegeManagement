package com.edgepoint.privacy.contributor;

import com.edgepoint.teacher.domain.TeacherProfile;
import com.edgepoint.teacher.repository.TeacherProfileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeacherDataContributorTest {

    @Mock TeacherProfileRepository profiles;

    @Test
    void exportListsTheProfileFields() {
        TeacherProfile p = new TeacherProfile();
        p.setTeacherUserId(5);
        p.setEmployeeId("E-9");
        p.setHireDate(LocalDate.of(2020, 6, 1));
        p.setSpecialization("Physics");
        p.setQualification("PhD");
        when(profiles.findById(5)).thenReturn(Optional.of(p));
        TeacherDataContributor contributor = new TeacherDataContributor(profiles);

        Map<String, Object> data = contributor.export(5);

        assertThat(contributor.section()).isEqualTo("teacher");
        assertThat(data).containsEntry("employeeId", "E-9").containsEntry("hireDate", "2020-06-01")
                .containsEntry("specialization", "Physics").containsEntry("qualification", "PhD");
    }

    @Test
    void exportIsEmptyWithoutAProfile() {
        when(profiles.findById(7)).thenReturn(Optional.empty());
        assertThat(new TeacherDataContributor(profiles).export(7)).isEmpty();
    }

    @Test
    void nothingIsCorrectableOrAnonymisedBecauseTheProfileHoldsNoDirectIdentifiers() {
        TeacherDataContributor contributor = new TeacherDataContributor(profiles);
        assertThat(contributor.correctableFields()).isEmpty();

        contributor.anonymise(5);

        verify(profiles, never()).save(any());
    }
}
