# College Management System - Developer Guide

**Version:** 1.0  
**Technology Stack:** Spring Boot 3.x + MySQL 8.0+  
**Phase:** 1

---

## 1. Development Environment Setup

### Prerequisites
```bash
- Java 17 or higher
- Maven 3.8+
- MySQL 8.0+
- IDE (IntelliJ IDEA / Eclipse / VS Code)
- Git
- Postman (for API testing)
```

### Project Structure
```
college-management-system/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/college/
│   │   │       ├── config/          # Configuration classes
│   │   │       ├── security/        # Security & JWT
│   │   │       ├── controller/      # REST Controllers
│   │   │       ├── service/         # Business logic
│   │   │       ├── repository/      # JPA Repositories
│   │   │       ├── entity/          # JPA Entities
│   │   │       ├── dto/             # Data Transfer Objects
│   │   │       ├── mapper/          # DTO <-> Entity mappers
│   │   │       ├── exception/       # Custom exceptions
│   │   │       └── util/            # Utility classes
│   │   └── resources/
│   │       ├── application.yml      # Configuration
│   │       ├── application-dev.yml  # Dev config
│   │       └── schema.sql           # Database schema
│   └── test/
│       └── java/                    # Unit & integration tests
├── pom.xml                          # Maven dependencies
└── README.md
```

### Maven Dependencies (pom.xml)
```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- MySQL Driver -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Lombok (Optional but recommended) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- MapStruct for DTO mapping -->
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>1.5.5.Final</version>
    </dependency>
    
    <!-- SpringDoc OpenAPI (Swagger) -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.2.0</version>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 2. Configuration

### application.yml
```yaml
spring:
  application:
    name: college-management-system
  
  datasource:
    url: jdbc:mysql://localhost:3306/college_mgmt_db?createDatabaseIfNotExist=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:root}
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate  # Use 'validate' in production, 'update' in dev
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect
  
  security:
    jwt:
      secret-key: ${JWT_SECRET:your-256-bit-secret-key-here-change-in-production}
      expiration: 86400000  # 24 hours in milliseconds

server:
  port: 8080
  servlet:
    context-path: /api/v1

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
```

---

## 3. Entity Design Pattern

### Base Entity (Auditing)
```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Data
public abstract class AuditableEntity {
    
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private Integer createdBy;
    
    @Column(name = "updated_by")
    private Integer updatedBy;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_by")
    private Integer deletedBy;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
```

### Sample Entity: User
```java
@Entity
@Table(name = "Users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends AuditableEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;
    
    @Column(name = "college_id")
    private Integer collegeId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "college_id", insertable = false, updatable = false)
    private College college;
    
    @Column(name = "role_id", nullable = false)
    private Integer roleId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", insertable = false, updatable = false)
    private UserRole role;
    
    @Column(name = "username", unique = true, nullable = false, length = 100)
    private String username;
    
