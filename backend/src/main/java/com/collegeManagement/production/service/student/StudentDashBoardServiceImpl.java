// src/main/java/com/collegeManagement/service/student/StudentDashboardServiceImpl.java
package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.response.student.StudentDashBoardDTO;
import com.collegeManagement.production.entity.StudentProfile;
import com.collegeManagement.production.repository.StudentProfileRepository;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentDashBoardServiceImpl implements StudentDashboardService {

    private final StudentProfileRepository studentProfileRepository;
    private final StudentMarkService studentMarkService;
    private final StudentAttendanceService studentAttendanceService;
    private final TenantContext tenantContext;

    @Override
    @Transactional(readOnly = true)
    public StudentDashBoardDTO getDashboard() {
        Integer studentUserId = tenantContext.getCurrentUserId();

        StudentProfile profile = studentProfileRepository
                .findByStudentUserIdAndIsDeletedFalse(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        var attendance = studentAttendanceService.getMyAttendance(null);
        var marks = studentMarkService.getMyMarks(null);

        return StudentDashBoardDTO.builder()
                .studentName(profile.getUser().getFullName())
                .rollNumber(profile.getRollNumber())
                .department(profile.getDepartment().getDeptName())
                .course(profile.getCourse().getCourseName())
                .currentSemester(profile.getCurrentSemester())
                .overallAttendance(attendance.getOverallAttendance())
                .overallPercentage(marks.getOverallPercentage())
                .totalSubjects(attendance.getSubjectAttendances().size())
                .recentAttendance(attendance)
                .recentMarks(marks)
                .build();
    }
}