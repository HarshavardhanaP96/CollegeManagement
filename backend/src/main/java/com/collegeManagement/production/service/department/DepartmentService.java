// src/main/java/com/collegeManagement/service/department/DepartmentService.java
package com.collegeManagement.production.service.department;

import com.collegeManagement.production.dto.request.department.AssignHODRequest;
import com.collegeManagement.production.dto.request.department.DepartmentCreateRequest;
import com.collegeManagement.production.dto.request.department.DepartmentUpdateRequest;
import com.collegeManagement.production.dto.response.department.DepartmentResponseDTO;

import java.util.List;

public interface DepartmentService {
    DepartmentResponseDTO createDepartment(DepartmentCreateRequest request);
    DepartmentResponseDTO updateDepartment(Integer deptId, DepartmentUpdateRequest request);
    DepartmentResponseDTO getDepartmentById(Integer deptId);
    List<DepartmentResponseDTO> getAllDepartments();
    DepartmentResponseDTO assignHOD(Integer deptId, AssignHODRequest request);
    void deleteDepartment(Integer deptId);
}