package com.edgepoint.student.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class StudentResponseDTO {
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String rollNumber;
    private Integer deptId;
    private String deptName;
    private Integer courseId;
    private String courseName;
    private Integer admissionYear;
    private Integer currentSemester;
    private String parentName;
    private String parentPhone;
    private String parentEmail;
    private LocalDate dateOfBirth;
    private String address;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
