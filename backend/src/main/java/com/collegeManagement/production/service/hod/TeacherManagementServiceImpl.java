package com.collegeManagement.production.service.hod;

import com.collegeManagement.production.dto.request.teacher.TeacherCreateRequest;
import com.collegeManagement.production.dto.request.teacher.TeacherUpdateRequest;
import com.collegeManagement.production.dto.response.teacher.TeacherResponseDTO;
import com.collegeManagement.production.entity.TeacherProfile;
import com.collegeManagement.production.entity.User;
import com.collegeManagement.production.entity.Department;
import com.collegeManagement.production.exception.BadRequestException;
import com.collegeManagement.production.exception.ResourceNotFoundException;
import com.collegeManagement.production.repository.TeacherProfileRepository;
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
public class TeacherManagementServiceImpl implements TeacherManagementService {

    private final UserRepository userRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantContext tenantContext;

    @Override
    @Transactional
    public TeacherResponseDTO createTeacher(TeacherCreateRequest request) {
        if (userRepository.existsByUsernameAndIsDeletedFalse(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (teacherProfileRepository.existsByEmployeeIdAndIsDeletedFalse(request.getEmployeeId())) {
            throw new BadRequestException("Employee ID already exists");
        }

        Integer currentCollegeId = tenantContext.getCollegeId();
        Integer creatorId = tenantContext.getCurrentUserId();
        
        // If HOD is creating, use their dept. If Admin, use provided deptId.
        Integer deptId = request.getDeptId();
        if (deptId == null) {
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));
            if (creator.getTeacherProfile() != null) {
                deptId = creator.getTeacherProfile().getDeptId();
            } else if (creator.getRoleId() == 3) { // HOD
                // HOD might not have a teacher profile if they are JUST an HOD? 
                // In this system HOD is usually a teacher too.
            }
        }
        
        if (deptId == null) {
            throw new BadRequestException("Department ID is required");
        }

        User user = new User();
        user.setCollegeId(currentCollegeId);
        user.setRoleId(4); // TEACHER
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setIsActive(true);
        user.setCreatedBy(creatorId);
        
        user = userRepository.save(user);

        TeacherProfile profile = new TeacherProfile();
        profile.setUser(user);
        profile.setTeacherUserId(user.getUserId());
        profile.setEmployeeId(request.getEmployeeId());
        profile.setDeptId(deptId);
        profile.setHireDate(request.getHireDate());
        profile.setSpecialization(request.getSpecialization());
        profile.setQualification(request.getQualification());
        profile.setCreatedBy(creatorId);

        teacherProfileRepository.save(profile);

        return mapToDTO(user, profile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponseDTO> getAllTeachers() {
        Integer collegeId = tenantContext.getCollegeId();
        // Return all teachers for the college
        // We might want to filter by department for HODs eventually
        return teacherProfileRepository.findAll().stream()
                .filter(p -> p.getUser().getCollegeId().equals(collegeId))
                .map(p -> mapToDTO(p.getUser(), p))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponseDTO getTeacherById(Integer teacherId) {
        TeacherProfile profile = teacherProfileRepository.findByTeacherUserIdAndIsDeletedFalse(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found"));
        return mapToDTO(profile.getUser(), profile);
    }

    @Override
    @Transactional
    public TeacherResponseDTO updateTeacher(Integer teacherId, TeacherUpdateRequest request) {
        TeacherProfile profile = teacherProfileRepository.findByTeacherUserIdAndIsDeletedFalse(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found"));
        User user = profile.getUser();

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        
        if (request.getSpecialization() != null) profile.setSpecialization(request.getSpecialization());
        if (request.getQualification() != null) profile.setQualification(request.getQualification());

        user.setUpdatedBy(tenantContext.getCurrentUserId());
        profile.setUpdatedBy(tenantContext.getCurrentUserId());

        userRepository.save(user);
        teacherProfileRepository.save(profile);

        return mapToDTO(user, profile);
    }

    @Override
    @Transactional
    public void deleteTeacher(Integer teacherId) {
        TeacherProfile profile = teacherProfileRepository.findByTeacherUserIdAndIsDeletedFalse(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found"));
        
        User user = profile.getUser();
        user.setIsDeleted(true);
        profile.setIsDeleted(true);
        
        user.setUpdatedBy(tenantContext.getCurrentUserId());
        profile.setUpdatedBy(tenantContext.getCurrentUserId());
        
        userRepository.save(user);
        teacherProfileRepository.save(profile);
    }

    private TeacherResponseDTO mapToDTO(User user, TeacherProfile profile) {
        TeacherResponseDTO dto = new TeacherResponseDTO();
        dto.setUserId(user.getUserId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setEmployeeId(profile.getEmployeeId());
        dto.setDeptId(profile.getDeptId());
        dto.setDeptName(profile.getDepartment() != null ? profile.getDepartment().getDeptName() : null);
        dto.setHireDate(profile.getHireDate());
        dto.setSpecialization(profile.getSpecialization());
        dto.setQualification(profile.getQualification());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
