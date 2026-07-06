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