// src/main/java/com/collegeManagement/repository/UserRoleRepository.java
package com.edgepoint.core.repository;

import com.edgepoint.core.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    Optional<UserRole> findByRoleName(String roleName);
}