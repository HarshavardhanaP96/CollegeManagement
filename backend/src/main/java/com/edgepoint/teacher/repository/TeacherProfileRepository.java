// src/main/java/com/collegeManagement/repository/TeacherProfileRepository.java
package com.edgepoint.teacher.repository;

import com.edgepoint.teacher.domain.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Integer> {

    Optional<TeacherProfile> findByTeacherUserIdAndIsDeletedFalse(Integer teacherUserId);

    @Query("SELECT tp FROM TeacherProfile tp WHERE tp.deptId = :deptId AND tp.isDeleted = false")
    List<TeacherProfile> findByDeptIdAndIsDeletedFalse(@Param("deptId") Integer deptId);

    boolean existsByEmployeeIdAndIsDeletedFalse(String employeeId);
}