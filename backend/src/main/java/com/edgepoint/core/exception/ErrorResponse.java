// ============================================
// src/main/java/com/collegeManagement/exception/ErrorResponse.java
// ============================================

package com.edgepoint.core.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private boolean success;
    private String message;
    private Map<String, String> errors;
    private int statusCode;
    private String path;
    private LocalDateTime timestamp;
}
