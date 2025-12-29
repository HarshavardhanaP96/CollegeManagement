// ============================================
// DTOs for College Management
// ============================================

// src/main/java/com/collegeManagement/dto/request/college/CollegeCreateRequest.java
package com.collegeManagement.production.dto.request.college;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "College creation request")
public class CollegeCreateRequest {

    @NotBlank(message = "College name is required")
    @Size(min = 3, max = 255, message = "College name must be between 3 and 255 characters")
    @Schema(description = "College name", example = "ABC Institute of Technology")
    private String collegeName;

    @NotBlank(message = "College code is required")
    @Size(min = 2, max = 50, message = "College code must be between 2 and 50 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "College code must contain only uppercase letters, numbers, and hyphens")
    @Schema(description = "Unique college code", example = "ABC-IT")
    private String collegeCode;

    @NotBlank(message = "Address is required")
    @Schema(description = "College address")
    private String address;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Invalid email format")
    @Schema(description = "Contact email", example = "admin@abc-it.edu")
    private String contactEmail;

    @NotBlank(message = "Contact phone is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    @Schema(description = "Contact phone", example = "+91-9876543210")
    private String contactPhone;
}