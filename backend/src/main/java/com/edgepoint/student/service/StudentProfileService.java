// src/main/java/com/collegeManagement/service/student/StudentProfileService.java
package com.edgepoint.student.service;

import com.edgepoint.student.dto.StudentProfileUpdateRequest;
import com.edgepoint.student.dto.StudentProfileDTO;

public interface StudentProfileService {
    StudentProfileDTO getMyProfile();
    StudentProfileDTO updateMyProfile(StudentProfileUpdateRequest request);
}