    @Column(name = "email", unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(name = "full_name", nullable = false)
    private String fullName;
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    // One-to-one relationships
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private StudentProfile studentProfile;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private TeacherProfile teacherProfile;
}
```

---

## 4. Repository Layer

### Custom Base Repository (Soft Delete Support)
```java
@NoRepositoryBean
public interface SoftDeleteRepository<T, ID> extends JpaRepository<T, ID> {
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false")
    List<T> findAllActive();
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = :id AND e.isDeleted = false")
    Optional<T> findByIdActive(@Param("id") ID id);
    
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.isDeleted = true, e.deletedAt = :deletedAt, e.deletedBy = :deletedBy WHERE e.id = :id")
    void softDelete(@Param("id") ID id, @Param("deletedAt") LocalDateTime deletedAt, @Param("deletedBy") Integer deletedBy);
}
```

### User Repository Example
```java
public interface UserRepository extends SoftDeleteRepository<User, Integer> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.collegeId = :collegeId AND u.roleId = :roleId AND u.isDeleted = false")
    List<User> findByCollegeAndRole(@Param("collegeId") Integer collegeId, @Param("roleId") Integer roleId);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
}
```

---

## 5. Service Layer Architecture

### Service Interface
```java
public interface UserService {
    UserResponseDTO createUser(UserCreateDTO createDTO);
    UserResponseDTO updateUser(Integer userId, UserUpdateDTO updateDTO);
    UserResponseDTO getUserById(Integer userId);
    List<UserResponseDTO> getAllUsersByCollege(Integer collegeId);
    void deleteUser(Integer userId);
    void activateUser(Integer userId);
    void deactivateUser(Integer userId);
}
```

### Service Implementation with Tenant Isolation
```java
@Service
@Transactional
public class UserServiceImpl implements UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantContext tenantContext;
    
    @Override
    public UserResponseDTO createUser(UserCreateDTO createDTO) {
        // Validate tenant context
        validateTenantAccess(createDTO.getCollegeId());
        
        // Check uniqueness
        if (userRepository.existsByUsername(createDTO.getUsername())) {
            throw new DuplicateResourceException("Username already exists");
        }
        
        // Build entity
        User user = User.builder()
                .collegeId(createDTO.getCollegeId())
                .roleId(createDTO.getRoleId())
                .username(createDTO.getUsername())
                .email(createDTO.getEmail())
                .passwordHash(passwordEncoder.encode(createDTO.getPassword()))
                .fullName(createDTO.getFullName())
                .phone(createDTO.getPhone())
                .isActive(true)
                .build();
        
        user.setCreatedBy(tenantContext.getCurrentUserId());
        
        User savedUser = userRepository.save(user);
        return mapToResponseDTO(savedUser);
    }
    
    private void validateTenantAccess(Integer collegeId) {
        Integer currentCollegeId = tenantContext.getCollegeId();
        Integer currentRoleId = tenantContext.getRoleId();
        
        // SuperAdmin can access any college
        if (currentRoleId == 1) return;
        
        // Others can only access their own college
        if (!currentCollegeId.equals(collegeId)) {
            throw new UnauthorizedException("Access denied to this college");
        }
    }
}
```

---

## 6. Security Implementation

### JWT Token Structure
```json
{
  "sub": "username",
  "userId": 123,
  "collegeId": 5,
  "roleId": 3,
  "roleName": "HOD",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### JWT Utility Class
```java
@Component
public class JwtTokenUtil {
    
    @Value("${spring.security.jwt.secret-key}")
    private String secretKey;
    
    @Value("${spring.security.jwt.expiration}")
    private Long expiration;
    
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("collegeId", user.getCollegeId());
        claims.put("roleId", user.getRoleId());
        claims.put("roleName", user.getRole().getRoleName());
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

### Tenant Context (Thread-Local)
```java
@Component
public class TenantContext {
    
    private static final ThreadLocal<Integer> currentUserId = new ThreadLocal<>();
    private static final ThreadLocal<Integer> currentCollegeId = new ThreadLocal<>();
    private static final ThreadLocal<Integer> currentRoleId = new ThreadLocal<>();
    
    public void setContext(Integer userId, Integer collegeId, Integer roleId) {
        currentUserId.set(userId);
        currentCollegeId.set(collegeId);
        currentRoleId.set(roleId);
    }
    
    public void clear() {
        currentUserId.remove();
        currentCollegeId.remove();
        currentRoleId.remove();
    }
    
    public Integer getCurrentUserId() {
        return currentUserId.get();
    }
    
    public Integer getCollegeId() {
        return currentCollegeId.get();
    }
    
    public Integer getRoleId() {
        return currentRoleId.get();
    }
}
```

### JWT Authentication Filter
```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsService userDetailsService;
    private final TenantContext tenantContext;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String token = extractToken(request);
        
        if (token != null && jwtTokenUtil.validateToken(token)) {
            Claims claims = jwtTokenUtil.extractAllClaims(token);
            String username = claims.getSubject();
            
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            // Set tenant context
            tenantContext.setContext(
                claims.get("userId", Integer.class),
                claims.get("collegeId", Integer.class),
                claims.get("roleId", Integer.class)
            );
            
            // Set authentication
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
        tenantContext.clear(); // Clear after request
    }
    
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

---

## 7. Controller Layer

### Standard Response Wrapper
```java
@Data
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now());
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now());
    }
}
```

### Sample Controller: Student Marks
```java
@RestController
@RequestMapping("/students/marks")
@RequiredArgsConstructor
public class StudentMarksController {
    
    private final MarksService marksService;
    
    @GetMapping("/my-marks")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<MarkResponseDTO>>> getMyMarks() {
        List<MarkResponseDTO> marks = marksService.getMarksByStudent();
        return ResponseEntity.ok(ApiResponse.success(marks, "Marks retrieved successfully"));
    }
    
    @GetMapping("/my-marks/subject/{subjectId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<MarkResponseDTO>>> getMyMarksBySubject(
            @PathVariable Integer subjectId) {
        List<MarkResponseDTO> marks = marksService.getMarksByStudentAndSubject(subjectId);
        return ResponseEntity.ok(ApiResponse.success(marks, "Marks retrieved successfully"));
    }
}
```

### Sample Controller: Teacher Marks Entry
```java
@RestController
@RequestMapping("/teachers/marks")
@RequiredArgsConstructor
public class TeacherMarksController {
    
    private final MarksService marksService;
    
    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<MarkResponseDTO>> createMark(
            @Valid @RequestBody MarkCreateDTO createDTO) {
        MarkResponseDTO mark = marksService.createMark(createDTO);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(mark, "Mark created successfully"));
    }
    
    @PutMapping("/{markId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<MarkResponseDTO>> updateMark(
            @PathVariable Integer markId,
            @Valid @RequestBody MarkUpdateDTO updateDTO) {
        MarkResponseDTO mark = marksService.updateMark(markId, updateDTO);
        return ResponseEntity.ok(ApiResponse.success(mark, "Mark updated successfully"));
    }
    
    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ApiResponse<List<MarkResponseDTO>>> getMarksByAssignment(
            @PathVariable Integer assignmentId) {
        List<MarkResponseDTO> marks = marksService.getMarksByAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(marks, "Marks retrieved successfully"));
    }
}
```

---

## 8. API Endpoints Structure

### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
```

### SuperAdmin APIs
```
POST   /api/v1/admin/colleges
GET    /api/v1/admin/colleges
GET    /api/v1/admin/colleges/{id}
PUT    /api/v1/admin/colleges/{id}
DELETE /api/v1/admin/colleges/{id}
```

### CollegeAdmin APIs
```
POST   /api/v1/college-admin/departments
GET    /api/v1/college-admin/departments
POST   /api/v1/college-admin/courses
GET    /api/v1/college-admin/courses
POST   /api/v1/college-admin/hods
```

### HOD APIs
```
POST   /api/v1/hod/subjects
GET    /api/v1/hod/subjects
POST   /api/v1/hod/teachers
GET    /api/v1/hod/teachers
POST   /api/v1/hod/classes
POST   /api/v1/hod/teacher-assignments
POST   /api/v1/hod/student-enrollments
```

### Teacher APIs
```
POST   /api/v1/teachers/attendance
PUT    /api/v1/teachers/attendance/{id}
GET    /api/v1/teachers/attendance/assignment/{assignmentId}
POST   /api/v1/teachers/marks
PUT    /api/v1/teachers/marks/{id}
GET    /api/v1/teachers/marks/assignment/{assignmentId}
```

### Student APIs
```
GET    /api/v1/students/marks/my-marks
GET    /api/v1/students/attendance/my-attendance
GET    /api/v1/students/profile
PUT    /api/v1/students/profile
```

---

## 9. Error Handling

### Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Void>> handleDuplicateResource(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed"));
    }
}
```

---

## 10. Testing Strategy

### Unit Tests (Service Layer)
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private TenantContext tenantContext;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    @Test
    void createUser_Success() {
        // Arrange
        UserCreateDTO createDTO = new UserCreateDTO(/* ... */);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(tenantContext.getCurrentUserId()).thenReturn(1);
        
        // Act
        UserResponseDTO result = userService.createUser(createDTO);
        
        // Assert
        assertNotNull(result);
        verify(userRepository, times(1)).save(any(User.class));
    }
}
```

### Integration Tests (Controller Layer)
```java
@SpringBootTest
@AutoConfigureMockMvc
class StudentMarksControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(roles = "STUDENT")
    void getMyMarks_Success() throws Exception {
        mockMvc.perform(get("/api/v1/students/marks/my-marks")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
```

---

## 11. Best Practices

### Code Standards
1. **Use DTOs** for all API requests/responses (never expose entities)
2. **Use Builder pattern** for entity construction
3. **Use MapStruct** for entity-DTO mapping
4. **Use Lombok** to reduce boilerplate
5. **Follow RESTful conventions** for API design
6. **Use @Transactional** on service methods that modify data
7. **Always validate tenant context** before data operations
8. **Use soft deletes** instead of hard deletes
9. **Log all important operations** with appropriate levels
10. **Write unit tests** for all service methods

### Security Checklist
- ✅ All APIs except login must require authentication
- ✅ Role-based authorization on all endpoints
- ✅ Tenant isolation enforced at service layer
- ✅ Password must be hashed (BCrypt)
- ✅ JWT tokens must have expiration
- ✅ Sensitive data must not be logged
- ✅ Input validation on all DTOs
- ✅ SQL injection prevention (use parameterized queries)

---

## 12. Performance Optimization

### Database Indexing
- Create indexes on all foreign keys
- Create composite indexes on frequently queried combinations
- Create indexes on soft delete flags

### JPA Optimization
```java
// Use fetch joins to avoid N+1 queries
@Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.userId = :id")
Optional<User> findByIdWithRole(@Param("id") Integer id);

// Use pagination for large datasets
Page<User> findByCollegeId(Integer collegeId, Pageable pageable);

// Use projections for read-only queries
interface UserSummaryProjection {
    Integer getUserId();
    String getFullName();
    String getEmail();
}
```

---

## 13. Deployment Checklist

### Pre-deployment
- [ ] Update `application-prod.yml` with production database credentials
- [ ] Change JWT secret key to a strong random value
- [ ] Set `ddl-auto` to `validate` (never use `update` in production)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set appropriate logging levels
- [ ] Run all tests and ensure they pass
- [ ] Perform security audit
- [ ] Create database backup strategy

### Database Migration
- Flyway is the project's migration tool (`backend/src/main/resources/db/migration`) — see
  [DatabaseMigration.md](DatabaseMigration.md). An earlier Liquibase setup was never actually
  wired up and has been removed.
- Never use Hibernate DDL auto-update in production
- Always backup database before migrations

---

## 14. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `LazyInitializationException` | Use `@Transactional` or fetch joins |
| JWT token expired | Implement refresh token mechanism |
| N+1 query problem | Use JOIN FETCH or EntityGraph |
| Cross-tenant data leakage | Always validate collegeId in service layer |
| Slow queries | Add proper indexes, use pagination |

---

**Next Document:** OPS_GUIDE.md for deployment and operations.