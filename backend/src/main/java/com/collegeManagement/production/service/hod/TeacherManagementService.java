package com.collegeManagement.production.service.hod;

import com.collegeManagement.production.dto.request.teacher.TeacherCreateRequest;
import com.collegeManagement.production.dto.request.teacher.TeacherUpdateRequest;
import com.collegeManagement.production.dto.response.teacher.TeacherResponseDTO;

import java.util.List;

public interface TeacherManagementService {
    TeacherResponseDTO createTeacher(TeacherCreateRequest request);
    List<TeacherResponseDTO> getAllTeachers();
    TeacherResponseDTO getTeacherById(Integer teacherId);
    TeacherResponseDTO updateTeacher(Integer teacherId, TeacherUpdateRequest request);
    void deleteTeacher(Integer teacherId);
}
