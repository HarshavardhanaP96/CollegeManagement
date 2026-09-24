package com.edgepoint.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A student in a teacher assignment's class roster — used by both mark and attendance entry. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RosterStudentDTO {
    private Integer studentUserId;
    private String rollNumber;
    private String fullName;
}
