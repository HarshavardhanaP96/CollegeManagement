// src/main/java/com/collegeManagement/service/department/DepartmentService.java
package com.edgepoint.academic.service;

import com.edgepoint.academic.dto.AssignHODRequest;
import com.edgepoint.academic.dto.DepartmentCreateRequest;
import com.edgepoint.academic.dto.DepartmentUpdateRequest;
import com.edgepoint.academic.dto.DepartmentResponseDTO;

import java.util.List;

public interface DepartmentService {
    DepartmentResponseDTO createDepartment(DepartmentCreateRequest request);
    DepartmentResponseDTO updateDepartment(Integer deptId, DepartmentUpdateRequest request);
    DepartmentResponseDTO getDepartmentById(Integer deptId);
    List<DepartmentResponseDTO> getAllDepartments();
    DepartmentResponseDTO assignHOD(Integer deptId, AssignHODRequest request);
    void deleteDepartment(Integer deptId);
}