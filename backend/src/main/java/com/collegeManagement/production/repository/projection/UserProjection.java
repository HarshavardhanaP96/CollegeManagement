// src/main/java/com/collegeManagement/repository/projection/UserProjection.java
package com.collegeManagement.production.repository.projection;

public interface UserProjection {
    Integer getUserId();
    String getUsername();
    String getEmail();
    String getFullName();
    String getPhone();
    Integer getCollegeId();
    Integer getRoleId();
    String getRoleName();
    Boolean getIsActive();
}