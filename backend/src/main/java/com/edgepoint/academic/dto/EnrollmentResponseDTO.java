package com.edgepoint.academic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EnrollmentResponseDTO {
    private Integer enrollmentId;
    private Integer studentUserId;
    private String studentName;
    private String rollNumber;
    private Integer classId;
    private String className;
    private String enrollmentStatus;
    private LocalDateTime createdAt;
}
