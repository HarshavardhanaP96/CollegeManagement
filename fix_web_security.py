import os

web_sec = "backend/src/main/java/com/edgepoint/config/WebSecurityConfig.java"
filter_file = "backend/src/main/java/com/edgepoint/core/security/JwtAuthenticationFilter.java"

if os.path.exists(web_sec):
    with open(web_sec, "r") as f:
        content = f.read()
    content = content.replace("import com.edgepoint.core.security.JwtAuthFilter;", "import com.edgepoint.core.security.JwtAuthenticationFilter;")
    content = content.replace("JwtAuthFilter ", "JwtAuthenticationFilter ")
    content = content.replace("jwtAuthFilter;", "jwtAuthenticationFilter;")
    with open(web_sec, "w") as f:
        f.write(content)

if os.path.exists(filter_file):
    with open(filter_file, "r") as f:
        content = f.read()
    if "import com.edgepoint.core.security.TenantContext;" not in content:
        content = content.replace("import org.springframework.web.filter.OncePerRequestFilter;", "import org.springframework.web.filter.OncePerRequestFilter;\nimport com.edgepoint.core.security.TenantContext;")
    content = content.replace("jwtTokenUtil", "jwtService")
    content = content.replace("JwtTokenUtil", "JwtService")
    with open(filter_file, "w") as f:
        f.write(content)

print("Final security imports fixed.")
