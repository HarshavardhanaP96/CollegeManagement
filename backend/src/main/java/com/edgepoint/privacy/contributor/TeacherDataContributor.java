package com.edgepoint.privacy.contributor;

import com.edgepoint.teacher.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TeacherDataContributor implements PersonalDataContributor {

    private final TeacherProfileRepository profiles;

    @Override
    public String section() {
        return "teacher";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        Map<String, Object> data = new LinkedHashMap<>();
        profiles.findById(userId).ifPresent(p -> {
            data.put("employeeId", p.getEmployeeId());
            data.put("hireDate", p.getHireDate() == null ? null : p.getHireDate().toString());
            data.put("specialization", p.getSpecialization());
            data.put("qualification", p.getQualification());
        });
        return data;
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of();
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        // Nothing in the teacher profile is self-correctable; name and phone live on the account.
    }

    @Override
    public void anonymise(Integer userId) {
        // employee_id is the pseudonymous record key and the other columns are not direct identifiers,
        // so nothing is cleared here; the account contributor removes the name, email and phone.
    }
}
