# College Management System - User Guide

**Version:** 1.1  
**For:** SuperAdmin, CollegeAdmin, HOD, Teacher, Student  
**Phase:** 1

---

## Table of Contents
1. [Getting Started](#1-getting-started)
2. [SuperAdmin Guide](#2-superadmin-guide)
3. [CollegeAdmin Guide](#3-collegeadmin-guide)
4. [HOD (Department Admin) Guide](#4-hod-department-admin-guide)
5. [Teacher Guide](#5-teacher-guide)
6. [Student Guide](#6-student-guide)
7. [FAQ](#7-frequently-asked-questions)

---

## 1. Getting Started

### System Access

**Web Portal:** https://college.example.com

**Login Credentials:**
- Your username/email will be provided by your administrator
- You will receive a temporary password on first login
- You must change your password after first login

### First Time Login Steps

1. Navigate to the login page
2. Enter your username/email and temporary password
3. Click **"Login"**
4. You will be prompted to change your password
5. Enter a new strong password (minimum 8 characters, include uppercase, lowercase, number, and special character)
6. Click **"Update Password"**
7. You will be redirected to your dashboard

### Dashboard Overview

After login, you'll see your personalized dashboard based on your role:
- **SuperAdmin:** College management overview
- **CollegeAdmin:** Department and course statistics
- **HOD:** Department overview, teacher and student counts
- **Teacher:** Assigned classes and subjects
- **Student:** Personal academic overview

---

## 2. SuperAdmin Guide

**Role:** Developer company administrator with full system access

### 2.1 Managing Colleges

#### Creating a New College

1. Navigate to **Colleges > Add New College**
2. Fill in the required information:
    - **College Name:** Full official name (e.g., "ABC Institute of Technology")
    - **College Code:** Short unique code (e.g., "ABC-IT")
    - **Address:** Complete postal address
    - **Contact Email:** Official college email
    - **Contact Phone:** Official college phone number
3. Click **"Create College"**
4. System will generate a college ID and confirm creation

#### Viewing All Colleges

1. Navigate to **Colleges > View All**
2. You'll see a list with:
    - College Name
    - College Code
    - Number of Departments
    - Total Students
    - Total Teachers
    - Status (Active/Inactive)
3. Click on any college to view detailed information

#### Editing College Information

1. Navigate to **Colleges > View All**
2. Click on the college name you want to edit
3. Click **"Edit"** button
4. Update the required fields
5. Click **"Save Changes"**

#### Deactivating a College

1. Navigate to **Colleges > View All**
2. Click on the college you want to deactivate
3. Click **"Deactivate"** button
4. Confirm the action in the popup dialog
5. **Note:** This will soft-delete the college and make it inactive

### 2.2 Managing System Users

#### Creating College Admins

1. Navigate to **Users > Add College Admin**
2. Select the college from dropdown
3. Fill in user details:
    - Username
    - Email
    - Full Name
    - Phone Number
4. Click **"Create User"**
5. System will generate a temporary password and send it to the email

#### Viewing All Users

1. Navigate to **Users > View All**
2. Filter by:
    - College
    - Role
    - Status (Active/Inactive)
3. Use search bar to find specific users

### 2.3 System Reports

- **College Performance Reports:** Navigate to **Reports > Colleges**
- **User Activity Logs:** Navigate to **Audit log**. Every create, update and delete is listed
  newest first, with who did it and what changed; filter by college, action, entity or date.
- **System Health:** Navigate to **Dashboard > System Status**

### 2.4 Help Articles

1. Navigate to **Help articles**
2. Click **New article**, pick a category and the roles that should see it
3. Save as **Draft** to keep it hidden, or **Published** to show it under **Help** for those roles
4. **Archived** hides an article without deleting it. A category can only be deleted once it has
   no articles.

---

## 3. CollegeAdmin Guide

**Role:** College-level administrator managing departments and college-wide settings

**Access Scope:** Your assigned college only

### 3.1 Managing Departments

#### Creating a New Department

1. Navigate to **Departments > Add New Department**
2. Fill in the required information:
    - **Department Name:** Full name (e.g., "Computer Science and Engineering")
    - **Department Code:** Short code (e.g., "CSE")
3. Click **"Create Department"**
4. Department will be created without a head initially

#### Assigning Department Head (HOD)

**Option 1: Create New HOD**
1. Navigate to **Departments > View All**
2. Click on department name
3. Click **"Assign HOD"**
4. Select **"Create New User"**
5. Fill in HOD details:
    - Username
    - Email
    - Full Name
    - Phone Number
6. Click **"Create and Assign"**

**Option 2: Assign Existing User**
1. Navigate to **Departments > View All**
2. Click on department name
3. Click **"Assign HOD"**
4. Select **"Choose Existing User"**
5. Select user from dropdown
6. Click **"Assign"**

#### Viewing Department Details

1. Navigate to **Departments > View All**
2. Click on any department to view:
    - Department information
    - Current HOD
    - Number of teachers
    - Number of students
    - Subjects offered
    - Active classes

### 3.2 Managing Courses

#### Creating Academic Programs

1. Navigate to **Courses > Add New Course**
2. Fill in course information:
    - **Course Name:** Full program name (e.g., "Bachelor of Technology")
    - **Course Code:** Short code (e.g., "B.Tech")
    - **Duration (Years):** Number of years (e.g., 4)
    - **Total Semesters:** Number of semesters (e.g., 8)
3. Click **"Create Course"**

#### Editing Course Information

1. Navigate to **Courses > View All**
2. Click on the course you want to edit
3. Click **"Edit"** button
4. Update required fields
5. Click **"Save Changes"**

### 3.3 College Reports

- **Department-wise Statistics:** Navigate to **Reports > Departments**
- **Student Enrollment Trends:** Navigate to **Reports > Enrollment**
- **Teacher Distribution:** Navigate to **Reports > Teachers**
- **Audit log:** Navigate to **Audit log** to see every change made in your college.

### 3.4 Privacy (DPDP)

Navigate to **Privacy**. The tabs let you:
- **Requests:** work through access, correction, erasure and grievance requests from students and
  teachers. Overdue requests are flagged. Take a request into review, then resolve it as
  completed, partially completed or rejected.
- **Privacy notice:** publish a new notice; users are asked to accept it on their next login.
- **Retention:** set how long each kind of data is kept, preview a run (dry run) and run it.
- **Audit log:** see every privacy action taken.

Details in [PRIVACY.md](PRIVACY.md).

---

## 4. HOD (Department Admin) Guide

**Role:** Department head managing teachers, subjects, and classes

**Access Scope:** Your assigned department only

### 4.1 Managing Subjects

#### Creating a New Subject

1. Navigate to **Subjects > Add New Subject**
2. Fill in subject details:
    - **Subject Code:** Unique code (e.g., "CS301")
    - **Subject Name:** Full name (e.g., "Data Structures and Algorithms")
    - **Credits:** Credit hours (e.g., 3)
    - **Subject Type:** Select Theory/Practical/Project
3. Click **"Create Subject"**

#### Viewing All Subjects

1. Navigate to **Subjects > View All**
2. You'll see list of all subjects in your department
3. Click on subject to view details including:
    - Classes where it's taught
    - Assigned teachers

#### Editing/Deleting Subjects

1. Navigate to **Subjects > View All**
2. Click on subject name
3. Click **"Edit"** to modify details
4. Click **"Delete"** to remove (soft delete)

### 4.2 Managing Teachers

#### Adding a New Teacher

1. Navigate to **Teachers > Add New Teacher**
2. Fill in teacher information:
    - **Username:** Unique username
    - **Email:** Official email
    - **Full Name:** Teacher's full name
    - **Phone:** Contact number
    - **Employee ID:** Unique employee identifier
    - **Qualification:** Highest degree (e.g., "M.Tech, Ph.D")
    - **Specialization:** Area of expertise
    - **Hire Date:** Joining date
3. Click **"Create Teacher"**
4. System will send credentials to teacher's email

#### Viewing Teacher Profiles

1. Navigate to **Teachers > View All**
2. View list with:
    - Name
    - Employee ID
    - Specialization
    - Number of assigned classes
    - Status
3. Click on teacher name to view full profile

### 4.3 Managing Classes

#### Creating a New Class

1. Navigate to **Classes > Add New Class**
2. Fill in class details:
    - **Course:** Select course from dropdown (e.g., "B.Tech")
    - **Academic Year:** Enter year (e.g., "2024-2025")
    - **Semester:** Select semester (1-8)
    - **Section:** Enter section (e.g., "A")
    - **Class Name:** Auto-generated or enter custom (e.g., "B.Tech CSE 3rd Sem A 2024-25")
3. Click **"Create Class"**

#### Adding Subjects to a Class

1. Navigate to **Classes > View All**
2. Click on class name
3. Click **"Add Subject"** button
4. Select subject from dropdown
5. Click **"Add"**
6. Repeat for all subjects in the curriculum

#### Assigning Teachers to Class-Subjects

1. Navigate to **Classes > View All**
2. Click on class name
3. You'll see list of subjects added to this class
4. For each subject, click **"Assign Teacher"**
5. Select teacher from dropdown
6. Click **"Assign"**
7. **Note:** You can assign multiple teachers to the same subject

### 4.4 Managing Student Enrollments

#### Enrolling Students in a Class

**Option 1: Enroll Individual Student**
1. Navigate to **Classes > View All**
2. Click on class name
3. Click **"Enroll Students"**
4. Search and select student
5. Click **"Enroll"**

**Option 2: Bulk Enrollment** (Future Phase)
- CSV upload feature coming soon

#### Viewing Enrolled Students

1. Navigate to **Classes > View All**
2. Click on class name
3. Click **"Students"** tab
4. View list of enrolled students with:
    - Roll Number
    - Name
    - Email
    - Enrollment Status

### 4.5 Department Reports

- **Class-wise Student Count:** Navigate to **Reports > Classes**
- **Teacher Workload:** Navigate to **Reports > Teacher Assignments**
- **Subject Distribution:** Navigate to **Reports > Subjects**

---

## 5. Teacher Guide

**Role:** Faculty member managing attendance and marks

**Access Scope:** Your assigned class-subjects only

### 5.1 Viewing Assigned Classes

#### Your Dashboard

When you log in, you'll see:
- List of all classes assigned to you
- Subject name for each class
- Number of students in each class
- Quick actions: Mark Attendance, Enter Marks

#### Viewing Class Details

1. Navigate to **My Classes** from sidebar
2. Click on any class to view:
    - Class information
    - Subject details
    - List of enrolled students
    - Attendance summary
    - Marks summary

### 5.2 Recording Attendance

#### Marking Daily Attendance

1. Navigate to **Attendance**
2. Pick the **Class-Subject** and the **Date** (defaults to today)
3. Every enrolled student is shown as a checkbox, ticked (present) by default. Use
   **Select all** or a row's checkbox to mark a whole group at once, then untick the absentees.
4. Click **Save attendance**. The whole register is saved in one go and you'll see how many were
   present and absent. Parents of students newly marked absent are notified.

#### Viewing Attendance History

1. Navigate to **Attendance > View History**
2. Select class and subject
3. Select date range
4. View attendance records with:
    - Date
    - Student Name
    - Status (Present/Absent)
    - Remarks

#### Editing Attendance

1. Navigate to **Attendance** and pick the same class-subject and date
2. The saved register loads, marked **Already saved for this date**
3. Change the checkboxes and click **Update attendance**. Saving the same day again updates it;
   it never creates duplicates.

### 5.3 Entering Marks

#### Recording Exam Marks

1. Navigate to **Marks > Enter Marks**
2. Select:
    - **Class:** Your assigned class
    - **Subject:** Your assigned subject
    - **Exam Type:** Select exam (e.g., "Internal 1", "Final Semester")
3. You'll see list of all enrolled students
4. For each student, enter:
    - **Marks Obtained:** Enter marks (system validates against max marks)
    - **Remarks:** Optional comments
5. Click **"Save Draft"** to save temporarily
6. Click **"Submit"** to finalize marks

**Important Notes:**
- Marks cannot exceed maximum marks for that exam type
- Once submitted, marks can only be edited within 24 hours
- Negative marks are not allowed

#### Viewing and Editing Marks

1. Navigate to **Marks > View Marks**
2. Select class, subject, and exam type
3. View all entered marks
4. Click **"Edit"** to modify (if within edit window)
5. Click **"Download"** to export as Excel/PDF

#### Marks Summary Report

1. Navigate to **Marks > Summary Report**
2. Select class and subject
3. View comprehensive report showing:
    - Student-wise marks across all exam types
    - Average marks
    - Highest/lowest scores
    - Pass/fail statistics

### 5.4 Student Performance Analysis

1. Navigate to **Reports > Student Performance**
2. Select class and subject
3. View:
    - Attendance percentage for each student
    - Marks across all exams
    - Overall performance trend

---

## 6. Student Guide

**Role:** Student with access to view marks and attendance

**Access Scope:** Your own academic records only

### 6.1 Viewing Your Profile

#### Profile Information

1. Navigate to **Profile** from sidebar
2. View your information:
    - Personal details (Name, Email, Phone)
    - Roll Number
    - Department and Course
    - Current Semester
    - Parent/Guardian details

#### Updating Profile

1. Navigate to **Profile**
2. Click **"Edit Profile"** button
3. You can update:
    - Phone Number
    - Email (requires verification)
    - Parent/Guardian phone
4. Click **"Save Changes"**

**Note:** Some fields like Roll Number, Department cannot be changed by students

### 6.2 Viewing Your Marks

#### Current Semester Marks

1. Navigate to **Marks > My Marks**
2. You'll see marks for all subjects in current semester
3. For each subject, view:
    - Subject Name
    - Subject Code
    - Teacher Name
    - Marks in different exams (Internal 1, Internal 2, Final, etc.)
    - Total marks obtained
    - Percentage

#### Viewing Previous Semester Marks

1. Navigate to **Marks > My Marks**
2. Select **"Previous Semesters"** from dropdown
3. Select semester you want to view
4. View marks similar to current semester

#### Downloading Mark Sheet

1. Navigate to **Marks > My Marks**
2. Select semester
3. Click **"Download Mark Sheet"** button
4. Choose format (PDF/Excel)
5. File will be downloaded to your device

### 6.3 Viewing Your Attendance

#### Current Semester Attendance

1. Navigate to **Attendance > My Attendance**
2. View overall attendance percentage
3. View subject-wise attendance with:
    - Subject Name
    - Total Classes
    - Classes Attended
    - Attendance Percentage
    - Status indicator (color-coded: Green >75%, Yellow 65-75%, Red <65%)

#### Detailed Attendance Records

1. Navigate to **Attendance > My Attendance**
2. Click on any subject
3. View day-by-day attendance:
    - Date
    - Status (Present/Absent)
    - Teacher Remarks (if any)

#### Attendance Trends

1. Navigate to **Attendance > Trends**
2. View graphical representation:
    - Monthly attendance percentage
    - Subject-wise comparison
    - Trend line showing improvement/decline

### 6.4 My Privacy (students and teachers)

Navigate to **My Privacy** to:
- read the current privacy notice and turn optional consents on or off
- raise a request: **Access my data** (download a copy), **Correct my data**, **Erase my data**,
  or **Raise a grievance**
- follow your requests' status, cancel one that hasn't been picked up yet, and download your
  data once an access request is completed

### 6.5 Help

Every role has **Help** in the sidebar: search or browse articles written for your role, and mark
whether an article was helpful. If it doesn't answer your question, use **Support** to send a
message to the support team.

### 6.6 Academic Calendar (Future Phase)

- Exam schedules
- Holiday calendar
- Important dates

---

## 7. Frequently Asked Questions

### General Questions

**Q: I forgot my password. How can I reset it?**  
A: There is no self-service reset yet. Ask your administrator to reset it. Once logged in, you
can change it yourself; that logs you out of every other device.

**Q: Can I access the system from mobile?**  
A: Yes, the web portal is mobile-responsive. Mobile apps are planned for Phase 2.

**Q: My role is not correct. How do I get it changed?**  
A: Contact your administrator (CollegeAdmin for teachers/students, CollegeAdmin/SuperAdmin for others).

### For Teachers

**Q: I made a mistake in attendance. Can I change it?**  
A: Yes. Open **Attendance**, pick the same class-subject and date, fix it, and click
**Update attendance**.

**Q: What is the deadline for submitting marks?**  
A: Check with your HOD/CollegeAdmin. Generally, marks must be submitted within 7 days of exam completion.

**Q: Can I see marks entered by other teachers?**  
A: No, you can only see marks for subjects assigned to you.

**Q: How do I know the maximum marks for an exam?**  
A: System will display max marks when you enter marks. You cannot exceed this value.

### For Students

**Q: My attendance is showing incorrect. What should I do?**  
A: Contact your subject teacher or HOD to verify and correct.

**Q: When will marks be visible to me?**  
A: Marks will be visible within 2-3 days after teacher submits them. Check your dashboard for updates.

**Q: Can I see other students' marks?**  
A: No, you can only see your own marks. Privacy is maintained.

**Q: My parent wants to see my marks. How can they access?**  
A: Parent portal is planned for Phase 2. Currently, you can download and share your mark sheet.

### For HODs

**Q: Can I remove a teacher from an assignment?**  
A: Yes, go to Classes > Select Class > Teacher Assignments > Click Remove.

**Q: How do I handle multiple teachers for one subject?**  
A: You can assign multiple teachers to same class-subject. Each can mark their own attendance/marks.

**Q: Can I create subjects for other departments?**  
A: No, you can only create subjects within your own department.

### For CollegeAdmins

**Q: Can I access other colleges' data?**  
A: No, you can only manage your assigned college.

**Q: How do I transfer a teacher to another department?**  
A: Contact your SuperAdmin to reassign the teacher's department.

**Q: Can I delete a department?**  
A: Yes, but only if there are no active classes or enrolled students.

---

## 8. Support & Contact

### Technical Support
- **In the app:** check **Help** first, then send a message from **Support**
- **Email:** support@example.com
- **Phone:** +1-234-567-8900 (Mon-Fri, 9 AM - 6 PM)

### Escalation
For urgent issues:
1. Contact your immediate administrator first
2. If unresolved, escalate to SuperAdmin
3. For technical issues, contact IT support

### Feedback & Suggestions
We value your feedback! Submit suggestions via:
- **Feedback Form:** Available in dashboard sidebar
- **Email:** feedback@example.com

---

## 9. System Requirements

### Supported Browsers
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

### Internet Connection
- Minimum: 2 Mbps
- Recommended: 5 Mbps for smooth experience

### Screen Resolution
- Minimum: 1024x768
- Recommended: 1920x1080

---

## 10. Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial user guide for Phase 1 |
| 1.1 | Nov 2026 | One-click attendance register, audit log, privacy (DPDP), Help articles; no self-service password reset |

---

**Need more help?** Contact your system administrator or refer to the FAQ section above.