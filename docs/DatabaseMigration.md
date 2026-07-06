# College Management System - Database Migrations

**Migration Tool:** Liquibase  
**Database:** PostgreSQL 14+  
**Version:** 1.0

---

## Directory Structure

```
src/main/resources/
├── db/
│   └── changelog/
│       ├── db.changelog-master.xml
│       └── v1.0/
│           ├── 001-create-user-roles-table.xml
│           ├── 002-create-colleges-table.xml
│           ├── 003-create-users-table.xml
│           ├── 004-create-departments-table.xml
│           ├── 005-create-courses-table.xml
│           ├── 006-create-teacher-profiles-table.xml
│           ├── 007-create-student-profiles-table.xml
│           ├── 008-create-classes-table.xml
│           ├── 009-create-student-enrollments-table.xml
│           ├── 010-create-subjects-table.xml
│           ├── 011-create-class-subjects-table.xml
│           ├── 012-create-teacher-assignments-table.xml
│           ├── 013-create-exam-types-table.xml
│           ├── 014-create-marks-table.xml
│           ├── 015-create-attendance-records-table.xml
│           ├── 016-create-notifications-table.xml
│           ├── 017-create-audit-logs-table.xml
│           ├── 018-insert-default-data.xml
│           ├── 019-create-indexes.xml
│           └── 020-create-triggers.xml
```

---

## application.yml Configuration

```yaml
spring:
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.xml
    enabled: true
    drop-first: false  # Set to true only in development
    contexts: dev  # or prod
```

---

## Migration Files

