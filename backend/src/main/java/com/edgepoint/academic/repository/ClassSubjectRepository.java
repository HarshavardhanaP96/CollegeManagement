// src/main/java/com/collegeManagement/repository/ClassSubjectRepository.java
package com.edgepoint.academic.repository;

import com.edgepoint.academic.domain.ClassSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassSubjectRepository extends JpaRepository<ClassSubject, Integer> {

    Optional<ClassSubject> findByClassSubjectIdAndIsDeletedFalse(Integer classSubjectId);

    @Query("SELECT cs FROM ClassSubject cs WHERE cs.classId = :classId AND cs.isDeleted = false")
    List<ClassSubject> findByClassIdAndIsDeletedFalse(@Param("classId") Integer classId);

    boolean existsByClassIdAndSubjectIdAndIsDeletedFalse(Integer classId, Integer subjectId);
}