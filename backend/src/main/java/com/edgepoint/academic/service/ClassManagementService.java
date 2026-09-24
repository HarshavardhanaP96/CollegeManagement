// src/main/java/com/collegeManagement/service/classmanagement/ClassManagementService.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.AddSubjectToClassRequest;
import com.edgepoint.academic.dto.ClassCreateRequest;
import com.edgepoint.academic.dto.ClassSubjectResponseDTO;
import com.edgepoint.academic.dto.TeacherAssignRequest;
import com.edgepoint.academic.dto.TeacherAssignmentResponseDTO;
import com.edgepoint.academic.dto.ClassResponseDTO;

import java.util.List;

public interface ClassManagementService {
    ClassResponseDTO createClass(ClassCreateRequest request);
    ClassResponseDTO getClassById(Integer classId);
    List<ClassResponseDTO> getAllClasses();
    ClassResponseDTO addSubjectToClass(Integer classId, AddSubjectToClassRequest request);
    List<ClassSubjectResponseDTO> getClassSubjects(Integer classId);
    void assignTeacher(TeacherAssignRequest request);
    List<TeacherAssignmentResponseDTO> getTeacherAssignmentsByClass(Integer classId);
    void deleteClass(Integer classId);
}