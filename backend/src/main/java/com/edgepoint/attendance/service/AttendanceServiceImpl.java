// src/main/java/com/collegeManagement/service/attendance/AttendanceServiceImpl.java
package com.edgepoint.attendance.service;

import com.edgepoint.academic.dto.RosterStudentDTO;
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
import com.edgepoint.core.exception.ResourceNotFoundException;
import com.edgepoint.attendance.repository.AttendanceRecordRepository;
import com.edgepoint.academic.repository.StudentEnrollmentRepository;
import com.edgepoint.academic.repository.TeacherAssignmentRepository;
import com.edgepoint.student.domain.StudentProfile;
import com.edgepoint.student.repository.StudentProfileRepository;
import com.edgepoint.core.security.TenantContext;
import com.edgepoint.notification.dispatch.NotificationMessage;
import com.edgepoint.notification.domain.NotificationEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;
    private final StudentEnrollmentRepository enrollmentRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TenantContext tenantContext;
    private final ApplicationEventPublisher eventPublisher;

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
        Set<Integer> enrolledIds = enrollments.stream()
                .map(StudentEnrollment::getStudentUserId)
                .collect(Collectors.toSet());

        Set<Integer> seen = new HashSet<>();
        for (StudentAttendanceDTO studentAtt : request.getStudentAttendances()) {
            Integer studentId = studentAtt.getStudentUserId();
            if (!enrolledIds.contains(studentId)) {
                throw new BadRequestException("Student " + studentId + " is not enrolled in this class");
            }
            if (!seen.add(studentId)) {
                throw new BadRequestException("Student " + studentId + " appears more than once");
            }
        }

        // One query for the day's register; re-saving the day updates it instead of failing.
        Map<Integer, AttendanceRecord> existingByStudent = attendanceRepository
                .findByAssignmentIdAndRecordDateAndIsDeletedFalse(request.getAssignmentId(), request.getRecordDate())
                .stream()
                .collect(Collectors.toMap(AttendanceRecord::getStudentUserId, Function.identity()));

        int presentCount = 0;
        int absentCount = 0;
        List<AttendanceRecord> records = new ArrayList<>();
        List<Integer> newlyAbsent = new ArrayList<>();

        for (StudentAttendanceDTO studentAtt : request.getStudentAttendances()) {
            AttendanceRecord record = existingByStudent.get(studentAtt.getStudentUserId());
            boolean wasAbsent = record != null && Boolean.FALSE.equals(record.getIsPresent());
            if (record == null) {
                record = new AttendanceRecord();
                record.setAssignmentId(request.getAssignmentId());
                record.setStudentUserId(studentAtt.getStudentUserId());
                record.setRecordDate(request.getRecordDate());
                record.setCreatedBy(teacherId);
            } else {
                record.setUpdatedBy(teacherId);
            }
            record.setIsPresent(studentAtt.getIsPresent());
            record.setRemarks(studentAtt.getRemarks());
            records.add(record);

            if (studentAtt.getIsPresent()) {
                presentCount++;
            } else {
                absentCount++;
                if (!wasAbsent) newlyAbsent.add(studentAtt.getStudentUserId());
            }
        }

        attendanceRepository.saveAll(records);
        int markedCount = records.size();
        log.info("Attendance saved for {} students on {}", markedCount, request.getRecordDate());

        notifyAbsences(newlyAbsent, request.getRecordDate());

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

    /** Best effort: a problem notifying a parent must never fail attendance marking. */
    private void notifyAbsences(List<Integer> absentStudentIds, LocalDate recordDate) {
        if (absentStudentIds.isEmpty()) return;
        Integer collegeId = tenantContext.getCollegeId();
        try {
            for (StudentProfile student : studentProfileRepository.findByStudentUserIdInAndIsDeletedFalse(absentStudentIds)) {
                try {
                    String name = student.getUser() != null ? student.getUser().getFullName() : student.getRollNumber();
                    eventPublisher.publishEvent(new NotificationMessage(
                            collegeId, NotificationEventType.ATTENDANCE_ABSENCE,
                            student.getParentEmail(), student.getParentPhone(),
                            "Absence notice: " + name,
                            name + " (roll no. " + student.getRollNumber() + ") was marked absent on "
                                    + recordDate + "."));
                } catch (RuntimeException e) {
                    log.warn("Could not queue absence notification for student {}: {}", student.getStudentUserId(), e.getMessage());
                }
            }
        } catch (RuntimeException e) {
            log.warn("Could not load profiles for absence notifications: {}", e.getMessage());
        }
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

    @Override
    @Transactional(readOnly = true)
    public List<RosterStudentDTO> getRoster(Integer assignmentId) {
        validateTeacherAccess(assignmentId);

        TeacherAssignment assignment = teacherAssignmentRepository
                .findByAssignmentIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        List<StudentEnrollment> enrollments = enrollmentRepository
                .findActiveByClassId(assignment.getClassSubject().getClassId());

        Map<Integer, StudentProfile> profiles = studentProfileRepository
                .findByStudentUserIdInAndIsDeletedFalse(enrollments.stream().map(StudentEnrollment::getStudentUserId).toList())
                .stream()
                .collect(Collectors.toMap(StudentProfile::getStudentUserId, Function.identity()));

        return enrollments.stream()
                .map(e -> {
                    StudentProfile profile = profiles.get(e.getStudentUserId());
                    return RosterStudentDTO.builder()
                            .studentUserId(e.getStudentUserId())
                            .rollNumber(profile != null ? profile.getRollNumber() : null)
                            .fullName(e.getStudent().getFullName())
                            .build();
                })
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