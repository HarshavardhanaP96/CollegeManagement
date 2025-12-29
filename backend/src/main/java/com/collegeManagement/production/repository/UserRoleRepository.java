// src/main/java/com/collegeManagement/repository/UserRoleRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    Optional<UserRole> findByRoleName(String roleName);
}