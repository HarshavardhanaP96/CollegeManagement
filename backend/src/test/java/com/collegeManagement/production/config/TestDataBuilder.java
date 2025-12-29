package com.collegeManagement.production.config;

import com.collegeManagement.production.entity.College;
import com.collegeManagement.production.entity.User;
import com.collegeManagement.production.entity.UserRole;

import java.time.LocalDateTime;

public class TestDataBuilder {

    public static class UserBuilder {
        private User user = new User();

        public static UserBuilder aUser() {
            UserBuilder builder = new UserBuilder();
            builder.user.setUserId(1);
            builder.user.setUsername("testuser");
            builder.user.setEmail("test@email.com");
            builder.user.setFullName("Test User");
            builder.user.setIsActive(true);
            builder.user.setIsDeleted(false);
            builder.user.setCreatedAt(LocalDateTime.now());
            return builder;
        }

        public UserBuilder withId(Integer id) {
            user.setUserId(id);
            return this;
        }

        public UserBuilder withUsername(String username) {
            user.setUsername(username);
            return this;
        }

        public UserBuilder withEmail(String email) {
            user.setEmail(email);
            return this;
        }

        public UserBuilder withCollegeId(Integer collegeId) {
            user.setCollegeId(collegeId);
            return this;
        }

        public UserBuilder withRoleId(Integer roleId) {
            user.setRoleId(roleId);
            UserRole role = new UserRole();
            role.setRoleId(roleId);
            user.setRole(role);
            return this;
        }

        public UserBuilder asTeacher() {
            return withRoleId(4);
        }

        public UserBuilder asStudent() {
            return withRoleId(5);
        }

        public User build() {
            return user;
        }
    }

    public static class CollegeBuilder {
        private College college = new College();

        public static CollegeBuilder aCollege() {
            CollegeBuilder builder = new CollegeBuilder();
            builder.college.setCollegeId(1);
            builder.college.setCollegeName("Test College");
            builder.college.setCollegeCode("TEST-COL");

            builder.college.setIsDeleted(false);
            builder.college.setCreatedAt(LocalDateTime.now());
            return builder;
        }

        public CollegeBuilder withId(Integer id) {
            college.setCollegeId(id);
            return this;
        }

        public CollegeBuilder withCollegeCode(String code) {
            college.setCollegeCode(code);
            return this;
        }

        public College build() {
            return college;
        }
    }
}
