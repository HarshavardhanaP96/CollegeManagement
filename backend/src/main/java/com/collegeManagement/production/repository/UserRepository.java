// src/main/java/com/collegeManagement/repository/UserRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsernameAndIsDeletedFalse(String username);

    Optional<User> findByEmailAndIsDeletedFalse(String email);

    @Query("SELECT u FROM User u WHERE (u.username = :identifier OR u.email = :identifier) " +
            "AND u.isDeleted = false AND u.isActive = true")
    Optional<User> findByUsernameOrEmail(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE u.collegeId = :collegeId AND u.roleId = :roleId " +
            "AND u.isDeleted = false")
    List<User> findByCollegeAndRole(@Param("collegeId") Integer collegeId,
                                    @Param("roleId") Integer roleId);

    boolean existsByUsernameAndIsDeletedFalse(String username);

    boolean existsByEmailAndIsDeletedFalse(String email);

    @Query("SELECT COUNT(u) FROM User u WHERE u.collegeId = :collegeId AND u.roleId = :roleId " +
            "AND u.isDeleted = false AND u.isActive = true")
    Integer countByCollegeAndRole(@Param("collegeId") Integer collegeId,
                                  @Param("roleId") Integer roleId);
}