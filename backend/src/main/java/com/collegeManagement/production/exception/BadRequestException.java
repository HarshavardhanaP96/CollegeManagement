// src/main/java/com/collegeManagement/exception/BadRequestException.java
package com.collegeManagement.production.exception;

public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}