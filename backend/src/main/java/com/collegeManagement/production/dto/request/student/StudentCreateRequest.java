package com.collegeManagement.production.dto.request.student;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StudentCreateRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    @NotBlank(message = "Roll number is required")
    private String rollNumber;

    @NotNull(message = "Department ID is required")
    private Integer deptId;

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotNull(message = "Admission year is required")
    private Integer admissionYear;

    private String parentName;
    private String parentPhone;
    private String parentEmail;
    private LocalDate dateOfBirth;
    private String address;
}
