// src/main/java/com/collegeManagement/service/student/StudentAttendanceService.java
package com.edgepoint.attendance.service;

import com.edgepoint.student.dto.StudentAttendanceDTO;
import com.edgepoint.student.dto.SubjectAttendanceDTO;

public interface StudentAttendanceService {
    StudentAttendanceDTO getMyAttendance(Integer semester);
    SubjectAttendanceDTO getAttendanceBySubject(Integer subjectId);
}