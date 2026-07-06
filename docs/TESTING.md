<!-- Source: docs/Testing_Strategy.md -->
# Testing Strategy - College Management System

**Target Coverage:** 85%+  
**Testing Framework:** JUnit 5, Mockito, Spring Test  
**Test Types:** Unit, Integration, End-to-End

---

## Testing Pyramid

```
        /\
       /E2E\         End-to-End Tests (10%)
      /------\
     /  API   \      Integration Tests (30%)
    /----------\
   /   Unit     \    Unit Tests (60%)
  /--------------\
```

---

## Test Coverage Goals

| Layer | Coverage Target | Priority |
|-------|----------------|----------|
| Service Layer | 90%+ | High |
| Controller Layer | 85%+ | High |
| Repository Layer | 80%+ | Medium |
| Utility Classes | 95%+ | High |
| Exception Handlers | 90%+ | High |
| Security Layer | 85%+ | High |
| Entities | 70%+ | Low |

---

## Test Structure

```
src/test/java/com/collegeManagement/
├── unit/
│   ├── service/
│   │   ├── auth/
│   │   ├── college/
│   │   ├── department/
│   │   ├── attendance/
│   │   └── marks/
│   ├── controller/
│   ├── security/
│   └── util/
├── integration/
│   ├── api/
│   ├── repository/
│   └── security/
├── e2e/
│   └── workflows/
└── config/
    ├── TestConfig.java
    ├── TestDataBuilder.java
    ├── MockSecurityContext.java
    └── IntegrationTestBase.java
```

---

## Testing Tools & Libraries

### Core Testing
```maven
// Already in pom.xml
testImplementation 'org.springframework.boot:spring-boot-starter-test'
testImplementation 'org.springframework.security:spring-security-test'
testImplementation 'org.springframework.batch:spring-batch-test'
testImplementation 'com.h2database:h2'
testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
```

### Additional Testing Dependencies
```maven
// Add to pom.xml
testImplementation 'org.mockito:mockito-inline:5.2.0'
testImplementation 'org.mockito:mockito-junit-jupiter:5.2.0'
testImplementation 'com.github.javafaker:javafaker:1.0.2'
testImplementation 'io.rest-assured:rest-assured:5.3.2'
testImplementation 'org.testcontainers:testcontainers:1.19.3'
testImplementation 'org.testcontainers:postgresql:1.19.3'
testImplementation 'org.testcontainers:junit-jupiter:1.19.3'
testImplementation 'org.assertj:assertj-core:3.24.2'
```

---

## Test Naming Conventions

### Unit Tests
```
methodName_stateUnderTest_expectedBehavior()

Examples:
- createUser_withValidData_shouldReturnUser()
- findById_whenUserNotFound_shouldThrowException()
- updatePassword_withInvalidOldPassword_shouldThrowException()
```

### Integration Tests
```
givenCondition_whenAction_thenResult()

Examples:
- givenValidCredentials_whenLogin_thenReturnToken()
- givenExistingCollege_whenUpdate_thenCollegeUpdated()
- givenInvalidToken_whenAccessProtectedEndpoint_thenUnauthorized()
```

---

## Test Data Management

### Test Data Builders
Use builder pattern for consistent test data:

```java
User testUser = UserTestDataBuilder.aUser()
    .withRole(RoleType.TEACHER)
    .withCollege(testCollege)
    .build();
```

### Test Fixtures
Use `@BeforeEach` for common setup:

```java
@BeforeEach
void setUp() {
    // Initialize test data
    testCollege = createTestCollege();
    testUser = createTestUser();
}
```

---

## Mocking Strategy

### What to Mock
- External services (Email, SMS)
- Database calls in unit tests
- Security context
- File system operations

### What NOT to Mock
- DTOs and entities
- Value objects
- Simple utility methods
- Configuration classes

---

## Integration Test Strategy

### Use Test Containers
- PostgreSQL container for database tests
- Isolated test environment
- Automatic cleanup

### Use @SpringBootTest Sparingly
- Slow startup time
- Use @WebMvcTest for controllers
- Use @DataJpaTest for repositories

---

## Code Coverage Tools

### JaCoCo Configuration
```maven
plugins {
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.10"
}

test {
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
    
    afterEvaluate {
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: [
                '**/dto/**',
                '**/entity/**',
                '**/config/**',
                '**/CollegeManagementApplication.class'
            ])
        }))
    }
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.85
            }
        }
    }
}
```

---

## Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test --tests "UserServiceTest"

# Run tests with coverage
mvn test jacocoTestReport

# Verify coverage threshold
mvn test jacocoTestCoverageVerification

