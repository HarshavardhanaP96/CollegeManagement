// src/main/java/com/collegeManagement/dto/request/subject/SubjectCreateRequest.java
package com.collegeManagement.production.dto.request.subject;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectCreateRequest {
    @NotBlank(message = "Subject name is required")
    @Size(max = 100)
    private String subjectName;

    @NotBlank(message = "Subject code is required")
    @Size(max = 20)
    private String subjectCode;

    @Min(value = 1, message = "Credits must be at least 1")
    private Integer credits = 3;

    @Size(max = 20)
    private String subjectType; // Theory, Practical, Lab
}
