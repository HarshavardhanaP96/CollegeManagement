// src/main/java/com/collegeManagement/service/attendance/AttendanceService.java
package com.edgepoint.attendance.service;

import com.edgepoint.academic.dto.RosterStudentDTO;
import com.edgepoint.attendance.dto.AttendanceCreateRequest;
import com.edgepoint.attendance.dto.AttendanceUpdateRequest;
import com.edgepoint.attendance.dto.AttendanceResponseDTO;
import com.edgepoint.attendance.dto.AttendanceSummaryDTO;
import com.edgepoint.teacher.dto.TeacherAssignmentDTO;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    AttendanceSummaryDTO markAttendance(AttendanceCreateRequest request);
    AttendanceResponseDTO updateAttendance(Integer attendanceId, AttendanceUpdateRequest request);
    List<AttendanceResponseDTO> getAttendanceByAssignment(Integer assignmentId,
                                                          LocalDate startDate,
                                                          LocalDate endDate);
    AttendanceSummaryDTO getAttendanceSummary(Integer assignmentId,
                                              LocalDate startDate,
                                              LocalDate endDate);
    List<TeacherAssignmentDTO> getTeacherAssignments();
    /** Students enrolled in this assignment's class — the roster to mark. */
    List<RosterStudentDTO> getRoster(Integer assignmentId);
}