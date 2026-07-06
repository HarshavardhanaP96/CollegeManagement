package com.edgepoint.student.service;

import com.edgepoint.student.dto.StudentCreateRequest;
import com.edgepoint.student.dto.StudentUpdateRequest;
import com.edgepoint.student.dto.StudentResponseDTO;

import java.util.List;

public interface StudentManagementService {
    StudentResponseDTO createStudent(StudentCreateRequest request);
    List<StudentResponseDTO> getAllStudents();
    StudentResponseDTO getStudentById(Integer studentId);
    StudentResponseDTO updateStudent(Integer studentId, StudentUpdateRequest request);
    void deleteStudent(Integer studentId);
}
