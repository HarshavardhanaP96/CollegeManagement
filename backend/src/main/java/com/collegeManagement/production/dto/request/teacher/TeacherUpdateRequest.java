// src/main/java/com/collegeManagement/dto/request/teacher/TeacherUpdateRequest.java
package com.collegeManagement.production.dto.request.teacher;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class TeacherUpdateRequest {
    private String fullName;
    private String phone;

    @Email
    private String email;

    private String specialization;
    private String qualification;
}