// src/main/java/com/collegeManagement/exception/AuthenticationException.java
package com.edgepoint.core.exception;

public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }
}