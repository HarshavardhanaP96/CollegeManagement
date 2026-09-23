// ============================================
// Custom Exception Classes
// ============================================

// src/main/java/com/collegeManagement/production/exception/ResourceNotFoundException.java
package com.edgepoint.core.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}