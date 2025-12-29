// src/main/java/com/collegeManagement/dto/response/teacher/TeacherResponseDTO.java
package com.collegeManagement.production.dto.response.teacher;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TeacherResponseDTO {
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String employeeId;
    private Integer deptId;
    private String deptName;
    private LocalDate hireDate;
    private String specialization;
    private String qualification;
    private Boolean isActive;
    private LocalDateTime createdAt;
}