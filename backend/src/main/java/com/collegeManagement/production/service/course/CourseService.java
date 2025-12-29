// src/main/java/com/collegeManagement/service/course/CourseService.java
package com.collegeManagement.production.service.course;

import com.collegeManagement.production.dto.request.course.CourseCreateRequest;
import com.collegeManagement.production.dto.request.course.CourseUpdateRequest;
import com.collegeManagement.production.dto.response.course.CourseResponseDTO;

import java.util.List;

public interface CourseService {
    CourseResponseDTO createCourse(CourseCreateRequest request);
    CourseResponseDTO updateCourse(Integer courseId, CourseUpdateRequest request);
    CourseResponseDTO getCourseById(Integer courseId);
    List<CourseResponseDTO> getAllCourses();
    void deleteCourse(Integer courseId);
}