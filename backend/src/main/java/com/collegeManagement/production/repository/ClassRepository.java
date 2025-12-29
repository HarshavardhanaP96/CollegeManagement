// src/main/java/com/collegeManagement/repository/ClassRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.Class;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<Class, Integer> {

    Optional<Class> findByClassIdAndIsDeletedFalse(Integer classId);

    @Query("SELECT c FROM Class c WHERE c.deptId = :deptId AND c.isDeleted = false")
    List<Class> findByDeptIdAndIsDeletedFalse(@Param("deptId") Integer deptId);

    @Query("SELECT c FROM Class c WHERE c.deptId = :deptId AND c.academicYear = :academicYear " +
            "AND c.semester = :semester AND c.isDeleted = false")
    List<Class> findByDeptAndSemester(@Param("deptId") Integer deptId,
                                      @Param("academicYear") String academicYear,
                                      @Param("semester") Integer semester);

    @Query("SELECT COUNT(c) FROM Class c JOIN Department d ON c.deptId = d.deptId " +
            "WHERE d.collegeId = :collegeId AND c.isDeleted = false")
    Integer countByCollegeId(@Param("collegeId") Integer collegeId);
}