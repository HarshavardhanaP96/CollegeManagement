package com.collegeManagement.production.service.student;

import com.collegeManagement.production.dto.request.student.StudentCreateRequest;
import com.collegeManagement.production.dto.request.student.StudentUpdateRequest;
import com.collegeManagement.production.dto.response.student.StudentResponseDTO;
import com.collegeManagement.production.entity.StudentProfile;
import com.collegeManagement.production.entity.User;
import com.collegeManagement.production.entity.Department;
import com.collegeManagement.production.entity.Course;
import com.collegeManagement.production.exception.BadRequestException;
import com.collegeManagement.production.exception.ResourceNotFoundException;
import com.collegeManagement.production.repository.StudentProfileRepository;
import com.collegeManagement.production.repository.UserRepository;
import com.collegeManagement.production.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentManagementServiceImpl implements StudentManagementService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public StudentResponseDTO createStudent(StudentCreateRequest request) {
        if (userRepository.existsByUsernameAndIsDeletedFalse(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (studentProfileRepository.existsByRollNumberAndIsDeletedFalse(request.getRollNumber())) {
            throw new BadRequestException("Roll number already exists");
        }

        Integer collegeId = tenantContext.getCollegeId();
        Integer creatorId = tenantContext.getCurrentUserId();

        User user = new User();
        user.setCollegeId(collegeId);
        user.setRoleId(5); // STUDENT
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setIsActive(true);
        user.setCreatedBy(creatorId);

        user = userRepository.save(user);

        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setStudentUserId(user.getUserId());
        profile.setRollNumber(request.getRollNumber());
        profile.setDeptId(request.getDeptId());
        profile.setCourseId(request.getCourseId());
        profile.setAdmissionYear(request.getAdmissionYear());
        profile.setCurrentSemester(1); // Default to semester 1
        profile.setParentName(request.getParentName());
        profile.setParentPhone(request.getParentPhone());
        profile.setParentEmail(request.getParentEmail());
        profile.setDateOfBirth(request.getDateOfBirth());
        profile.setAddress(request.getAddress());
        profile.setCreatedBy(creatorId);

        studentProfileRepository.save(profile);

        return mapToDTO(user, profile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponseDTO> getAllStudents() {
        Integer collegeId = tenantContext.getCollegeId();
        return studentProfileRepository.findAll().stream()
                .filter(p -> p.getUser().getCollegeId().equals(collegeId))
                .map(p -> mapToDTO(p.getUser(), p))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponseDTO getStudentById(Integer studentId) {
        StudentProfile profile = studentProfileRepository.findByStudentUserIdAndIsDeletedFalse(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        return mapToDTO(profile.getUser(), profile);
    }

    @Override
    @Transactional
    public StudentResponseDTO updateStudent(Integer studentId, StudentUpdateRequest request) {
        StudentProfile profile = studentProfileRepository.findByStudentUserIdAndIsDeletedFalse(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        User user = profile.getUser();

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        
        if (request.getCourseId() != null) profile.setCourseId(request.getCourseId());
        if (request.getDeptId() != null) profile.setDeptId(request.getDeptId());
        if (request.getCurrentSemester() != null) profile.setCurrentSemester(request.getCurrentSemester());
        if (request.getParentName() != null) profile.setParentName(request.getParentName());
        if (request.getParentPhone() != null) profile.setParentPhone(request.getParentPhone());
        if (request.getParentEmail() != null) profile.setParentEmail(request.getParentEmail());
        if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
        if (request.getAddress() != null) profile.setAddress(request.getAddress());
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());

        user.setUpdatedBy(tenantContext.getCurrentUserId());
        profile.setUpdatedBy(tenantContext.getCurrentUserId());

        userRepository.save(user);
        studentProfileRepository.save(profile);

        return mapToDTO(user, profile);
    }

    @Override
    @Transactional
    public void deleteStudent(Integer studentId) {
        StudentProfile profile = studentProfileRepository.findByStudentUserIdAndIsDeletedFalse(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));
        
        User user = profile.getUser();
        user.setIsDeleted(true);
        profile.setIsDeleted(true);
        
        user.setUpdatedBy(tenantContext.getCurrentUserId());
        profile.setUpdatedBy(tenantContext.getCurrentUserId());
        
        userRepository.save(user);
        studentProfileRepository.save(profile);
    }

    private StudentResponseDTO mapToDTO(User user, StudentProfile profile) {
        StudentResponseDTO dto = new StudentResponseDTO();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setRollNumber(profile.getRollNumber());
        dto.setDeptId(profile.getDeptId());
        dto.setDeptName(profile.getDepartment() != null ? profile.getDepartment().getDeptName() : null);
        dto.setCourseId(profile.getCourseId());
        dto.setCourseName(profile.getCourse() != null ? profile.getCourse().getCourseName() : null);
        dto.setAdmissionYear(profile.getAdmissionYear());
        dto.setCurrentSemester(profile.getCurrentSemester());
        dto.setParentName(profile.getParentName());
        dto.setParentPhone(profile.getParentPhone());
        dto.setParentEmail(profile.getParentEmail());
        dto.setDateOfBirth(profile.getDateOfBirth());
        dto.setAddress(profile.getAddress());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