### 001-create-user-roles-table.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="001-create-user-roles-table" author="system">
        <createTable tableName="user_roles">
            <column name="role_id" type="INTEGER">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="role_name" type="VARCHAR(50)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="role_description" type="TEXT"/>
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
        </createTable>
        
        <rollback>
            <dropTable tableName="user_roles"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### 002-create-colleges-table.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="002-create-colleges-table" author="system">
        <createTable tableName="colleges">
            <column name="college_id" type="SERIAL">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="college_name" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="college_code" type="VARCHAR(50)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="address" type="TEXT"/>
            <column name="contact_email" type="VARCHAR(255)"/>
            <column name="contact_phone" type="VARCHAR(20)"/>
            
            <!-- Auditing fields -->
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
            <column name="created_by" type="INTEGER"/>
            <column name="updated_by" type="INTEGER"/>
            <column name="is_deleted" type="BOOLEAN" defaultValueBoolean="false">
                <constraints nullable="false"/>
            </column>
            <column name="deleted_by" type="INTEGER"/>
            <column name="deleted_at" type="TIMESTAMP"/>
        </createTable>
        
        <createIndex tableName="colleges" indexName="idx_college_code">
            <column name="college_code"/>
        </createIndex>
        
        <createIndex tableName="colleges" indexName="idx_is_deleted">
            <column name="is_deleted"/>
        </createIndex>
        
        <rollback>
            <dropTable tableName="colleges"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### 003-create-users-table.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="003-create-users-table" author="system">
        <createTable tableName="users">
            <column name="user_id" type="SERIAL">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="college_id" type="INTEGER"/>
            <column name="role_id" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="username" type="VARCHAR(100)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="email" type="VARCHAR(255)">
                <constraints nullable="false" unique="true"/>
            </column>
            <column name="password_hash" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="full_name" type="VARCHAR(255)">
                <constraints nullable="false"/>
            </column>
            <column name="phone" type="VARCHAR(20)"/>
            <column name="is_active" type="BOOLEAN" defaultValueBoolean="true">
                <constraints nullable="false"/>
            </column>
            
            <!-- Auditing fields -->
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
            <column name="created_by" type="INTEGER"/>
            <column name="updated_by" type="INTEGER"/>
            <column name="is_deleted" type="BOOLEAN" defaultValueBoolean="false">
                <constraints nullable="false"/>
            </column>
            <column name="deleted_by" type="INTEGER"/>
            <column name="deleted_at" type="TIMESTAMP"/>
        </createTable>
        
        <!-- Foreign Keys -->
        <addForeignKeyConstraint
            baseTableName="users"
            baseColumnNames="college_id"
            constraintName="fk_users_college"
            referencedTableName="colleges"
            referencedColumnNames="college_id"
            onDelete="RESTRICT"
            onUpdate="CASCADE"/>
            
        <addForeignKeyConstraint
            baseTableName="users"
            baseColumnNames="role_id"
            constraintName="fk_users_role"
            referencedTableName="user_roles"
            referencedColumnNames="role_id"
            onDelete="RESTRICT"
            onUpdate="CASCADE"/>
        
        <!-- Indexes -->
        <createIndex tableName="users" indexName="idx_users_college_role">
            <column name="college_id"/>
            <column name="role_id"/>
        </createIndex>
        
        <createIndex tableName="users" indexName="idx_users_email">
            <column name="email"/>
        </createIndex>
        
        <createIndex tableName="users" indexName="idx_users_username">
            <column name="username"/>
        </createIndex>
        
        <createIndex tableName="users" indexName="idx_users_is_active">
            <column name="is_active"/>
        </createIndex>
        
        <rollback>
            <dropTable tableName="users" cascadeConstraints="true"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### 004-create-departments-table.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="004-create-departments-table" author="system">
        <createTable tableName="departments">
            <column name="dept_id" type="SERIAL">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="college_id" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="dept_name" type="VARCHAR(100)">
                <constraints nullable="false"/>
            </column>
            <column name="dept_code" type="VARCHAR(20)">
                <constraints nullable="false"/>
            </column>
            <column name="dept_head_user_id" type="INTEGER"/>
            
            <!-- Auditing fields -->
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
            <column name="created_by" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="updated_by" type="INTEGER"/>
            <column name="is_deleted" type="BOOLEAN" defaultValueBoolean="false">
                <constraints nullable="false"/>
            </column>
            <column name="deleted_by" type="INTEGER"/>
            <column name="deleted_at" type="TIMESTAMP"/>
        </createTable>
        
        <!-- Foreign Keys -->
        <addForeignKeyConstraint
            baseTableName="departments"
            baseColumnNames="college_id"
            constraintName="fk_departments_college"
            referencedTableName="colleges"
            referencedColumnNames="college_id"
            onDelete="RESTRICT"
            onUpdate="CASCADE"/>
            
        <addForeignKeyConstraint
            baseTableName="departments"
            baseColumnNames="dept_head_user_id"
            constraintName="fk_departments_head"
            referencedTableName="users"
            referencedColumnNames="user_id"
            onDelete="SET NULL"
            onUpdate="CASCADE"/>
        
        <!-- Unique Constraints -->
        <addUniqueConstraint
            tableName="departments"
            columnNames="college_id, dept_code"
            constraintName="uk_college_dept_code"/>
            
        <addUniqueConstraint
            tableName="departments"
            columnNames="college_id, dept_name"
            constraintName="uk_college_dept_name"/>
        
        <!-- Indexes -->
        <createIndex tableName="departments" indexName="idx_departments_college">
            <column name="college_id"/>
        </createIndex>
        
        <createIndex tableName="departments" indexName="idx_departments_head">
            <column name="dept_head_user_id"/>
        </createIndex>
        
        <rollback>
            <dropTable tableName="departments" cascadeConstraints="true"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### 014-create-marks-table.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="014-create-marks-table" author="system">
        <createTable tableName="marks">
            <column name="mark_id" type="SERIAL">
                <constraints primaryKey="true" nullable="false"/>
            </column>
            <column name="assignment_id" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="student_user_id" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="exam_type_id" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="marks_obtained" type="DECIMAL(5,2)">
                <constraints nullable="false" checkConstraint="CHECK (marks_obtained >= 0)"/>
            </column>
            <column name="remarks" type="TEXT"/>
            
            <!-- Auditing fields -->
            <column name="created_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP">
                <constraints nullable="false"/>
            </column>
            <column name="updated_at" type="TIMESTAMP" defaultValueComputed="CURRENT_TIMESTAMP"/>
            <column name="created_by" type="INTEGER">
                <constraints nullable="false"/>
            </column>
            <column name="updated_by" type="INTEGER"/>
        </createTable>
        
        <!-- Foreign Keys -->
        <addForeignKeyConstraint
            baseTableName="marks"
            baseColumnNames="assignment_id"
            constraintName="fk_marks_assignment"
            referencedTableName="teacher_assignments"
            referencedColumnNames="assignment_id"
            onDelete="RESTRICT"
            onUpdate="CASCADE"/>
            
        <addForeignKeyConstraint
            baseTableName="marks"
            baseColumnNames="student_user_id"
            constraintName="fk_marks_student"
            referencedTableName="users"
            referencedColumnNames="user_id"
            onDelete="RESTRICT"
            onUpdate="CASCADE"/>
            
        <addForeignKeyConstraint
            baseTableName="marks"
            baseColumnNames="exam_type_id"
            constraintName="fk_marks_exam_type"
            referencedTableName="exam_types"
            referencedColumnNames="exam_type_id"
            onDelete="RESTRICT"
            onUpdate="CASCADE"/>
        
        <!-- Unique Constraint -->
        <addUniqueConstraint
            tableName="marks"
            columnNames="assignment_id, student_user_id, exam_type_id"
            constraintName="uk_marks"/>
        
        <!-- Indexes -->
        <createIndex tableName="marks" indexName="idx_marks_student_assignment">
            <column name="student_user_id"/>
            <column name="assignment_id"/>
        </createIndex>
        
        <createIndex tableName="marks" indexName="idx_marks_exam_type">
            <column name="exam_type_id"/>
        </createIndex>
        
        <rollback>
            <dropTable tableName="marks" cascadeConstraints="true"/>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### 018-insert-default-data.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="018-insert-default-roles" author="system">
        <insert tableName="user_roles">
            <column name="role_id" valueNumeric="1"/>
            <column name="role_name" value="SuperAdmin"/>
            <column name="role_description" value="Developer company administrator with full system access"/>
        </insert>
        
        <insert tableName="user_roles">
            <column name="role_id" valueNumeric="2"/>
            <column name="role_name" value="CollegeAdmin"/>
            <column name="role_description" value="College-level administrator managing departments and college-wide settings"/>
        </insert>
        
        <insert tableName="user_roles">
            <column name="role_id" valueNumeric="3"/>
            <column name="role_name" value="HOD"/>
            <column name="role_description" value="Department head managing teachers, subjects, and classes within department"/>
        </insert>
        
        <insert tableName="user_roles">
            <column name="role_id" valueNumeric="4"/>
            <column name="role_name" value="Teacher"/>
            <column name="role_description" value="Faculty member managing attendance and marks for assigned subjects"/>
        </insert>
        
        <insert tableName="user_roles">
            <column name="role_id" valueNumeric="5"/>
            <column name="role_name" value="Student"/>
            <column name="role_description" value="Student with access to view marks and attendance"/>
        </insert>
        
        <rollback>
            <delete tableName="user_roles"/>
        </rollback>
    </changeSet>
    
    <changeSet id="018-insert-default-superadmin" author="system" context="dev">
        <comment>Create default SuperAdmin user (Development only)</comment>
        <insert tableName="users">
            <column name="user_id" valueNumeric="1"/>
            <column name="college_id" valueNumeric="NULL"/>
            <column name="role_id" valueNumeric="1"/>
            <column name="username" value="superadmin"/>
            <column name="email" value="superadmin@collegemgmt.com"/>
            <!-- Password: Admin@123 (BCrypt hashed) -->
            <column name="password_hash" value="$2a$10$XqEk.5fmEIQKJPHqN0W6/.7VrK5j5ZqYM5gZ6hLQvM8PkC8YqVvGe"/>
            <column name="full_name" value="System Administrator"/>
            <column name="phone" value="+91-9999999999"/>
            <column name="is_active" valueBoolean="true"/>
        </insert>
        
        <rollback>
            <delete tableName="users">
                <where>username='superadmin'</where>
            </delete>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

