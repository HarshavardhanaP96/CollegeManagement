// src/main/java/com/collegeManagement/repository/SubjectRepository.java
package com.edgepoint.academic.repository;

import com.edgepoint.academic.domain.Department;

import com.edgepoint.academic.domain.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Integer> {

    Optional<Subject> findBySubjectIdAndIsDeletedFalse(Integer subjectId);

    @Query("SELECT s FROM Subject s WHERE s.deptId = :deptId AND s.isDeleted = false")
    List<Subject> findByDeptIdAndIsDeletedFalse(@Param("deptId") Integer deptId);

    boolean existsBySubjectCodeAndDeptIdAndIsDeletedFalse(String subjectCode, Integer deptId);

    @Query("SELECT COUNT(s) FROM Subject s JOIN Department d ON s.deptId = d.deptId " +
            "WHERE d.collegeId = :collegeId AND s.isDeleted = false")
    Integer countByCollegeId(@Param("collegeId") Integer collegeId);
}