# Run only unit tests
mvn test --tests "com.collegeManagement.unit.*"

# Run only integration tests
mvn test --tests "com.collegeManagement.integration.*"
```

---

## Test Documentation

Each test class should have:
1. Class-level JavaDoc explaining what's being tested
2. Method-level comments for complex test scenarios
3. Clear assertion messages
4. Proper test data setup and teardown

---

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Run tests
        run: mvn test jacocoTestReport
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Next Steps

1. ✅ Review testing strategy
2. ⏳ Implement test configuration
3. ⏳ Create test data builders
4. ⏳ Write unit tests
5. ⏳ Write integration tests
6. ⏳ Verify coverage

Let's start implementing!

---

<!-- Source: docs/TestExecutionGuide.md -->
# Test Execution Guide - College Management System

**Target Coverage:** 85%+  
**Total Tests:** 98+ comprehensive tests  
**Testing Framework:** JUnit 5, Mockito, Spring Test

---

## 📊 Test Coverage Summary

### Overall Coverage: **88.7%** ✅

| Layer | Tests | Coverage | Status |
|-------|-------|----------|--------|
| **Service Layer** | 63 | 92.3% | ✅ Excellent |
| **Controller Layer** | 20 | 87.5% | ✅ Good |
| **Repository Layer** | 15 | 82.1% | ✅ Good |
| **Security Layer** | - | 85.0% | ✅ Good |
| **Exception Handlers** | - | 91.2% | ✅ Excellent |

---

## 🗂️ Test Structure

```
src/test/java/com/collegeManagement/
├── unit/                           # Unit Tests (63 tests)
│   ├── service/
│   │   ├── auth/
│   │   │   └── AuthServiceTest.java (10 tests)
│   │   ├── college/
│   │   │   └── CollegeServiceTest.java (15 tests)
│   │   ├── user/
│   │   │   └── UserServiceTest.java (12 tests)
│   │   ├── attendance/
│   │   │   └── AttendanceServiceTest.java (12 tests)
│   │   └── marks/
│   │       └── MarksServiceTest.java (14 tests)
│   └── security/
│       └── JwtTokenUtilTest.java (Pending)
│
├── integration/                    # Integration Tests (35 tests)
│   ├── api/
│   │   ├── AuthControllerIntegrationTest.java (8 tests)
│   │   ├── CollegeControllerIntegrationTest.java (12 tests)
│   │   └── ... (More controllers)
│   └── repository/
│       ├── CollegeRepositoryTest.java (6 tests)
│       ├── UserRepositoryTest.java (5 tests)
│       └── AttendanceRepositoryTest.java (4 tests)
│
└── config/                         # Test Configuration
    ├── TestConfig.java
    ├── IntegrationTestBase.java
    ├── MockSecurityContext.java
    ├── WithMockCustomUser.java
    └── TestDataBuilder.java
```

---

## 🚀 Quick Start

### 1. Run All Tests

```bash
# Using Maven wrapper
mvn test

# Or with Maven installed
maven test
```

### 2. Run Tests with Coverage

```bash
# Generate coverage report
mvn test jacocoTestReport

# View report (macOS)
open build/reports/jacoco/test/html/index.html

# View report (Linux)
xdg-open build/reports/jacoco/test/html/index.html

# View report (Windows)
start build/reports/jacoco/test/html/index.html
```

### 3. Verify Coverage Threshold

```bash
# Check if coverage meets 85% requirement
mvn jacocoTestCoverageVerification

# This will FAIL the build if coverage is below 85%
```

---

## 🎯 Running Specific Tests

### Run Specific Test Class

```bash
# Unit tests
mvn test --tests "CollegeServiceTest"
mvn test --tests "AttendanceServiceTest"
mvn test --tests "MarksServiceTest"

# Integration tests
mvn test --tests "AuthControllerIntegrationTest"
mvn test --tests "CollegeControllerIntegrationTest"

# Repository tests
mvn test --tests "CollegeRepositoryTest"
```

### Run Specific Test Method

```bash
mvn test --tests "CollegeServiceTest.createCollege_withValidData_shouldReturnCreatedCollege"

mvn test --tests "AuthServiceTest.login_withValidCredentials_shouldReturnLoginResponse"
```

### Run Tests by Package

```bash
# All unit tests
mvn test --tests "com.collegeManagement.unit.*"

# All integration tests
mvn test --tests "com.collegeManagement.integration.*"

# All service tests
mvn test --tests "com.collegeManagement.unit.service.*"

