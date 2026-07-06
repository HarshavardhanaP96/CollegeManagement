import os

# Fix ClassRepository
repo_file = "backend/src/main/java/com/edgepoint/academic/repository/ClassRepository.java"
if os.path.exists(repo_file):
    with open(repo_file, "r") as f:
        content = f.read()
    content = content.replace("JpaRepository<Class, ", "JpaRepository<AcademicClass, ")
    with open(repo_file, "w") as f:
        f.write(content)

# Fix JwtService for JJWT 0.12.5
jwt_file = "backend/src/main/java/com/edgepoint/core/security/JwtService.java"
if os.path.exists(jwt_file):
    with open(jwt_file, "r") as f:
        content = f.read()
    
    # Imports
    if "javax.crypto.SecretKey" not in content:
        content = content.replace("import java.security.Key;", "import javax.crypto.SecretKey;")
        
    # Return type of getSigningKey
    content = content.replace("private Key getSigningKey()", "private SecretKey getSigningKey()")
    
    # parsing
    content = content.replace("Jwts.parserBuilder()\\n                .setSigningKey(getSigningKey())\\n                .build()\\n                .parseClaimsJws(token)\\n                .getBody();", "Jwts.parser()\\n                .verifyWith(getSigningKey())\\n                .build()\\n                .parseSignedClaims(token)\\n                .getPayload();")
    
    # Replace multiline accurately:
    content = content.replace("Jwts.parserBuilder()", "Jwts.parser()")
    content = content.replace(".setSigningKey(getSigningKey())", ".verifyWith(getSigningKey())")
    content = content.replace(".parseClaimsJws(token)", ".parseSignedClaims(token)")
    content = content.replace(".getBody()", ".getPayload()")
    
    with open(jwt_file, "w") as f:
        f.write(content)

print("Applied fixes for JJWT 0.12 and ClassRepository.")
