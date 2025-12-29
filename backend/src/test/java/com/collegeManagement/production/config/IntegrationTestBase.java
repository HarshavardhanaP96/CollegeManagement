package com.collegeManagement.production.config;

import com.collegeManagement.production.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class IntegrationTestBase {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected CollegeRepository collegeRepository;

    @Autowired
    protected DepartmentRepository departmentRepository;

    @Autowired
    protected SubjectRepository subjectRepository;

    @Autowired
    protected ClassRepository classRepository;

    @Autowired
    protected AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    protected MarkRepository markRepository;

    @BeforeEach
    void baseSetup() {
        cleanDatabase();
    }

    protected void cleanDatabase() {
        markRepository.deleteAll();
        attendanceRecordRepository.deleteAll();
        subjectRepository.deleteAll();
        classRepository.deleteAll();
        departmentRepository.deleteAll();
        userRepository.deleteAll();
        collegeRepository.deleteAll();
    }
}
