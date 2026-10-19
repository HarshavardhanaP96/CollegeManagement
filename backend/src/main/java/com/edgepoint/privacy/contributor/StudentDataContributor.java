package com.edgepoint.privacy.contributor;

import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class StudentDataContributor implements PersonalDataContributor {

    /** parent_phone is NOT NULL, so anonymisation stores this fixed placeholder. */
    static final String PHONE_PLACEHOLDER = "0000000000";

    private final StudentProfileRepository profiles;

    @Override
    public String section() {
        return "student";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        Map<String, Object> data = new LinkedHashMap<>();
        profiles.findById(userId).ifPresent(p -> {
            data.put("rollNumber", p.getRollNumber());
            data.put("admissionYear", p.getAdmissionYear());
            data.put("currentSemester", p.getCurrentSemester());
            data.put("parentName", p.getParentName());
            data.put("parentPhone", p.getParentPhone());
            data.put("parentEmail", p.getParentEmail());
            data.put("dateOfBirth", p.getDateOfBirth() == null ? null : p.getDateOfBirth().toString());
            data.put("address", p.getAddress());
        });
        return data;
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of("parentName", "parentPhone", "parentEmail", "address");
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        Optional<StudentProfile> found = profiles.findById(userId);
        if (found.isEmpty()) {
            return;
        }
        StudentProfile p = found.get();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String value = e.getValue();
            if (value == null || value.isBlank()) {
                throw new BusinessRuleViolationException("Value is required for " + e.getKey());
            }
            switch (e.getKey()) {
                case "parentName" -> p.setParentName(value.trim());
                case "parentPhone" -> p.setParentPhone(value.trim());
                case "parentEmail" -> p.setParentEmail(value.trim());
                case "address" -> p.setAddress(value.trim());
                default -> throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
        }
        profiles.save(p);
    }

    @Override
    public void anonymise(Integer userId) {
        profiles.findById(userId).ifPresent(p -> {
            p.setDateOfBirth(null);
            p.setAddress(null);
            p.setParentName(null);
            p.setParentEmail(null);
            p.setParentPhone(PHONE_PLACEHOLDER);
            profiles.save(p);
        });
    }
}
