// src/main/java/com/collegeManagement/service/course/CourseServiceImpl.java
package com.collegeManagement.production.service.course;

import com.collegeManagement.production.dto.request.course.CourseCreateRequest;
import com.collegeManagement.production.dto.request.course.CourseUpdateRequest;
import com.collegeManagement.production.dto.response.course.CourseResponseDTO;
import com.collegeManagement.production.entity.Course;
import com.collegeManagement.production.exception.BadRequestException;
import com.collegeManagement.production.exception.DuplicateResourceException;
import com.collegeManagement.production.exception.ResourceNotFoundException;
import com.collegeManagement.production.repository.CourseRepository;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public CourseResponseDTO createCourse(CourseCreateRequest request) {
        Integer collegeId = tenantContext.getCollegeId();

        if (courseRepository.existsByCourseCodeAndCollegeIdAndIsDeletedFalse(
                request.getCourseCode(), collegeId)) {
            throw new DuplicateResourceException("Course code already exists: " + request.getCourseCode());
        }

        Course course = new Course();
        course.setCollegeId(collegeId);
        course.setCourseName(request.getCourseName());
        course.setCourseCode(request.getCourseCode());
        course.setDurationYears(request.getDurationYears());
        course.setTotalSemesters(request.getTotalSemesters());
        course.setCreatedBy(tenantContext.getCurrentUserId());

        Course saved = courseRepository.save(course);
        log.info("Course created: {} (ID: {})", saved.getCourseName(), saved.getCourseId());

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public CourseResponseDTO updateCourse(Integer courseId, CourseUpdateRequest request) {
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        validateTenantAccess(course.getCollegeId());

        if (request.getCourseName() != null) {
            course.setCourseName(request.getCourseName());
        }
        if (request.getDurationYears() != null) {
            course.setDurationYears(request.getDurationYears());
        }
        if (request.getTotalSemesters() != null) {
            course.setTotalSemesters(request.getTotalSemesters());
        }
        course.setUpdatedBy(tenantContext.getCurrentUserId());

        Course updated = courseRepository.save(course);
        log.info("Course updated: {}", courseId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponseDTO getCourseById(Integer courseId) {
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        validateTenantAccess(course.getCollegeId());

        return mapToResponseDTO(course);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseResponseDTO> getAllCourses() {
        Integer collegeId = tenantContext.getCollegeId();

        return courseRepository.findByCollegeIdAndIsDeletedFalse(collegeId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteCourse(Integer courseId) {
        Course course = courseRepository.findByCourseIdAndIsDeletedFalse(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        validateTenantAccess(course.getCollegeId());

        course.setIsDeleted(true);
        course.setDeletedAt(LocalDateTime.now());
        course.setDeletedBy(tenantContext.getCurrentUserId());

        courseRepository.save(course);
        log.info("Course soft deleted: {}", courseId);
    }

    private void validateTenantAccess(Integer resourceCollegeId) {
        Integer currentCollegeId = tenantContext.getCollegeId();
        Integer currentRoleId = tenantContext.getRoleId();

        if (currentRoleId == 1) return;

        if (!currentCollegeId.equals(resourceCollegeId)) {
            throw new BadRequestException("Access denied to this course");
        }
    }

    private CourseResponseDTO mapToResponseDTO(Course course) {
        CourseResponseDTO dto = new CourseResponseDTO();
        dto.setCourseId(course.getCourseId());
        dto.setCollegeId(course.getCollegeId());
        dto.setCourseName(course.getCourseName());
        dto.setCourseCode(course.getCourseCode());
        dto.setDurationYears(course.getDurationYears());
        dto.setTotalSemesters(course.getTotalSemesters());
        dto.setCreatedAt(course.getCreatedAt());
        return dto;
    }
}