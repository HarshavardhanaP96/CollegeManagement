# College Management System - Project Context

## Overview
A full-stack application for managing college data, including departments, courses, students, teachers, attendance, and marks.

## Technology Stack
### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State Management**: Zustand (Auth store)
- **Data Fetching**: TanStack Query v5
- **Table Management**: TanStack Table v8
- **Validation**: Zod + React Hook Form
- **API Client**: Axios

### Backend
- **Framework**: Spring Boot 3.5.8
- **Language**: Java 17
- **Security**: Spring Security + JWT
- **Database**: PostgreSQL (Migrations via Liquibase)
- **Mapping**: MapStruct
- **Boilerplate**: Lombok
- **Documentation**: OpenAPI/Swagger

## Project Structure
- `backend/src/main/java/com/collegeManagement/production`: Root package for the backend.
- `frontend/src`:
  - `api/`: API definitions and axios client.
  - `pages/`: UI pages for different roles.
  - `store/`: State management.

## Current Maintenance Tasks
1. **Backend Package Fix**: Align package declarations and imports with the `com.collegeManagement.production` structure.
2. **Frontend Syntax Update**: Align TanStack Query usage with v5 standards.
3. **Build Validation**: Ensure both layers compile successfully.
4. **Database Configuration**: Added default PostgreSQL configuration in `application.properties` and initialized Liquibase master changelog.

## Local Development Setup
- **PostgreSQL**: Requires a database named `college_management`.
- **Environment Variables**:
  - `SPRING_DATASOURCE_URL`: JDBC URL (default: `jdbc:postgresql://localhost:5432/college_management`)
  - `SPRING_DATASOURCE_USERNAME`: DB Username (default: `postgres`)
  - `SPRING_DATASOURCE_PASSWORD`: DB Password (default: `postgres`)
  - `JWT_SECRET`: Secret for JWT signing.
