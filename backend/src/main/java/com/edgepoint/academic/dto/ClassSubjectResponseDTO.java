package com.edgepoint.academic.dto;

import lombok.Data;

@Data
public class ClassSubjectResponseDTO {
    private Integer classSubjectId;
    private Integer classId;
    private Integer subjectId;
    private String subjectName;
    private String subjectCode;
}
