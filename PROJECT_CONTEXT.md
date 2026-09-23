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
- **Build**: Maven (migrated off Gradle)
- **Security**: Spring Security + JWT
- **Database**: PostgreSQL (Migrations via Flyway, `backend/src/main/resources/db/migration`)
- **Boilerplate**: Lombok
- **Documentation**: OpenAPI/Swagger
- **Also present**: Redis, Kafka, S3, Stripe integration

## Project Structure
- `backend/src/main/java/com/edgepoint/`: Root package for the backend, organized **feature-first**
  (`core`, `academic`, `attendance`, `student`, `teacher`, `notification`), each with its own
  `controller/domain/dto/repository/service`.
- `frontend/src`:
  - `api/`: API definitions and axios client.
  - `pages/`: UI pages for different roles (`superadmin`, `collegeadmin`, `hod`, `teacher`, `student`).
  - `components/edgepoint`: Role-specific portals and shared UI kit.
  - `store/`: State management (Zustand).
  - `strategies/`: Role-based navigation/permission strategy.

## Current Maintenance Tasks
1. **Notification module**: Per-college SMTP + WhatsApp Cloud API configuration is in progress
   (`com.edgepoint.notification`). Secrets (`smtp_password`, `whatsapp_api_key`) are encrypted at
   rest via `EncryptedStringConverter` (AES-256-GCM); set `ENCRYPTION_KEY` in every non-dev environment.
2. **Build Validation**: Ensure both layers compile successfully.

## Local Development Setup
- **PostgreSQL**: Requires a database named `edgepoint` (see `backend/src/main/resources/application.yml`).
- **Environment Variables**:
  - `JWT_SECRET`: Secret for JWT signing.
  - `ENCRYPTION_KEY`: Base64 AES-256 key used to encrypt secret columns at rest (e.g. notification config credentials). Has a dev-only default; must be overridden outside local dev.
  - `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET`: Stripe integration credentials.
