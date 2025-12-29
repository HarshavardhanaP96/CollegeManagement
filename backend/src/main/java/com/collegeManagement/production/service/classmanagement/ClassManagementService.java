// src/main/java/com/collegeManagement/service/classmanagement/ClassManagementService.java
package com.collegeManagement.production.service.classmanagement;

import com.collegeManagement.production.dto.request.classmanagement.AddSubjectToClassRequest;
import com.collegeManagement.production.dto.request.classmanagement.ClassCreateRequest;
import com.collegeManagement.production.dto.request.classmanagement.TeacherAssignRequest;
import com.collegeManagement.production.dto.response.classmanagement.ClassResponseDTO;

import java.util.List;

public interface ClassManagementService {
    ClassResponseDTO createClass(ClassCreateRequest request);
    ClassResponseDTO getClassById(Integer classId);
    List<ClassResponseDTO> getAllClasses();
    ClassResponseDTO addSubjectToClass(Integer classId, AddSubjectToClassRequest request);
    void assignTeacher(TeacherAssignRequest request);
    void deleteClass(Integer classId);
}