import os
import re

test_dir = "backend/src/test/java"

def update_imports(content):
    # Fix old or intermediate package references
    content = content.replace("com.collegeManagement.production.entity.", "com.edgepoint.core.domain.")
    content = content.replace("com.edgepoint.entity.", "com.edgepoint.core.domain.")
    content = content.replace("com.edgepoint.dto.", "com.edgepoint.core.dto.")
    content = content.replace("com.collegeManagement.production.dto.", "com.edgepoint.core.dto.")
    content = content.replace("com.collegeManagement.production.repository.", "com.edgepoint.core.repository.")
    content = content.replace("com.collegeManagement.production.", "com.edgepoint.")
    
    # Specific class replacements if they belong to different modules
    content = content.replace("import com.edgepoint.core.domain.Department;", "import com.edgepoint.academic.domain.Department;")
    content = content.replace("import com.edgepoint.core.domain.Course;", "import com.edgepoint.academic.domain.Course;")
    content = content.replace("import com.edgepoint.core.domain.Subject;", "import com.edgepoint.academic.domain.Subject;")
    content = content.replace("import com.edgepoint.core.domain.AcademicClass;", "import com.edgepoint.academic.domain.AcademicClass;")
    content = content.replace("import com.edgepoint.core.domain.Section;", "import com.edgepoint.academic.domain.Section;")
    content = content.replace("import com.edgepoint.core.domain.StudentProfile;", "import com.edgepoint.academic.domain.StudentProfile;")
    content = content.replace("import com.edgepoint.core.domain.TeacherProfile;", "import com.edgepoint.academic.domain.TeacherProfile;")
    content = content.replace("import com.edgepoint.core.domain.TeacherAssignment;", "import com.edgepoint.academic.domain.TeacherAssignment;")
    content = content.replace("import com.edgepoint.core.domain.AttendanceRecord;", "import com.edgepoint.attendance.domain.AttendanceRecord;")
    content = content.replace("import com.edgepoint.core.domain.Mark;", "import com.edgepoint.academic.domain.Mark;")
    content = content.replace("import com.edgepoint.core.domain.ExamType;", "import com.edgepoint.academic.domain.ExamType;")

    return content

for root, _, files in os.walk(test_dir):
    for file in files:
        if file.endswith(".java"):
            file_path = os.path.join(root, file)
            with open(file_path, "r") as f:
                content = f.read()
            
            new_content = update_imports(content)
            
            if content != new_content:
                with open(file_path, "w") as f:
                    f.write(new_content)
                print(f"Updated imports in {file_path}")

print("Test imports fixed.")
