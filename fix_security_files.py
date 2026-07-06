import os

filter_file = "backend/src/main/java/com/edgepoint/core/security/JwtAuthenticationFilter.java"
service_file = "backend/src/main/java/com/edgepoint/core/security/JwtService.java"

with open(filter_file, "r") as f:
    content = f.read()

content = content.replace("package com.collegeManagement.production.security;", "package com.edgepoint.core.security;")
content = content.replace("import com.collegeManagement.production.entity.User;", "import com.edgepoint.core.domain.User;")
content = content.replace("JwtTokenUtil", "JwtService")

with open(filter_file, "w") as f:
    f.write(content)

with open(service_file, "r") as f:
    content = f.read()

content = content.replace("package com.collegeManagement.production.security;", "package com.edgepoint.core.security;")
content = content.replace("import com.collegeManagement.production.entity.User;", "import com.edgepoint.core.domain.User;")
content = content.replace("class JwtTokenUtil", "class JwtService")
content = content.replace("public JwtTokenUtil", "public JwtService") # for constructor if any

with open(service_file, "w") as f:
    f.write(content)

print("Security files fixed.")
