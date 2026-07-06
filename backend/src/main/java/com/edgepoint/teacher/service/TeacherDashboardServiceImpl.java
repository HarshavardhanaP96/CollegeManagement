package com.edgepoint.teacher.service;


import com.edgepoint.academic.domain.AcademicClass;
import com.edgepoint.academic.domain.Department;
import com.edgepoint.academic.domain.Subject;

import com.edgepoint.teacher.dto.RecentActivityDTO;
import com.edgepoint.teacher.dto.TeacherAssignmentDTO;
import com.edgepoint.teacher.dto.TeacherDashboardDTO;
import com.edgepoint.academic.domain.TeacherAssignment;
import com.edgepoint.teacher.domain.TeacherProfile;
import com.edgepoint.academic.domain.ClassSubject;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.academic.repository.StudentEnrollmentRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;
import com.edgepoint.teacher.repository.TeacherProfileRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherDashboardServiceImpl implements TeacherDashboardService {

    private final TeacherProfileRepository teacherProfileRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final TenantContext tenantContext;

    @Override
    public TeacherDashboardDTO getDashboard() {
        Integer teacherUserId = tenantContext.getCurrentUserId();
        
        TeacherProfile profile = teacherProfileRepository.findByTeacherUserIdAndIsDeletedFalse(teacherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found"));

        List<TeacherAssignment> activeAssignments = teacherAssignmentRepository.findActiveByTeacherId(teacherUserId);
        
        // Calculate total students uniquely across all assigned classes
        Set<Integer> uniqueStudentIds = activeAssignments.stream()
                .filter(ta -> ta.getClassSubject() != null)
                .flatMap(ta -> studentEnrollmentRepository.findActiveByClassId(ta.getClassSubject().getClassId()).stream())
                .map(se -> se.getStudentUserId())
                .collect(Collectors.toSet());

        // Map assignments to DTO
        List<TeacherAssignmentDTO> assignmentDTOs = activeAssignments.stream()
                .filter(ta -> ta.getClassSubject() != null)
                .map(ta -> {
                    ClassSubject cs = ta.getClassSubject();
                    TeacherAssignmentDTO dto = new TeacherAssignmentDTO();
                    dto.setAssignmentId(ta.getAssignmentId());
                    dto.setClassId(cs.getClassId());
                    dto.setClassName(cs.getClassEntity() != null ? cs.getClassEntity().getClassName() : "Unknown Class");
                    dto.setSubjectId(cs.getSubjectId());
                    dto.setSubjectName(cs.getSubject() != null ? cs.getSubject().getSubjectName() : "Unknown Subject");
                    return dto;
                })
                .collect(Collectors.toList());

        return TeacherDashboardDTO.builder()
                .teacherName(profile.getUser().getFullName())
                .department(profile.getDepartment() != null ? profile.getDepartment().getDeptName() : "No Department")
                .totalAssignments(activeAssignments.size())
                .totalClasses((int) activeAssignments.stream()
                        .filter(ta -> ta.getClassSubject() != null)
                        .map(ta -> ta.getClassSubject().getClassId())
                        .distinct().count())
                .totalStudents(uniqueStudentIds.size())
                .activeAssignments(assignmentDTOs)
                .recentActivities(new ArrayList<>()) // Placeholder 
                .build();
    }
}
