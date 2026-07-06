import os
import shutil
import re

test_dir = 'backend/src/test/java/com/collegeManagement/production'
new_base = 'backend/src/test/java/com/edgepoint'

package_mapping = {
    'unit/service/auth': 'core/security',
    'unit/service/college': 'core/service',
    'unit/service/mark': 'academic/service',
    'unit/service/user': 'core/service',
    'config': 'config',
    'integration/api': 'integration/api',
    'integration/repository': 'integration/repository'
}

def move_and_update():
    if not os.path.exists(test_dir):
        print("Test directory not found.")
        return

    for root, dirs, files in os.walk(test_dir):
        for file in files:
            if file.endswith('.java'):
                old_path = os.path.join(root, file)
                rel_path = os.path.relpath(old_path, test_dir)
                dir_name = os.path.dirname(rel_path)
                
                new_sub_dir = dir_name
                for old_sub, new_sub in package_mapping.items():
                    if dir_name.startswith(old_sub):
                        new_sub_dir = dir_name.replace(old_sub, new_sub, 1)
                        break
                
                # Handle ProductionApplicationTests.java
                if dir_name == '':
                    new_sub_dir = ''
                
                new_path = os.path.join(new_base, new_sub_dir, file)
                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                
                with open(old_path, 'r') as f:
                    content = f.read()
                
                # Update package
                old_pkg = 'com.collegeManagement.production' + ('.' + dir_name.replace('/', '.') if dir_name else '')
                new_pkg = 'com.edgepoint' + ('.' + new_sub_dir.replace('/', '.') if new_sub_dir else '')
                
                content = content.replace(f'package {old_pkg};', f'package {new_pkg};')
                
                # We will rely on resolve_imports.py to fix the imports later, but let's do some basic ones
                content = content.replace('com.collegeManagement.production.', 'com.edgepoint.')
                content = re.sub(r'\bClass\b(?=\s+\w)', 'AcademicClass', content)
                content = re.sub(r'\bClass\b(?=>)', 'AcademicClass', content)
                content = re.sub(r'\bClass\b(?=\.)', 'AcademicClass', content)
                
                with open(new_path, 'w') as f:
                    f.write(content)
                
                print(f"Moved {old_path} -> {new_path}")
                os.remove(old_path)

if __name__ == '__main__':
    move_and_update()
