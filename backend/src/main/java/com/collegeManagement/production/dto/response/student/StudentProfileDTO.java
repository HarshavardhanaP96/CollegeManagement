// src/main/java/com/collegeManagement/dto/response/student/StudentProfileDTO.java
package com.collegeManagement.production.dto.response.student;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentProfileDTO {
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
}