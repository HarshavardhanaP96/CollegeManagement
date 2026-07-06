import os

src_dir = "backend/src/main/java"

def fix_content(content):
    content = content.replace("import com.edgepoint.core.domain.ApiResponse;\n", "")
    content = content.replace("import com.edgepoint.academic.domain.Class;\n", "")
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
                print(f"Removed bad imports in {file_path}")

print("Import cleanup complete.")