### 020-create-triggers.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
    xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.20.xsd">

    <changeSet id="020-create-updated-at-trigger-function" author="system">
        <sql>
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        </sql>
        
        <rollback>
            <sql>DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;</sql>
        </rollback>
    </changeSet>
    
    <changeSet id="020-create-triggers-for-all-tables" author="system">
        <sql splitStatements="true">
            -- Colleges
            CREATE TRIGGER update_colleges_updated_at
            BEFORE UPDATE ON colleges
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Users
            CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Departments
            CREATE TRIGGER update_departments_updated_at
            BEFORE UPDATE ON departments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Courses
            CREATE TRIGGER update_courses_updated_at
            BEFORE UPDATE ON courses
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Teacher Profiles
            CREATE TRIGGER update_teacher_profiles_updated_at
            BEFORE UPDATE ON teacher_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Student Profiles
            CREATE TRIGGER update_student_profiles_updated_at
            BEFORE UPDATE ON student_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Classes
            CREATE TRIGGER update_classes_updated_at
            BEFORE UPDATE ON classes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Subjects
            CREATE TRIGGER update_subjects_updated_at
            BEFORE UPDATE ON subjects
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Teacher Assignments
            CREATE TRIGGER update_teacher_assignments_updated_at
            BEFORE UPDATE ON teacher_assignments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Marks
            CREATE TRIGGER update_marks_updated_at
            BEFORE UPDATE ON marks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
            -- Attendance Records
            CREATE TRIGGER update_attendance_records_updated_at
            BEFORE UPDATE ON attendance_records
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        </sql>
        
        <rollback>
            <sql splitStatements="true">
                DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
                DROP TRIGGER IF EXISTS update_users_updated_at ON users;
                DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
                DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
                DROP TRIGGER IF EXISTS update_teacher_profiles_updated_at ON teacher_profiles;
                DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
                DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
                DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
                DROP TRIGGER IF EXISTS update_teacher_assignments_updated_at ON teacher_assignments;
                DROP TRIGGER IF EXISTS update_marks_updated_at ON marks;
                DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON attendance_records;
            </sql>
        </rollback>
    </changeSet>
    
    <changeSet id="020-create-marks-validation-trigger-function" author="system">
        <sql>
            CREATE OR REPLACE FUNCTION validate_marks_against_max()
            RETURNS TRIGGER AS $$
            DECLARE
                v_max_marks INTEGER;
            BEGIN
                SELECT max_marks INTO v_max_marks
                FROM exam_types
                WHERE exam_type_id = NEW.exam_type_id;
                
                IF NEW.marks_obtained > v_max_marks THEN
                    RAISE EXCEPTION 'Marks obtained (%) cannot exceed maximum marks (%) for this exam type',
                        NEW.marks_obtained, v_max_marks;
                END IF;
                
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        </sql>
        
        <rollback>
            <sql>DROP FUNCTION IF EXISTS validate_marks_against_max() CASCADE;</sql>
        </rollback>
    </changeSet>
    
    <changeSet id="020-create-marks-validation-triggers" author="system">
        <sql splitStatements="true">
            CREATE TRIGGER validate_marks_before_insert
            BEFORE INSERT ON marks
            FOR EACH ROW
            EXECUTE FUNCTION validate_marks_against_max();
            
            CREATE TRIGGER validate_marks_before_update
            BEFORE UPDATE ON marks
            FOR EACH ROW
            EXECUTE FUNCTION validate_marks_against_max();
        </sql>
        
        <rollback>
            <sql splitStatements="true">
                DROP TRIGGER IF EXISTS validate_marks_before_insert ON marks;
                DROP TRIGGER IF EXISTS validate_marks_before_update ON marks;
            </sql>
        </rollback>
    </changeSet>

