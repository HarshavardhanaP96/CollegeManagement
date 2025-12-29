// src/main/java/com/collegeManagement/repository/projection/AttendanceProjection.java
package com.collegeManagement.production.repository.projection;

import java.time.LocalDate;

public interface AttendanceProjection {
    Integer getAttendanceId();
    String getSubjectName();
    LocalDate getRecordDate();
    Boolean getIsPresent();
    String getRemarks();
}