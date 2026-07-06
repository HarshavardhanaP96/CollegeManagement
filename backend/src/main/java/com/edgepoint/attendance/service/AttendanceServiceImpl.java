// src/main/java/com/collegeManagement/service/attendance/AttendanceServiceImpl.java
package com.edgepoint.attendance.service;

import com.edgepoint.attendance.dto.AttendanceCreateRequest;
import com.edgepoint.attendance.dto.AttendanceUpdateRequest;
import com.edgepoint.attendance.dto.StudentAttendanceDTO;
import com.edgepoint.attendance.dto.AttendanceResponseDTO;
import com.edgepoint.attendance.dto.AttendanceSummaryDTO;
import com.edgepoint.teacher.dto.TeacherAssignmentDTO;
import com.edgepoint.attendance.domain.AttendanceRecord;
import com.edgepoint.academic.domain.StudentEnrollment;
import com.edgepoint.academic.domain.TeacherAssignment;
import com.edgepoint.core.exception.BadRequestException;
import com.edgepoint.core.exception.DuplicateResourceException;
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.attendance.repository.AttendanceRecordRepository;
import com.edgepoint.academic.repository.StudentEnrollmentRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;
import com.edgepoint.core.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public AttendanceSummaryDTO markAttendance(AttendanceCreateRequest request) {
        Integer teacherId = tenantContext.getCurrentUserId();

        // Validate teacher assignment
        TeacherAssignment assignment = teacherAssignmentRepository
                .findByAssignmentIdAndIsDeletedFalse(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        if (!assignment.getTeacherUserId().equals(teacherId)) {
            throw new BadRequestException("You are not assigned to this class-subject");
        }

        // Get enrolled students
        List<StudentEnrollment> enrollments = enrollmentRepository
                .findActiveByClassId(assignment.getClassSubject().getClassId());

        int presentCount = 0;
        int absentCount = 0;
        int markedCount = 0;

        List<AttendanceRecord> records = new ArrayList<>();

        for (StudentAttendanceDTO studentAtt : request.getStudentAttendances()) {
            // Check for duplicates
            if (attendanceRepository.existsByAssignmentIdAndStudentUserIdAndRecordDateAndIsDeletedFalse(
                    request.getAssignmentId(), studentAtt.getStudentUserId(), request.getRecordDate())) {
                throw new DuplicateResourceException(
                        "Attendance already marked for student: " + studentAtt.getStudentUserId());
            }

            AttendanceRecord record = new AttendanceRecord();
            record.setAssignmentId(request.getAssignmentId());
            record.setStudentUserId(studentAtt.getStudentUserId());
            record.setRecordDate(request.getRecordDate());
            record.setIsPresent(studentAtt.getIsPresent());
            record.setRemarks(studentAtt.getRemarks());
            record.setCreatedBy(teacherId);

            records.add(record);

            if (studentAtt.getIsPresent()) {
                presentCount++;
            } else {
                absentCount++;
            }
            markedCount++;
        }

        attendanceRepository.saveAll(records);
        log.info("Attendance marked for {} students on {}", markedCount, request.getRecordDate());

        return AttendanceSummaryDTO.builder()
                .assignmentId(request.getAssignmentId())
                .recordDate(request.getRecordDate())
                .totalStudents(enrollments.size())
                .presentCount(presentCount)
                .absentCount(absentCount)
                .markedCount(markedCount)
                .unmarkedCount(enrollments.size() - markedCount)
                .attendancePercentage(calculatePercentage(presentCount, markedCount))
                .build();
    }

    @Override
    @Transactional
    public AttendanceResponseDTO updateAttendance(Integer attendanceId, AttendanceUpdateRequest request) {
        AttendanceRecord record = attendanceRepository.findByAttendanceIdAndIsDeletedFalse(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        validateTeacherAccess(record.getAssignmentId());

        record.setIsPresent(request.getIsPresent());
        if (request.getRemarks() != null) {
            record.setRemarks(request.getRemarks());
        }
        record.setUpdatedBy(tenantContext.getCurrentUserId());

        AttendanceRecord updated = attendanceRepository.save(record);
        log.info("Attendance updated: {}", attendanceId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponseDTO> getAttendanceByAssignment(Integer assignmentId,
                                                                 LocalDate startDate,
                                                                 LocalDate endDate) {
        validateTeacherAccess(assignmentId);

        List<AttendanceRecord> records;
        if (startDate != null && endDate != null) {
            records = attendanceRepository.findByAssignmentIdAndDateRange(
                    assignmentId, startDate, endDate);
        } else {
            records = attendanceRepository.findByAssignmentId(assignmentId);
        }

        return records.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryDTO getAttendanceSummary(Integer assignmentId,
                                                     LocalDate startDate,
                                                     LocalDate endDate) {
        validateTeacherAccess(assignmentId);

        List<AttendanceRecord> records;
        if (startDate != null && endDate != null) {
            records = attendanceRepository.findByAssignmentIdAndDateRange(
                    assignmentId, startDate, endDate);
        } else {
            records = attendanceRepository.findByAssignmentId(assignmentId);
        }

        long presentCount = records.stream().filter(AttendanceRecord::getIsPresent).count();
        long totalMarked = records.size();

        return AttendanceSummaryDTO.builder()
                .assignmentId(assignmentId)
                .presentCount((int) presentCount)
                .absentCount((int) (totalMarked - presentCount))
                .markedCount((int) totalMarked)
                .attendancePercentage(calculatePercentage((int) presentCount, (int) totalMarked))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherAssignmentDTO> getTeacherAssignments() {
        Integer teacherId = tenantContext.getCurrentUserId();

        List<TeacherAssignment> assignments = teacherAssignmentRepository
                .findActiveByTeacherId(teacherId);

        return assignments.stream()
                .map(this::mapToAssignmentDTO)
                .collect(Collectors.toList());
    }

    private void validateTeacherAccess(Integer assignmentId) {
        Integer teacherId = tenantContext.getCurrentUserId();
        TeacherAssignment assignment = teacherAssignmentRepository
                .findByAssignmentIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        if (!assignment.getTeacherUserId().equals(teacherId)) {
            throw new BadRequestException("Access denied to this assignment");
        }
    }

    private double calculatePercentage(int part, int total) {
        if (total == 0) return 0.0;
        return (double) part / total * 100.0;
    }

    private AttendanceResponseDTO mapToResponseDTO(AttendanceRecord record) {
        AttendanceResponseDTO dto = new AttendanceResponseDTO();
        dto.setAttendanceId(record.getAttendanceId());
        dto.setAssignmentId(record.getAssignmentId());
        dto.setStudentUserId(record.getStudentUserId());
        dto.setStudentName(record.getStudent().getFullName());
        dto.setRecordDate(record.getRecordDate());
        dto.setIsPresent(record.getIsPresent());
        dto.setRemarks(record.getRemarks());
        dto.setCreatedAt(record.getCreatedAt());
        return dto;
    }

    private TeacherAssignmentDTO mapToAssignmentDTO(TeacherAssignment assignment) {
        TeacherAssignmentDTO dto = new TeacherAssignmentDTO();
        dto.setAssignmentId(assignment.getAssignmentId());
        dto.setClassId(assignment.getClassSubject().getClassId());
        dto.setClassName(assignment.getClassSubject().getClassEntity().getClassName());
        dto.setSubjectId(assignment.getClassSubject().getSubjectId());
        dto.setSubjectName(assignment.getClassSubject().getSubject().getSubjectName());
        return dto;
    }
}