package com.edgepoint.privacy.contributor;

import com.edgepoint.core.domain.User;
import com.edgepoint.core.exception.BusinessRuleViolationException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserDataContributor implements PersonalDataContributor {

    private final UserRepository users;

    @Override
    public String section() {
        return "account";
    }

    @Override
    public Map<String, Object> export(Integer userId) {
        User u = load(userId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fullName", u.getFullName());
        data.put("email", u.getEmail());
        data.put("username", u.getUsername());
        data.put("phone", u.getPhone());
        data.put("createdAt", String.valueOf(u.getCreatedAt()));
        return data;
    }

    @Override
    public Set<String> correctableFields() {
        return Set.of("fullName", "phone");
    }

    @Override
    public void correct(Integer userId, Map<String, String> fields) {
        User u = load(userId);
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String value = e.getValue();
            if (!correctableFields().contains(e.getKey())) {
                throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
            if (value == null || value.isBlank()) {
                throw new BusinessRuleViolationException("Value is required for " + e.getKey());
            }
            switch (e.getKey()) {
                case "fullName" -> u.setFullName(value.trim());
                case "phone" -> u.setPhone(value.trim());
                default -> throw new BusinessRuleViolationException("Field cannot be corrected: " + e.getKey());
            }
        }
        users.save(u);
    }

    @Override
    public boolean appliesTo(Integer userId) {
        return users.existsById(userId);
    }

    @Override
    public void anonymise(Integer userId) {
        User u = load(userId);
        if (u.getAnonymisedAt() != null) {
            return;
        }
        u.setUsername("erased-" + userId);
        u.setEmail("erased-" + userId + "@invalid.local");
        u.setFullName("Erased User");
        u.setPhone(null);
        u.setIsActive(false);
        u.setPasswordHash("!" + UUID.randomUUID());
        u.setAnonymisedAt(LocalDateTime.now());
        users.save(u);
    }

    private User load(Integer userId) {
        return users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }
}