</databaseChangeLog>
```

---

## Running Migrations

### Development Environment
```bash
# Run all pending migrations
mvn update

# Rollback last changeset
mvn rollback -Pliquibase.rollbackCount=1

# Generate SQL for review (without executing)
mvn updateSQL

# Validate changelog
mvn validate
```

### Production Deployment
```bash
# 1. Backup database first
pg_dump -U postgres college_mgmt_db > backup_$(date +%Y%m%d).sql

# 2. Dry run - generate SQL
mvn updateSQL -Pspring.profiles.active=prod

# 3. Review generated SQL

# 4. Execute migration
mvn update -Pspring.profiles.active=prod

# 5. Verify migration
mvn status -Pspring.profiles.active=prod
```

---

## Rollback Strategy

### Rollback Last Migration
```bash
mvn rollback -Pliquibase.rollbackCount=1
```

### Rollback to Specific Tag
```bash
mvn rollback -Pliquibase.rollbackTag=v1.0-baseline
```

### Rollback to Date
```bash
mvn rollback -Pliquibase.rollbackDate=2024-12-01
```

---

## Best Practices

1. **Never modify executed changesets** - Always create new changesets for changes
2. **Use contexts** - Separate dev and prod data using contexts
3. **Always test rollback** - Verify rollback scripts work before production
4. **Backup before migration** - Always backup database before running migrations
5. **Review SQL first** - Use `updateSQL` to review changes before executing
6. **Use descriptive IDs** - Use meaningful changeset IDs
7. **One logical change per changeset** - Keep changesets focused
8. **Add comments** - Document why changes are being made

---

**Note:** Complete migration files for tables 005-013, 015-017, 019 follow the same pattern as shown above. The structure remains consistent with proper foreign keys, indexes, and auditing fields.