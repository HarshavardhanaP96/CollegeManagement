// src/main/java/com/collegeManagement/service/college/CollegeServiceImpl.java
package com.collegeManagement.production.service.college;

import com.collegeManagement.production.dto.request.college.CollegeCreateRequest;
import com.collegeManagement.production.dto.request.college.CollegeUpdateRequest;
import com.collegeManagement.production.dto.response.college.CollegeResponseDTO;
import com.collegeManagement.production.dto.response.college.CollegeStatisticsDTO;
import com.collegeManagement.production.entity.College;
import com.collegeManagement.production.exception.DuplicateResourceException;
import com.collegeManagement.production.exception.ResourceNotFoundException;
import com.collegeManagement.production.repository.*;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollegeServiceImpl implements CollegeService {

    private final CollegeRepository collegeRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public CollegeResponseDTO createCollege(CollegeCreateRequest request) {
        if (collegeRepository.existsByCollegeCodeAndIsDeletedFalse(request.getCollegeCode())) {
            throw new DuplicateResourceException("College code already exists: " + request.getCollegeCode());
        }

        College college = new College();
        college.setCollegeName(request.getCollegeName());
        college.setCollegeCode(request.getCollegeCode());
        college.setAddress(request.getAddress());
        college.setContactEmail(request.getContactEmail());
        college.setContactPhone(request.getContactPhone());
        college.setCreatedBy(tenantContext.getCurrentUserId());

        College saved = collegeRepository.save(college);
        log.info("College created: {} (ID: {})", saved.getCollegeName(), saved.getCollegeId());

        return mapToResponseDTO(saved);
    }

    @Override
    @Transactional
    public CollegeResponseDTO updateCollege(Integer collegeId, CollegeUpdateRequest request) {
        College college = collegeRepository.findByCollegeIdAndIsDeletedFalse(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College not found: " + collegeId));

        if (request.getCollegeName() != null) {
            college.setCollegeName(request.getCollegeName());
        }
        if (request.getAddress() != null) {
            college.setAddress(request.getAddress());
        }
        if (request.getContactEmail() != null) {
            college.setContactEmail(request.getContactEmail());
        }
        if (request.getContactPhone() != null) {
            college.setContactPhone(request.getContactPhone());
        }
        college.setUpdatedBy(tenantContext.getCurrentUserId());

        College updated = collegeRepository.save(college);
        log.info("College updated: {}", collegeId);

        return mapToResponseDTO(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public CollegeResponseDTO getCollegeById(Integer collegeId) {
        College college = collegeRepository.findByCollegeIdAndIsDeletedFalse(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College not found: " + collegeId));

        return mapToResponseDTO(college);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CollegeResponseDTO> getAllColleges(Pageable pageable, String search) {
        Page<College> colleges;

        if (search != null && !search.trim().isEmpty()) {
            colleges = collegeRepository.searchColleges(search.trim(), pageable);
        } else {
            colleges = collegeRepository.findAllActive(pageable);
        }

        return colleges.map(this::mapToResponseDTO);
    }

    @Override
    @Transactional
    public void deleteCollege(Integer collegeId) {
        College college = collegeRepository.findByCollegeIdAndIsDeletedFalse(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College not found: " + collegeId));

        college.setIsDeleted(true);
        college.setDeletedAt(LocalDateTime.now());
        college.setDeletedBy(tenantContext.getCurrentUserId());

        collegeRepository.save(college);
        log.info("College soft deleted: {}", collegeId);
    }

    @Override
    @Transactional(readOnly = true)
    public CollegeStatisticsDTO getCollegeStatistics(Integer collegeId) {
        College college = collegeRepository.findByCollegeIdAndIsDeletedFalse(collegeId)
                .orElseThrow(() -> new ResourceNotFoundException("College not found: " + collegeId));

        Integer totalDepartments = departmentRepository.countByCollegeId(collegeId);
        Integer totalCourses = courseRepository.countByCollegeId(collegeId);
        Integer totalSubjects = subjectRepository.countByCollegeId(collegeId);
        Integer totalClasses = classRepository.countByCollegeId(collegeId);

        Integer totalTeachers = userRepository.countByCollegeAndRole(collegeId, 4); // Teacher role
        Integer totalStudents = userRepository.countByCollegeAndRole(collegeId, 5); // Student role

        return CollegeStatisticsDTO.builder()
                .collegeId(college.getCollegeId())
                .collegeName(college.getCollegeName())
                .totalDepartments(totalDepartments)
                .totalCourses(totalCourses)
                .totalTeachers(totalTeachers)
                .totalStudents(totalStudents)
                .totalClasses(totalClasses)
                .totalSubjects(totalSubjects)
                .activeTeachers(totalTeachers)
                .activeStudents(totalStudents)
                .build();
    }

    private CollegeResponseDTO mapToResponseDTO(College college) {
        Integer totalDepts = departmentRepository.countByCollegeId(college.getCollegeId());
        Integer totalTeachers = userRepository.countByCollegeAndRole(college.getCollegeId(), 4);
        Integer totalStudents = userRepository.countByCollegeAndRole(college.getCollegeId(), 5);

        return CollegeResponseDTO.builder()
                .collegeId(college.getCollegeId())
                .collegeName(college.getCollegeName())
                .collegeCode(college.getCollegeCode())
                .address(college.getAddress())
                .contactEmail(college.getContactEmail())
                .contactPhone(college.getContactPhone())
                .totalDepartments(totalDepts)
                .totalTeachers(totalTeachers)
                .totalStudents(totalStudents)
                .createdAt(college.getCreatedAt())
                .build();
    }
}