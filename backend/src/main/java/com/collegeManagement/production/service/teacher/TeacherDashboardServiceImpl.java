package com.collegeManagement.production.service.teacher;

import com.collegeManagement.production.dto.response.teacher.RecentActivityDTO;
import com.collegeManagement.production.dto.response.teacher.TeacherAssignmentDTO;
import com.collegeManagement.production.dto.response.teacher.TeacherDashboardDTO;
import com.collegeManagement.production.entity.TeacherAssignment;
import com.collegeManagement.production.entity.TeacherProfile;
import com.collegeManagement.production.entity.ClassSubject;
import com.collegeManagement.production.exception.ResourceNotFoundException;
import com.collegeManagement.production.repository.StudentEnrollmentRepository;
import com.collegeManagement.production.repository.TeacherAssignmentRepository;
import com.collegeManagement.production.repository.TeacherProfileRepository;
import com.collegeManagement.production.security.TenantContext;
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
