import os
import re
import shutil

BASE_DIR = "backend/src/main/java/com/edgepoint"

MAPPING = {
    "config/RedisConfig.java": "core/config/RedisConfig.java",
    "config/WebSecurityConfig.java": "core/security/WebSecurityConfig.java",
    "config/DataSeeder.java": "core/config/DataSeeder.java",
    "filter/JwtAuthFilter.java": "core/security/JwtAuthFilter.java",
    "service/JwtService.java": "core/security/JwtService.java",
    "controller/GlobalExceptionHandler.java": "core/exception/GlobalExceptionHandler.java",
    "entity/BaseEntity.java": "core/domain/BaseEntity.java",
    "dto/ApiResponse.java": "core/domain/ApiResponse.java",
}

# For directories, old -> new relative paths
DIR_MAPPING = {
    "dto/attendance": "attendance/dto",
    "dto/analytics": "analytics/dto",
    "dto/student": "student/dto",
    "dto/finance": "finance/dto",
    "dto/academic": "academic/dto",
}

PACKAGE_RENAMES = {
    "com.edgepoint.config.RedisConfig": "com.edgepoint.core.config.RedisConfig",
    "com.edgepoint.config.WebSecurityConfig": "com.edgepoint.core.security.WebSecurityConfig",
    "com.edgepoint.config.DataSeeder": "com.edgepoint.core.config.DataSeeder",
    "com.edgepoint.filter.JwtAuthFilter": "com.edgepoint.core.security.JwtAuthFilter",
    "com.edgepoint.service.JwtService": "com.edgepoint.core.security.JwtService",
    "com.edgepoint.controller.GlobalExceptionHandler": "com.edgepoint.core.exception.GlobalExceptionHandler",
    "com.edgepoint.entity.BaseEntity": "com.edgepoint.core.domain.BaseEntity",
    "com.edgepoint.dto.ApiResponse": "com.edgepoint.core.domain.ApiResponse",
    "com.edgepoint.dto.attendance": "com.edgepoint.attendance.dto",
    "com.edgepoint.dto.analytics": "com.edgepoint.analytics.dto",
    "com.edgepoint.dto.student": "com.edgepoint.student.dto",
    "com.edgepoint.dto.finance": "com.edgepoint.finance.dto",
    "com.edgepoint.dto.academic": "com.edgepoint.academic.dto",
    "com.edgepoint.config": "com.edgepoint.core.config",
    "com.edgepoint.filter": "com.edgepoint.core.security",
    "com.edgepoint.service": "com.edgepoint.core.security",
    "com.edgepoint.controller": "com.edgepoint.core.exception",
    "com.edgepoint.entity": "com.edgepoint.core.domain",
}

def move_files():
    for old_rel, new_rel in MAPPING.items():
        old_path = os.path.join(BASE_DIR, old_rel)
        new_path = os.path.join(BASE_DIR, new_rel)
        if os.path.exists(old_path):
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            shutil.move(old_path, new_path)

    for old_dir, new_dir in DIR_MAPPING.items():
        old_path = os.path.join(BASE_DIR, old_dir)
        new_path = os.path.join(BASE_DIR, new_dir)
        if os.path.exists(old_path):
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            shutil.move(old_path, new_path)

def update_imports_and_packages():
    for root, dirs, files in os.walk("backend/src/main/java"):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                new_content = content
                # Sort by length descending to replace most specific first
                for old_pkg, new_pkg in sorted(PACKAGE_RENAMES.items(), key=lambda x: -len(x[0])):
                    # Replace in imports
                    new_content = re.sub(r'import\s+' + re.escape(old_pkg) + r'(\.|\s*;)', r'import ' + new_pkg + r'\1', new_content)
                    # Replace in package declarations
                    new_content = re.sub(r'package\s+' + re.escape(old_pkg) + r'\s*;', r'package ' + new_pkg + r';', new_content)

                if content != new_content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)

def cleanup_empty_dirs():
    for root, dirs, files in os.walk(BASE_DIR, topdown=False):
        for d in dirs:
            dir_path = os.path.join(root, d)
            if not os.listdir(dir_path):
                os.rmdir(dir_path)

move_files()
update_imports_and_packages()
cleanup_empty_dirs()
print("Refactoring complete.")
