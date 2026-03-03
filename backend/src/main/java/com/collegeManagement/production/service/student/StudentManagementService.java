package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.request.student.StudentCreateRequest;
import com.collegeManagement.production.dto.request.student.StudentUpdateRequest;
import com.collegeManagement.production.dto.response.student.StudentResponseDTO;

import java.util.List;

public interface StudentManagementService {
    StudentResponseDTO createStudent(StudentCreateRequest request);
    List<StudentResponseDTO> getAllStudents();
    StudentResponseDTO getStudentById(Integer studentId);
    StudentResponseDTO updateStudent(Integer studentId, StudentUpdateRequest request);
    void deleteStudent(Integer studentId);
}