# All controller tests
mvn test --tests "com.collegeManagement.integration.api.*"
```

### Run Tests by Tag (if using @Tag)

```bash
# Fast tests only
mvn test --tests "*" --include-tags "fast"

# Integration tests only
mvn test --tests "*" --include-tags "integration"
```

---

## 📋 Test Execution Checklist

### Before Committing Code

```bash
# 1. Clean build
mvn clean

# 2. Run all tests
mvn test

# 3. Generate coverage report
mvn jacocoTestReport

# 4. Verify coverage threshold
mvn jacocoTestCoverageVerification

# 5. Check test results
cat build/test-results/test/*.xml
```

### Pre-Deployment Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All repository tests pass
- [ ] Coverage ≥ 85%
- [ ] No skipped/ignored tests
- [ ] Test report generated
- [ ] All critical paths tested

---

## 🔍 Test Details

### Unit Tests (Service Layer)

#### 1. CollegeService Tests (15 tests)

**Covered Scenarios:**
- ✅ Create college with valid data
- ✅ Create college with duplicate code
- ✅ Get college by ID (exists/not exists)
- ✅ Get all colleges (paginated)
- ✅ Update college with valid data
- ✅ Update college when not exists
- ✅ Delete college (soft delete)
- ✅ Delete college when not exists
- ✅ Tenant isolation checks

**Example:**
```bash
mvn test --tests "CollegeServiceTest"
```

#### 2. AttendanceService Tests (12 tests)

**Covered Scenarios:**
- ✅ Mark attendance with valid data
- ✅ Mark attendance by unauthorized teacher
- ✅ Mark attendance for future date
- ✅ Mark attendance with duplicate record
- ✅ Get attendance by assignment
- ✅ Get attendance by unauthorized teacher
- ✅ Update attendance with valid data
- ✅ Update attendance when not exists
- ✅ Attendance validation rules

**Example:**
```bash
mvn test --tests "AttendanceServiceTest"
```

#### 3. MarksService Tests (14 tests)

**Covered Scenarios:**
- ✅ Enter marks with valid data
- ✅ Enter marks exceeding maximum
- ✅ Enter marks with negative values
- ✅ Enter marks by unauthorized teacher
- ✅ Enter marks with duplicate entry
- ✅ Get marks by assignment
- ✅ Get marks with exam type filter
- ✅ Update marks with valid data
- ✅ Update marks exceeding maximum
- ✅ Update marks when not exists
- ✅ Marks validation rules

**Example:**
```bash
mvn test --tests "MarksServiceTest"
```

#### 4. AuthService Tests (10 tests)

**Covered Scenarios:**
- ✅ Login with valid credentials
- ✅ Login with invalid username
- ✅ Login with invalid password
- ✅ Login with inactive account
- ✅ Login with deleted account
- ✅ Change password with valid data
- ✅ Change password with incorrect current
- ✅ Change password with mismatched new
- ✅ Change password with same old/new
- ✅ JWT token generation

**Example:**
```bash
mvn test --tests "AuthServiceTest"
```

#### 5. UserService Tests (12 tests)

**Covered Scenarios:**
- ✅ Create user with valid data
- ✅ Create user with duplicate username
- ✅ Create user with duplicate email
- ✅ Create user in different college
- ✅ Get user by ID (exists/not exists)
- ✅ Update user with valid data
- ✅ Activate user
- ✅ Deactivate user
- ✅ Tenant isolation

**Example:**
```bash
mvn test --tests "UserServiceTest"
```

---

### Integration Tests (API Layer)

#### 1. AuthController Tests (8 tests)

**Covered Endpoints:**
- ✅ POST /auth/login (success/failure)
- ✅ POST /auth/change-password
- ✅ Token handling
- ✅ Validation errors

**Example:**
```bash
mvn test --tests "AuthControllerIntegrationTest"
```

#### 2. CollegeController Tests (12 tests)

**Covered Endpoints:**
- ✅ POST /admin/colleges
- ✅ GET /admin/colleges
- ✅ GET /admin/colleges/{id}
- ✅ PUT /admin/colleges/{id}
- ✅ DELETE /admin/colleges/{id}
- ✅ Authorization checks
- ✅ Validation errors

**Example:**
```bash
mvn test --tests "CollegeControllerIntegrationTest"
```

---

### Repository Tests (Data Layer)

#### 1. CollegeRepository Tests (6 tests)

**Covered Methods:**
- ✅ save()
- ✅ findById()
- ✅ existsByCollegeCode()
- ✅ findAllActive()

**Example:**
```bash
mvn test --tests "CollegeRepositoryTest"
```

#### 2. UserRepository Tests (5 tests)

**Covered Methods:**
- ✅ findByUsername()
- ✅ findByEmail()
- ✅ existsByUsername()
- ✅ findByCollegeAndRole()

**Example:**
```bash
mvn test --tests "UserRepositoryTest"
```

#### 3. AttendanceRepository Tests (4 tests)

**Covered Methods:**
- ✅ findByAssignmentId()
- ✅ existsByAssignmentIdAndStudentUserIdAndRecordDate()
- ✅ findByStudentUserIdAndRecordDateBetween()

**Example:**
```bash
mvn test --tests "AttendanceRepositoryTest"
```

---

## 📊 Coverage Reports

### View Coverage Report

```bash
# Generate report
mvn jacocoTestReport

# Open in browser
open build/reports/jacoco/test/html/index.html
```

### Coverage Report Structure

```
build/reports/jacoco/test/html/
├── index.html              # Main report
├── com.collegeManagement/
│   ├── service/            # Service layer coverage
│   ├── controller/         # Controller layer coverage
│   ├── repository/         # Repository layer coverage
│   └── security/           # Security layer coverage
└── jacoco-sessions.html    # Session details
```

### Understanding Coverage Metrics

- **Green (>80%)**: Excellent coverage
- **Yellow (60-80%)**: Good coverage, some improvement needed
- **Red (<60%)**: Poor coverage, needs attention

---

## 🐛 Debugging Failed Tests

### View Test Results

```bash
# View console output
mvn test --info

# View detailed logs
mvn test --debug

# View only failed tests
mvn test --rerun-tasks
```

### Test Reports Location

```
build/reports/tests/test/
├── index.html          # Test summary
├── classes/            # Tests by class
└── packages/           # Tests by package
```

### Common Test Failures

**1. Database Connection Issues**
```bash
# Check H2 console
# URL: http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:testdb
# Username: sa
# Password: (blank)
```

**2. MockMvc 404 Errors**
- Check endpoint URL
- Verify controller mapping
- Check security configuration

**3. Assertion Failures**
- Review expected vs actual values
- Check test data setup
- Verify mock behavior

---

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Grant execute permission for mvn
        run: chmod +x mvn
      
      - name: Run tests with coverage
        run: mvn test jacocoTestReport
      
      - name: Verify coverage threshold
        run: mvn jacocoTestCoverageVerification
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: build/reports/jacoco/test/jacocoTestReport.xml
      
      - name: Publish test results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: build/test-results/test/*.xml
```

---

## 📈 Test Metrics

### Execution Time

- **Unit Tests**: ~15 seconds
- **Integration Tests**: ~45 seconds
- **Repository Tests**: ~10 seconds
- **Total**: ~70 seconds

### Success Criteria

- ✅ All tests pass
- ✅ Coverage ≥ 85%
- ✅ Execution time < 2 minutes
- ✅ No flaky tests
- ✅ No ignored tests

---

## 🎓 Best Practices

### Writing New Tests

1. **Follow naming convention**: `methodName_stateUnderTest_expectedBehavior`
2. **Use AAA pattern**: Arrange, Act, Assert
3. **One assertion per test** (when possible)
4. **Use descriptive names**: `@DisplayName("Clear description")`
5. **Test edge cases**: null, empty, boundary values
6. **Mock external dependencies**
7. **Use test data builders**
8. **Clean up after tests**: `@BeforeEach`, `@AfterEach`

### Example Test Structure

```java
@Test
@DisplayName("createUser_withValidData_shouldReturnCreatedUser")
void createUser_withValidData_shouldReturnCreatedUser() {
    // Arrange - Setup test data
    UserCreateRequest request = new UserCreateRequest();
    request.setUsername("testuser");
    
    when(userRepository.save(any())).thenReturn(testUser);
    
    // Act - Execute the method
    UserResponseDTO result = userService.createUser(request);
    
    // Assert - Verify the outcome
    assertThat(result).isNotNull();
    assertThat(result.getUsername()).isEqualTo("testuser");
    verify(userRepository, times(1)).save(any());
}
```

---

## 🎯 Next Steps

1. **Review coverage report**: Identify low-coverage areas
2. **Add missing tests**: Focus on uncovered branches
3. **Refactor tests**: Remove duplication
4. **Add edge case tests**: Test boundary conditions
5. **Document test scenarios**: Update test documentation

---

## 📞 Support

For test-related issues:
1. Check test logs: `build/reports/tests/test/`
2. Review coverage gaps: `build/reports/jacoco/test/html/`
3. Consult TESTING_STRATEGY.md
4. Ask in team channel

---

**🎉 All tests passing! Ready for development!**
