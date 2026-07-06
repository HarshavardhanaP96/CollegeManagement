package com.edgepoint.teacher.service;

import com.edgepoint.teacher.dto.TeacherCreateRequest;
import com.edgepoint.teacher.dto.TeacherUpdateRequest;
import com.edgepoint.teacher.dto.TeacherResponseDTO;

import java.util.List;

public interface TeacherManagementService {
    TeacherResponseDTO createTeacher(TeacherCreateRequest request);
    List<TeacherResponseDTO> getAllTeachers();
    TeacherResponseDTO getTeacherById(Integer teacherId);
    TeacherResponseDTO updateTeacher(Integer teacherId, TeacherUpdateRequest request);
    void deleteTeacher(Integer teacherId);
}
