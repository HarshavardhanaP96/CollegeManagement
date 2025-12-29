// src/main/java/com/collegeManagement/service/student/StudentProfileService.java
package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.request.student.StudentProfileUpdateRequest;
import com.collegeManagement.production.dto.response.student.StudentProfileDTO;

public interface StudentProfileService {
    StudentProfileDTO getMyProfile();
    StudentProfileDTO updateMyProfile(StudentProfileUpdateRequest request);
}