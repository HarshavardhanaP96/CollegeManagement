// src/main/java/com/collegeManagement/dto/request/student/StudentProfileUpdateRequest.java
package com.edgepoint.student.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentProfileUpdateRequest {
    private String phone;

    private String parentName;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
    private String parentPhone;

    @Email
    private String parentEmail;

    private LocalDate dateOfBirth;

    private String address;
}