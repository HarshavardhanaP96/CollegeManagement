// src/main/java/com/collegeManagement/repository/DepartmentRepository.java
package com.edgepoint.academic.repository;

import com.edgepoint.academic.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    Optional<Department> findByDeptIdAndIsDeletedFalse(Integer deptId);

    @Query("SELECT d FROM Department d WHERE d.collegeId = :collegeId AND d.isDeleted = false")
    List<Department> findByCollegeIdAndIsDeletedFalse(@Param("collegeId") Integer collegeId);

    boolean existsByDeptCodeAndCollegeIdAndIsDeletedFalse(String deptCode, Integer collegeId);

    Optional<Department> findByDeptHeadUserIdAndIsDeletedFalse(Integer deptHeadUserId);

    @Query("SELECT COUNT(d) FROM Department d WHERE d.collegeId = :collegeId AND d.isDeleted = false")
    Integer countByCollegeId(@Param("collegeId") Integer collegeId);
}