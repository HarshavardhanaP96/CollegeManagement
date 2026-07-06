// src/main/java/com/collegeManagement/service/student/StudentAttendanceServiceImpl.java
package com.edgepoint.attendance.service;

import com.edgepoint.student.dto.StudentAttendanceDTO;
import com.edgepoint.student.dto.SubjectAttendanceDTO;
import com.edgepoint.attendance.domain.AttendanceRecord;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.academic.domain.Subject;
import com.edgepoint.attendance.repository.AttendanceRecordRepository;
import com.edgepoint.student.repository.StudentProfileRepository;
import com.edgepoint.academic.repository.SubjectRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentAttendanceServiceImpl implements StudentAttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SubjectRepository subjectRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional(readOnly = true)
    public StudentAttendanceDTO getMyAttendance(Integer semester) {
        Integer studentUserId = tenantContext.getCurrentUserId();

        StudentProfile profile = studentProfileRepository
                .findByStudentUserIdAndIsDeletedFalse(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        List<AttendanceRecord> allRecords = attendanceRepository.findByStudentId(studentUserId);

        // Group by subject
        Map<Integer, List<AttendanceRecord>> recordsBySubject = allRecords.stream()
                .collect(Collectors.groupingBy(r -> r.getAssignment().getClassSubject().getSubjectId()));

        List<SubjectAttendanceDTO> subjectAttendances = new ArrayList<>();
        int totalPresent = 0;
        int totalClasses = 0;

        for (Map.Entry<Integer, List<AttendanceRecord>> entry : recordsBySubject.entrySet()) {
            Subject subject = subjectRepository.findById(entry.getKey()).orElse(null);
            if (subject == null) continue;

            List<AttendanceRecord> records = entry.getValue();
            int subjectTotal = records.size();
            long subjectPresent = records.stream().filter(AttendanceRecord::getIsPresent).count();

            subjectAttendances.add(SubjectAttendanceDTO.builder()
                    .subjectId(subject.getSubjectId())
                    .subjectName(subject.getSubjectName())
                    .totalClasses(subjectTotal)
                    .presentCount((int) subjectPresent)
                    .absentCount(subjectTotal - (int) subjectPresent)
                    .attendancePercentage(calculatePercentage((int) subjectPresent, subjectTotal))
                    .build());

            totalPresent += subjectPresent;
            totalClasses += subjectTotal;
        }

        return StudentAttendanceDTO.builder()
                .studentUserId(studentUserId)
                .studentName(profile.getUser().getFullName())
                .rollNumber(profile.getRollNumber())
                .semester(semester != null ? semester : profile.getCurrentSemester())
                .subjectAttendances(subjectAttendances)
                .overallAttendance(calculatePercentage(totalPresent, totalClasses))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectAttendanceDTO getAttendanceBySubject(Integer subjectId) {
        Integer studentUserId = tenantContext.getCurrentUserId();

        List<AttendanceRecord> records = attendanceRepository.findByStudentId(studentUserId).stream()
                .filter(r -> r.getAssignment().getClassSubject().getSubjectId().equals(subjectId))
                .collect(Collectors.toList());

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        int total = records.size();
        long present = records.stream().filter(AttendanceRecord::getIsPresent).count();

        return SubjectAttendanceDTO.builder()
                .subjectId(subject.getSubjectId())
                .subjectName(subject.getSubjectName())
                .totalClasses(total)
                .presentCount((int) present)
                .absentCount(total - (int) present)
                .attendancePercentage(calculatePercentage((int) present, total))
                .build();
    }

    private Double calculatePercentage(int part, int total) {
        if (total == 0) return 0.0;
        return ((double) part / total) * 100.0;
    }
}