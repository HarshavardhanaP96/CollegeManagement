// src/main/java/com/collegeManagement/dto/request/college/CollegeUpdateRequest.java
package com.edgepoint.core.dto;

import com.edgepoint.core.domain.College;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "College update request")
public class CollegeUpdateRequest {

    @Size(min = 3, max = 255, message = "College name must be between 3 and 255 characters")
    @Schema(description = "College name")
    private String collegeName;

    @Schema(description = "College address")
    private String address;

    @Email(message = "Invalid email format")
    @Schema(description = "Contact email")
    private String contactEmail;

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    @Schema(description = "Contact phone")
    private String contactPhone;
}