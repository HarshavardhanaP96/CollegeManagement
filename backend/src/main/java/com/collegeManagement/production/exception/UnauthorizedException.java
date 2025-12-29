// src/main/java/com/collegeManagement/production/exception/UnauthorizedException.java
package com.collegeManagement.production.exception;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}