package com.edgepoint.student.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentUpdateRequest {
    private String fullName;
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private Integer courseId;
    private Integer deptId;
    private Integer currentSemester;
    private String parentName;
    private String parentPhone;
    private String parentEmail;
    private LocalDate dateOfBirth;
    private String address;
    private Boolean isActive;
}
