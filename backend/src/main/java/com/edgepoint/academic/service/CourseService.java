// src/main/java/com/collegeManagement/service/course/CourseService.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.CourseCreateRequest;
import com.edgepoint.academic.dto.CourseUpdateRequest;
import com.edgepoint.academic.dto.CourseResponseDTO;

import java.util.List;

public interface CourseService {
    CourseResponseDTO createCourse(CourseCreateRequest request);
    CourseResponseDTO updateCourse(Integer courseId, CourseUpdateRequest request);
    CourseResponseDTO getCourseById(Integer courseId);
    List<CourseResponseDTO> getAllCourses();
    void deleteCourse(Integer courseId);
}