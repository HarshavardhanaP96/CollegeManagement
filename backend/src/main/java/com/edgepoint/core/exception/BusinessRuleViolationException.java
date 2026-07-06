
// src/main/java/com/collegeManagement/production/exception/BusinessRuleViolationException.java
package com.edgepoint.core.exception;

import lombok.Getter;
import java.util.Map;

@Getter
public class BusinessRuleViolationException extends RuntimeException {
    private final Map<String, String> errors;

    public BusinessRuleViolationException(String message) {
        super(message);
        this.errors = null;
    }

    public BusinessRuleViolationException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors;
    }
}