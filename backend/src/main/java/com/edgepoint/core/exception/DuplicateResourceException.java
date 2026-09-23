// src/main/java/com/collegeManagement/production/exception/DuplicateResourceException.java
package com.edgepoint.core.exception;

import lombok.Getter;
import java.util.Collections;
import java.util.Map;

@Getter
public class DuplicateResourceException extends RuntimeException {
    private final Map<String, String> errors;

    public DuplicateResourceException(String message) {
        super(message);
        this.errors = Collections.emptyMap();
    }

    public DuplicateResourceException(String message, Map<String, String> errors) {
        super(message);
        this.errors = errors != null ? Collections.unmodifiableMap(errors) : Collections.emptyMap();    }
}