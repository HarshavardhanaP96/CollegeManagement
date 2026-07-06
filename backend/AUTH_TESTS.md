# Test Cases for Auth APIs

## Unit Tests for AuthController

### Test Environment Setup
- Spring Boot Test context
- MockMvc for HTTP request simulation
- Mockito for service layer mocking
- JUnit 5 for test execution

### Test Cases

#### Login Endpoint (/api/v1/auth/login)

**Positive Test Cases:**
1. Test successful login with valid credentials
   - Request: POST /api/v1/auth/login with valid LoginRequest
   - Expected: HTTP 200 OK with LoginResponse containing tokens
   - Verify: AuthService.login() called once with correct request

2. Test login with rememberMe flag set
   - Request: POST /api/v1/auth/login with rememberMe=true
   - Expected: HTTP 200 OK with longer expiration tokens
   - Verify: Token expiration is extended

**Negative Test Cases:**
3. Test login with invalid credentials
   - Request: POST /api/v1/auth/login with invalid username/password
   - Expected: HTTP 400 Bad Request with error code AUTH_FAILED
   - Verify: Error message indicates invalid credentials

4. Test login with missing required fields
   - Request: POST /api/v1/auth/login with missing email/username
   - Expected: HTTP 400 Bad Request with validation errors
   - Verify: Field validation errors returned

5. Test login with expired/invalid token format
   - Request: POST /api/v1/auth/login with malformed request body
   - Expected: HTTP 400 Bad Request with validation errors

#### Refresh Token Endpoint (/api/v1/auth/refresh)

**Positive Test Cases:**
6. Test successful token refresh with valid refresh token
   - Request: POST /api/v1/auth/refresh with valid refresh token
   - Expected: HTTP 200 OK with new access token
   - Verify: AuthService.refreshToken() called with valid token

7. Test refresh token with valid but soon-to-expire token
   - Request: POST /api/v1/auth/refresh with token expiring soon
   - Expected: HTTP 200 OK with refreshed tokens

**Negative Test Cases:**
8. Test refresh with invalid/expired refresh token
   - Request: POST /api/v1/auth/refresh with expired token
   - Expected: HTTP 400 Bad Request with REFRESH_FAILED error

9. Test refresh without refresh token in request
   - Request: POST /api/v1/auth/refresh with empty body
   - Expected: HTTP 400 Bad Request with validation errors

#### Get Current User Endpoint (/api/v1/auth/me)

**Positive Test Cases:**
10. Test get current user with valid X-User-Id header
    - Request: GET /api/v1/auth/me with valid X-User-Id header
    - Expected: HTTP 200 OK with UserDto containing user information
    - Verify: AuthService.getCurrentUser() called with valid UUID

**Negative Test Cases:**
11. Test get current user with invalid UUID format
    - Request: GET /api/v1/auth/me with malformed UUID
    - Expected: HTTP 400 Bad Request with USER_NOT_FOUND error

12. Test get current user with non-existent user ID
    - Request: GET /api/v1/auth/me with valid but non-existent UUID
    - Expected: HTTP 400 Bad Request with USER_NOT_FOUND error

## Integration Tests for Auth APIs

### Test Environment Setup
- @SpringBootTest with webEnvironment = RANDOM_PORT
- TestRestTemplate or MockMvc with real service layer
- H2 in-memory database for persistence testing
- Testcontainers for external dependencies (Redis, PostgreSQL)

### Integration Test Cases

**Authentication Flow Tests:**
13. Test complete authentication flow: register/login/refresh/getUser
    - Step 1: Register new user (if registration endpoint exists)
    - Step 2: Login with credentials
    - Step 3: Use refresh token to get new access token
    - Step 4: Get current user with access token
    - Expected: All steps succeed with proper HTTP status codes

**Security Tests:**
14. Test authentication required endpoints without token
    - Request: GET /api/v1/auth/me without X-User-Id header
    - Expected: HTTP 401 Unauthorized or appropriate error

15. Test authorization with invalid user ID
    - Request: GET /api/v1/auth/me with X-User-Id of different user
    - Expected: HTTP 403 Forbidden (if proper authorization exists)

**Token Management Tests:**
16. Test token expiration behavior
    - Request: Login and wait for token expiration
    - Expected: Expired token should fail, refresh token should work

17. Test multiple refresh attempts with same refresh token
    - Request: Multiple refresh calls with same refresh token
    - Expected: First refresh succeeds, subsequent may fail (blacklisting)

### Edge Cases:
18. Test concurrent login attempts from different devices
19. Test password reset flow (if implemented)
20. Test account lockout after multiple failed attempts

## Service Layer Tests (AuthService)

### Unit Tests with Mockito

**Login Logic:**
21. Test password encryption and matching
22. Test user account status validation (active/inactive/locked)
23. Test JWT token generation with proper claims
24. Test rememberMe functionality extending token expiration

**Token Refresh Logic:**
25. Test refresh token validation against stored tokens
26. Test refresh token rotation (if implemented)
27. Test refresh token expiration handling
28. Test refresh token blacklisting after logout

**User Retrieval Logic:**
29. Test user mapping from Entity to DTO
30. Test handling of missing user records
31. Test tenant resolution based on user context

### Integration Tests:
32. Test database transactions during login
33. Test Redis integration for token blacklisting
34. Test audit logging for security events

## Mock Objects Configuration

### AuthController Tests:
- @WebMvcTest(AuthController.class)
- MockMvc for HTTP request testing
- @MockBean for AuthService
- JSON serialization/deserialization with Jackson

### AuthService Tests:
- @ExtendWith(MockitoExtension.class)
- @InjectMocks for AuthService
- @Mock for UserRepository, TokenRepository, RedisTemplate, etc.
- Argument captors for verifying method calls

### Integration Tests:
- @SpringBootTest
- @AutoConfigureMockMvc
- TestEntityManager for database setup
- @TestPropertySource for test-specific configurations

## Test Data Builders

Create helper classes for generating test data:
- UserTestBuilder: Create valid/invalid user entities
- LoginRequestTestBuilder: Create login requests with various scenarios
- TokenTestBuilder: Create JWT tokens with different claims and expiration
- RefreshRequestTestBuilder: Create refresh token requests

## Test Coverage Goals
- >80% line coverage for AuthController
- >80% line coverage for AuthService
- All public methods tested with both positive and negative cases
- Boundary conditions and error handling fully tested

## Performance Considerations
- Use @DirtiesContext minimally to avoid test pollution
- Use @Transactional for database tests to auto-rollback
- Use test profiles to configure in-memory databases
- Use parameterized tests for multiple similar scenarios

## Security Testing
- Test for SQL injection vulnerabilities in authentication
- Test for XSS in authentication responses
- Test for insecure direct object references in user endpoints
- Test for proper authentication enforcement on protected endpoints

## API Contract Testing
- Use Spring REST Docs or OpenAPI to verify API contracts
- Test that responses match documented schemas
- Test that error codes match documented error conditions

## Running Tests
- `mvn test` to run all tests
- `mvn test -Dtest=Auth*Test` to run only auth-related tests
- Use test coverage plugin: `mvn jacoco:report`

## CI/CD Integration
- Tests should run in CI pipeline on every PR
- Test coverage should be monitored and enforced
- Security tests should be part of the build process