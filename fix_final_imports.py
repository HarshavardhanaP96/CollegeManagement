import os

src_dir = "backend/src"

def fix_imports(content):
    content = content.replace("import com.edgepoint.core.domain.ApiResponse;", "import com.edgepoint.core.dto.ApiResponse;")
    content = content.replace("import com.edgepoint.academic.domain.Class;", "import com.edgepoint.academic.domain.AcademicClass;")
    return content

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".java"):
            file_path = os.path.join(root, file)
            with open(file_path, "r") as f:
                content = f.read()
            
            new_content = fix_imports(content)
            if content != new_content:
                with open(file_path, "w") as f:
                    f.write(new_content)
                print(f"Fixed imports in {file_path}")

print("Import fixing complete.")
