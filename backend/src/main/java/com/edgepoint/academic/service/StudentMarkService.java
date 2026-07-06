// src/main/java/com/collegeManagement/service/student/StudentMarksService.java
package com.edgepoint.academic.service;

import com.edgepoint.student.dto.StudentMarkDTO;
import com.edgepoint.student.dto.SubjectMarkDTO;

public interface StudentMarkService {
    StudentMarkDTO getMyMarks(Integer semester);
    SubjectMarkDTO getMarksBySubject(Integer subjectId);
}