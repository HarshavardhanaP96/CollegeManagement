import os
import re

src_dir = "backend/src/main/java"

def fix_content(content):
    # Fix ApiResponse mis-mapping
    content = content.replace("import com.edgepoint.core.domain.ApiResponse;", "import com.edgepoint.core.dto.ApiResponse;")
    
    # Fix Class entity mis-mapping
    content = content.replace("import com.edgepoint.academic.domain.Class;", "import com.edgepoint.academic.domain.AcademicClass;")
    
    # Clean up CollegeServiceImpl stray import
    content = content.replace("import com.collegeManagement.production.repository.*;\n", "")
    
    # Update AuthServiceImpl for JwtService
    if "class AuthServiceImpl" in content and "JwtTokenUtil" in content:
        content = content.replace("import com.edgepoint.core.security.JwtTokenUtil;", "import com.edgepoint.core.security.JwtService;")
        content = content.replace("JwtTokenUtil", "JwtService")
        content = content.replace("jwtTokenUtil", "jwtService")

    # Update WebSecurityConfig for JwtAuthenticationFilter
    if "class WebSecurityConfig" in content:
        content = content.replace("import com.collegeManagement.production.security.JwtAuthenticationFilter;", "import com.edgepoint.core.security.JwtAuthenticationFilter;")

    return content

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".java"):
            file_path = os.path.join(root, file)
            with open(file_path, "r") as f:
                content = f.read()
            
            new_content = fix_content(content)
            if content != new_content:
                with open(file_path, "w") as f:
                    f.write(new_content)
                print(f"Fixed imports in {file_path}")

print("Import fixing complete.")
