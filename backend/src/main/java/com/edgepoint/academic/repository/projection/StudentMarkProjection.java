// src/main/java/com/collegeManagement/repository/projection/StudentMarksProjection.java
package com.edgepoint.academic.repository.projection;

import java.math.BigDecimal;

public interface StudentMarkProjection {
    Integer getMarkId();
    String getSubjectName();
    String getSubjectCode();
    String getExamTypeName();
    Integer getMaxMarks();
    BigDecimal getMarksObtained();
    String getRemarks();
}