// src/main/java/com/collegeManagement/service/student/StudentMarksService.java
package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.response.student.StudentMarkDTO;
import com.collegeManagement.production.dto.response.student.SubjectMarkDTO;

public interface StudentMarkService {
    StudentMarkDTO getMyMarks(Integer semester);
    SubjectMarkDTO getMarksBySubject(Integer subjectId);
}