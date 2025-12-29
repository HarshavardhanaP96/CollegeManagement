// src/main/java/com/collegeManagement/repository/CourseRepository.java
package com.collegeManagement.production.repository;

import com.collegeManagement.production.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {

    Optional<Course> findByCourseIdAndIsDeletedFalse(Integer courseId);

    @Query("SELECT c FROM Course c WHERE c.collegeId = :collegeId AND c.isDeleted = false")
    List<Course> findByCollegeIdAndIsDeletedFalse(@Param("collegeId") Integer collegeId);

    boolean existsByCourseCodeAndCollegeIdAndIsDeletedFalse(String courseCode, Integer collegeId);

    @Query("SELECT COUNT(c) FROM Course c WHERE c.collegeId = :collegeId AND c.isDeleted = false")
    Integer countByCollegeId(@Param("collegeId") Integer collegeId);
}