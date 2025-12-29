// src/main/java/com/collegeManagement/service/student/StudentProfileServiceImpl.java
package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.request.student.StudentProfileUpdateRequest;
import com.collegeManagement.production.dto.response.student.StudentProfileDTO;
import com.collegeManagement.production.entity.StudentProfile;
import com.collegeManagement.production.entity.User;
import com.collegeManagement.production.repository.StudentProfileRepository;
import com.collegeManagement.production.repository.UserRepository;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudentProfileServiceImpl implements StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final TenantContext tenantContext;

    @Override
    @Transactional(readOnly = true)
    public StudentProfileDTO getMyProfile() {
        Integer studentUserId = tenantContext.getCurrentUserId();

        StudentProfile profile = studentProfileRepository
                .findByStudentUserIdAndIsDeletedFalse(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        return mapToDTO(profile);
    }

    @Override
    @Transactional
    public StudentProfileDTO updateMyProfile(StudentProfileUpdateRequest request) {
        Integer studentUserId = tenantContext.getCurrentUserId();

        User user = userRepository.findById(studentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudentProfile profile = studentProfileRepository
                .findByStudentUserIdAndIsDeletedFalse(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        // Update user info
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        user.setUpdatedBy(studentUserId);
        userRepository.save(user);

        // Update profile
        if (request.getParentName() != null) {
            profile.setParentName(request.getParentName());
        }
        if (request.getParentPhone() != null) {
            profile.setParentPhone(request.getParentPhone());
        }
        if (request.getParentEmail() != null) {
            profile.setParentEmail(request.getParentEmail());
        }
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getAddress() != null) {
            profile.setAddress(request.getAddress());
        }
        profile.setUpdatedBy(studentUserId);

        StudentProfile updated = studentProfileRepository.save(profile);

        return mapToDTO(updated);
    }

    private StudentProfileDTO mapToDTO(StudentProfile profile) {
        StudentProfileDTO dto = new StudentProfileDTO();
        dto.setUserId(profile.getStudentUserId());
        dto.setUsername(profile.getUser().getUsername());
        dto.setEmail(profile.getUser().getEmail());
        dto.setFullName(profile.getUser().getFullName());
        dto.setPhone(profile.getUser().getPhone());
        dto.setRollNumber(profile.getRollNumber());
        dto.setDeptId(profile.getDeptId());
        dto.setDeptName(profile.getDepartment().getDeptName());
        dto.setCourseId(profile.getCourseId());
        dto.setCourseName(profile.getCourse().getCourseName());
        dto.setAdmissionYear(profile.getAdmissionYear());
        dto.setCurrentSemester(profile.getCurrentSemester());
        dto.setParentName(profile.getParentName());
        dto.setParentPhone(profile.getParentPhone());
        dto.setParentEmail(profile.getParentEmail());
        dto.setDateOfBirth(profile.getDateOfBirth());
        dto.setAddress(profile.getAddress());
        return dto;
    }
}