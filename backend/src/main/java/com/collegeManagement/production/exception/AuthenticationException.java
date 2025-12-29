// src/main/java/com/collegeManagement/exception/AuthenticationException.java
package com.collegeManagement.production.exception;

public class AuthenticationException extends RuntimeException {
    public AuthenticationException(String message) {
        super(message);
    }
}