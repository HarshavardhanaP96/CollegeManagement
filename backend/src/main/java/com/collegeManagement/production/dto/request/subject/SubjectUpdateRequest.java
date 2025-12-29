// src/main/java/com/collegeManagement/dto/request/subject/SubjectUpdateRequest.java
package com.collegeManagement.production.dto.request.subject;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectUpdateRequest {
    @Size(max = 100)
    private String subjectName;

    @Min(value = 1)
    private Integer credits;

    @Size(max = 20)
    private String subjectType;
}