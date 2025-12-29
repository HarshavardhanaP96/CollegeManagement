// src/main/java/com/collegeManagement/service/student/StudentAttendanceService.java
package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.response.student.StudentAttendanceDTO;
import com.collegeManagement.production.dto.response.student.SubjectAttendanceDTO;

public interface StudentAttendanceService {
    StudentAttendanceDTO getMyAttendance(Integer semester);
    SubjectAttendanceDTO getAttendanceBySubject(Integer subjectId);
}