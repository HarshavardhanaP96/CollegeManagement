// src/main/java/com/collegeManagement/repository/ClassRepository.java
package com.edgepoint.academic.repository;


import com.edgepoint.academic.domain.Department;

import com.edgepoint.academic.domain.AcademicClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassRepository extends JpaRepository<AcademicClass, Integer> {

    Optional<AcademicClass> findByClassIdAndIsDeletedFalse(Integer classId);

    @Query("SELECT c FROM AcademicClass c WHERE c.deptId = :deptId AND c.isDeleted = false")
    List<AcademicClass> findByDeptIdAndIsDeletedFalse(@Param("deptId") Integer deptId);

    @Query("SELECT c FROM AcademicClass c WHERE c.deptId = :deptId AND c.academicYear = :academicYear " +
            "AND c.semester = :semester AND c.isDeleted = false")
    List<AcademicClass> findByDeptAndSemester(@Param("deptId") Integer deptId,
                                      @Param("academicYear") String academicYear,
                                      @Param("semester") Integer semester);

    @Query("SELECT COUNT(c) FROM AcademicClass c JOIN Department d ON c.deptId = d.deptId " +
            "WHERE d.collegeId = :collegeId AND c.isDeleted = false")
    Integer countByCollegeId(@Param("collegeId") Integer collegeId);

    @Query("SELECT c FROM AcademicClass c JOIN Department d ON c.deptId = d.deptId " +
            "WHERE d.collegeId = :collegeId AND c.isDeleted = false")
    List<AcademicClass> findByCollegeIdAndIsDeletedFalse(@Param("collegeId") Integer collegeId);
}