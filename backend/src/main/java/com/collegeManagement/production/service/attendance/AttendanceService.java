// src/main/java/com/collegeManagement/service/attendance/AttendanceService.java
package com.collegeManagement.production.service.attendance;

import com.collegeManagement.production.dto.request.attendance.AttendanceCreateRequest;
import com.collegeManagement.production.dto.request.attendance.AttendanceUpdateRequest;
import com.collegeManagement.production.dto.response.attendance.AttendanceResponseDTO;
import com.collegeManagement.production.dto.response.attendance.AttendanceSummaryDTO;
import com.collegeManagement.production.dto.response.teacher.TeacherAssignmentDTO;

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
}