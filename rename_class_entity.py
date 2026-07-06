import os
import re

src_dir = "backend/src/main/java"
test_dir = "backend/src/test/java"

old_file = os.path.join(src_dir, "com/edgepoint/academic/domain/Class.java")
new_file = os.path.join(src_dir, "com/edgepoint/academic/domain/AcademicClass.java")

if os.path.exists(old_file):
    with open(old_file, "r") as f:
        content = f.read()
    content = content.replace("public class Class extends AuditableEntity", "public class AcademicClass extends AuditableEntity")
    with open(new_file, "w") as f:
        f.write(content)
    os.remove(old_file)
    print(f"Renamed {old_file} to {new_file}")

# We need to replace references to Class as an entity
for d in [src_dir, test_dir]:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".java"):
                file_path = os.path.join(root, file)
                with open(file_path, "r") as f:
                    content = f.read()
                
                original_content = content
                
                # Update import
                content = content.replace("import com.edgepoint.academic.domain.Class;", "import com.edgepoint.academic.domain.AcademicClass;")
                
                # Only if the file imports AcademicClass or is in the same package (com.edgepoint.academic.domain)
                if "import com.edgepoint.academic.domain.AcademicClass;" in content or "package com.edgepoint.academic.domain;" in content:
                    # Replace "Class " with "AcademicClass " (type declaration)
                    # Use regex to replace Class when it's a type: e.g. "Class classEntity" -> "AcademicClass classEntity"
                    # "List<Class>" -> "List<AcademicClass>"
                    # "Page<Class>" -> "Page<AcademicClass>"
                    # "Optional<Class>" -> "Optional<AcademicClass>"
                    # "Class>" -> "AcademicClass>"
                    # "(Class " -> "(AcademicClass "
                    
                    content = re.sub(r'\bClass\b(?=\s+\w)', 'AcademicClass', content)
                    content = re.sub(r'\bClass\b(?=>)', 'AcademicClass', content)
                    content = re.sub(r'\bClass\b(?=\.)', 'AcademicClass', content) # Might break SomeClass.class, but if they are using AcademicClass.class it's fine
                    
                    # Fix any .class instances if they were wrongly updated
                    # AcademicClass.class is correct.
                    # String.class -> wait, we only matched \bClass\b.
                    
                if content != original_content:
                    with open(file_path, "w") as f:
                        f.write(content)
                    print(f"Updated {file_path}")

print("Done renaming Class to AcademicClass.")
