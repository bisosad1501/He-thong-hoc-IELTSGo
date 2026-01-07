# 🔐 ROLES & PERMISSIONS - IELTS PLATFORM

> Phân tích chi tiết quyền hạn từng role dựa trên database schema và API routes

---

## 📊 TỔNG QUAN 3 ROLES

| Role | Display Name | Mô Tả | Số Lượng Permissions |
|------|--------------|-------|---------------------|
| **student** | Học viên | Người dùng học IELTS trên nền tảng | 4 permissions |
| **instructor** | Giảng viên | Người tạo và quản lý nội dung học liệu | 7 permissions |
| **admin** | Quản trị viên | Quản trị toàn bộ hệ thống | 10 permissions (all) |

---

## 🎓 ROLE 1: STUDENT (Học viên)

### Permissions
```sql
1. view_courses      (courses, read)   - Xem các khóa học
2. enroll_course     (courses, create) - Đăng ký khóa học
3. submit_exercise   (exercises, create) - Nộp bài tập
4. view_own_progress (progress, read)  - Xem tiến trình của chính mình
```

### Có thể làm gì?

#### ✅ Xem & Học
- Xem danh sách courses, course detail
- Xem nội dung lessons (videos, text, quiz)
- Xem danh sách exercises
- Xem chi tiết exercise

#### ✅ Đăng ký & Học tập
- Enroll vào courses
- Track lesson progress
- Start và submit exercises
- Xem kết quả bài làm

#### ✅ Theo dõi tiến độ
- Xem profile, cập nhật thông tin
- Xem learning progress
- Xem skill statistics (Listening, Reading, Writing, Speaking)
- Xem study history
- Tạo và quản lý study goals
- Xem achievements đã đạt được

#### ✅ Cài đặt cá nhân
- Cập nhật preferences
- Quản lý study reminders
- Xem leaderboard và ranking

#### ✅ Thông báo
- Xem notifications
- Cập nhật notification preferences
- Quản lý timezone

### ❌ KHÔNG thể làm gì?
- ❌ Tạo hoặc chỉnh sửa courses
- ❌ Tạo hoặc chỉnh sửa exercises
- ❌ Xem progress của học viên khác
- ❌ Xóa content
- ❌ Truy cập analytics
- ❌ Quản lý users
- ❌ Quản lý system

### API Endpoints (Student)

#### 🔓 Public (không cần auth)
```
GET  /api/v1/courses                    - List courses
GET  /api/v1/courses/:id                - Course detail
GET  /api/v1/courses/:id/modules        - Course modules
GET  /api/v1/categories                 - Categories
GET  /api/v1/exercises                  - List exercises
GET  /api/v1/exercises/:id              - Exercise detail
GET  /api/v1/tags                       - Tags
```

#### 🔐 Protected (cần auth)
```
Auth Service:
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/google/url
POST /api/v1/auth/google/token
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-password

User Service:
GET  /api/v1/user/profile
PUT  /api/v1/user/profile
POST /api/v1/user/profile/avatar
GET  /api/v1/user/progress
GET  /api/v1/user/progress/history
GET  /api/v1/user/statistics
GET  /api/v1/user/statistics/:skill
POST /api/v1/user/sessions
POST /api/v1/user/sessions/:id/end
POST /api/v1/user/goals
GET  /api/v1/user/goals
PUT  /api/v1/user/goals/:id
POST /api/v1/user/goals/:id/complete
DELETE /api/v1/user/goals/:id
GET  /api/v1/user/achievements
GET  /api/v1/user/achievements/earned
GET  /api/v1/user/preferences
PUT  /api/v1/user/preferences
POST /api/v1/user/reminders
GET  /api/v1/user/reminders
PUT  /api/v1/user/reminders/:id
DELETE /api/v1/user/reminders/:id
GET  /api/v1/user/leaderboard
GET  /api/v1/user/leaderboard/rank

Course Service:
POST /api/v1/enrollments              - Enroll course
GET  /api/v1/my-courses                - My courses
POST /api/v1/reviews                   - Add review
GET  /api/v1/courses/:id/reviews       - View reviews
POST /api/v1/videos/track              - Track video
PUT  /api/v1/progress/lessons/:id     - Update lesson progress

Exercise Service:
POST /api/v1/exercises/:id/start       - Start exercise
POST /api/v1/submissions                - Submit exercise
PUT  /api/v1/submissions/:id/answers   - Submit answers
GET  /api/v1/submissions/:id/result    - Get result
GET  /api/v1/submissions/my            - My submissions

Notification Service:
GET  /api/v1/notifications
GET  /api/v1/notifications/unread-count
PUT  /api/v1/notifications/:id/read
PUT  /api/v1/notifications/:id/unread
PUT  /api/v1/notifications/read-all
GET  /api/v1/notifications/preferences
PUT  /api/v1/notifications/preferences
GET  /api/v1/notifications/preferences/timezone
PUT  /api/v1/notifications/preferences/timezone
GET  /api/v1/notifications/scheduled
```

**Total Student Endpoints:** ~80 endpoints

---

## 👨‍🏫 ROLE 2: INSTRUCTOR (Giảng viên)

### Permissions
```sql
Kế thừa tất cả permissions của Student (4), CỘNG THÊM:

5. manage_courses          (courses, manage)   - Quản lý khóa học
6. manage_exercises        (exercises, manage) - Quản lý bài tập
7. view_student_progress   (progress, read)    - Xem tiến trình học viên
```

### Có thể làm gì?

#### ✅ Tất cả quyền của Student
- Tất cả features của Student

#### ✅ Quản lý Courses (Content Creator)
- **Tạo courses mới**
- **Chỉnh sửa courses** (của mình hoặc được assign)
- **Publish/Unpublish courses**
- Tạo modules cho course
- Tạo lessons cho module
- Add videos vào lessons
- Upload video content
- Quản lý course structure

#### ✅ Quản lý Exercises
- **Tạo exercises mới**
- **Chỉnh sửa exercises** (của mình)
- **Publish/Unpublish exercises**
- Tạo sections trong exercise
- Tạo questions (4 loại)
- Tạo question options
- Tạo question answers
- Quản lý question bank
- Add/remove tags cho exercises
- Xem exercise analytics

#### ✅ Xem Tiến Trình Học Viên
- Xem danh sách students enrolled
- Xem progress của từng student
- Xem submissions của students
- Xem analytics của courses/exercises
- Track student performance

#### ✅ Quản Lý Tags
- Tạo tags mới
- Add tags vào exercises
- Remove tags khỏi exercises

### ❌ KHÔNG thể làm gì?
- ❌ **Xóa courses** (chỉ admin mới được)
- ❌ Xóa exercises của instructor khác
- ❌ Quản lý users (add/remove users)
- ❌ Quản lý system settings
- ❌ Xem analytics toàn hệ thống
- ❌ Gửi bulk notifications
- ❌ Thay đổi roles của users

### API Endpoints (Instructor Only)

#### 🎓 Course Management
```
POST   /api/v1/admin/courses                    - Create course
PUT    /api/v1/admin/courses/:id                - Update course
POST   /api/v1/admin/courses/:id/publish        - Publish course
POST   /api/v1/admin/modules                    - Create module
POST   /api/v1/admin/lessons                    - Create lesson
POST   /api/v1/admin/lessons/:lesson_id/videos  - Add video to lesson
```

#### 📝 Exercise Management
```
POST   /api/v1/admin/exercises                      - Create exercise
PUT    /api/v1/admin/exercises/:id                  - Update exercise
POST   /api/v1/admin/exercises/:id/publish          - Publish exercise
POST   /api/v1/admin/exercises/:id/unpublish        - Unpublish exercise
POST   /api/v1/admin/exercises/:id/sections         - Create section
GET    /api/v1/admin/exercises/:id/analytics        - Get analytics
POST   /api/v1/admin/exercises/:id/tags             - Add tag
DELETE /api/v1/admin/exercises/:id/tags/:tag_id    - Remove tag
```

#### ❓ Question Management
```
POST   /api/v1/admin/questions                      - Create question
POST   /api/v1/admin/questions/:id/options          - Add option
POST   /api/v1/admin/questions/:id/answer           - Add answer
```

#### 🏷️ Tag Management
```
POST   /api/v1/admin/tags                           - Create tag
```

#### 📚 Question Bank
```
GET    /api/v1/admin/question-bank                  - List bank questions
POST   /api/v1/admin/question-bank                  - Add to bank
PUT    /api/v1/admin/question-bank/:id              - Update bank question
DELETE /api/v1/admin/question-bank/:id              - Delete bank question
```

**Additional Endpoints for Instructor:** ~25 endpoints  
**Total Instructor Endpoints:** ~105 endpoints (80 student + 25 instructor)

---

## 👑 ROLE 3: ADMIN (Quản trị viên)

### Permissions
```sql
CHỈ 6 permissions (NO student permissions - strict role separation):

5. manage_courses      (courses, manage)     - Quản lý khóa học
6. manage_exercises    (exercises, manage)   - Quản lý bài tập
7. view_student_progress (progress, read)    - Xem tiến độ học viên
8. manage_users        (users, manage)       - Quản lý người dùng
9. manage_system       (system, manage)      - Quản lý hệ thống
10. view_analytics     (analytics, read)     - Xem thống kê toàn hệ thống

⚠️ QUAN TRỌNG: Admin KHÔNG có permissions 1-4 (student permissions)
   - KHÔNG thể view_courses như student
   - KHÔNG thể enroll_course
   - KHÔNG thể submit_exercise
   - KHÔNG thể view_own_progress
   
✅ Admin có thể manage courses/exercises nhưng KHÔNG thể làm bài như student
✅ Phân tách rõ ràng: Admin quản lý, Student học tập
```

### Có thể làm gì?

#### ✅ Quyền Instructor (Course/Exercise Management)
- Tất cả quyền của Instructor (tạo, sửa courses & exercises)
- Xem progress của students

#### ❌ KHÔNG có quyền Student
- ❌ **KHÔNG thể enroll courses**
- ❌ **KHÔNG thể làm bài exercises**
- ❌ **KHÔNG thể submit answers**
- ❌ **KHÔNG thể track video progress**
- ❌ **KHÔNG thể review courses**
- 💡 Để test: Tạo student account riêng

#### ✅ Quản lý Users (Admin Only)
- Xem danh sách tất cả users
- Xem chi tiết user profiles
- Tìm kiếm và filter users
- Xem user roles và permissions
- **Assign roles** cho users (student, instructor, admin)
- **Revoke roles** từ users
- **Activate/Deactivate** user accounts
- **Lock/Unlock** accounts
- Xem login history
- Xem failed login attempts
- Reset passwords cho users
- Xem và quản lý refresh tokens

#### ✅ Xóa Content (Admin Only)
- **DELETE courses** (instructor không được)
- **DELETE exercises** (mọi exercise)
- **DELETE users** (soft delete)
- Remove course enrollments
- Remove reviews (nếu vi phạm)

#### ✅ System Management
- Xem system health
- Xem database status
- Xem service status
- Monitor system resources
- Xem error logs
- Manage system settings
- Configure system parameters

#### ✅ Analytics & Reports (Admin Only)
- **Xem analytics toàn hệ thống**
- Total users, courses, exercises
- Enrollment statistics
- Completion rates
- User engagement metrics
- Revenue reports (nếu có payment)
- Top courses analytics
- Top students leaderboard
- Instructor performance
- Exercise difficulty analytics
- System usage statistics

#### ✅ Notification Management (Admin Only)
- **Gửi bulk notifications** cho tất cả users
- Gửi targeted notifications (theo role, course, etc.)
- Tạo scheduled notifications
- Xem notification delivery stats
- Manage notification templates

#### ✅ Content Review & Moderation
- Review và approve courses
- Review và approve exercises
- Moderate reviews
- Moderate comments
- Handle reports

### API Endpoints (Admin Only)

#### 👥 User Management (Admin Only)
```
GET    /api/v1/admin/users                         - List all users
GET    /api/v1/admin/users/:id                     - Get user detail
PUT    /api/v1/admin/users/:id                     - Update user
DELETE /api/v1/admin/users/:id                     - Delete user (soft)
POST   /api/v1/admin/users/:id/assign-role         - Assign role
POST   /api/v1/admin/users/:id/revoke-role         - Revoke role
POST   /api/v1/admin/users/:id/activate            - Activate account
POST   /api/v1/admin/users/:id/deactivate          - Deactivate account
POST   /api/v1/admin/users/:id/lock                - Lock account
POST   /api/v1/admin/users/:id/unlock              - Unlock account
GET    /api/v1/admin/users/:id/roles               - Get user roles
GET    /api/v1/admin/users/:id/login-history       - Login history
POST   /api/v1/admin/users/:id/reset-password      - Reset password
```

#### 🗑️ Content Deletion (Admin Only)
```
DELETE /api/v1/admin/courses/:id                   - Delete course
DELETE /api/v1/admin/exercises/:id                 - Delete any exercise
```

#### 📊 Analytics & Reports (Admin Only)
```
GET    /api/v1/admin/analytics/overview            - System overview
GET    /api/v1/admin/analytics/users               - User analytics
GET    /api/v1/admin/analytics/courses             - Course analytics
GET    /api/v1/admin/analytics/exercises           - Exercise analytics
GET    /api/v1/admin/analytics/enrollments         - Enrollment stats
GET    /api/v1/admin/analytics/completions         - Completion rates
GET    /api/v1/admin/analytics/engagement          - Engagement metrics
GET    /api/v1/admin/analytics/top-courses         - Top courses
GET    /api/v1/admin/analytics/top-students        - Top students
GET    /api/v1/admin/analytics/instructors         - Instructor performance
```

#### 📢 Notification Management (Admin Only)
```
POST   /api/v1/admin/notifications                 - Create notification
POST   /api/v1/admin/notifications/bulk            - Bulk send
POST   /api/v1/admin/notifications/scheduled       - Schedule notification
GET    /api/v1/admin/notifications/stats           - Delivery stats
GET    /api/v1/admin/notifications/templates       - Notification templates
```

#### ⚙️ System Management (Admin Only)
```
GET    /api/v1/admin/system/health                 - System health
GET    /api/v1/admin/system/status                 - Service status
GET    /api/v1/admin/system/logs                   - Error logs
GET    /api/v1/admin/system/settings               - System settings
PUT    /api/v1/admin/system/settings               - Update settings
```

**Additional Endpoints for Admin:** ~35+ endpoints  
**Total Admin Endpoints:** ~140+ endpoints (105 instructor + 35+ admin)

---

## 🔐 AUTHORIZATION FLOW

### Middleware Stack
```go
// Route protection example from code
admin := api.Group("/admin")
admin.Use(authMiddleware.AuthRequired())              // Step 1: Check JWT
admin.Use(authMiddleware.RequireRole("instructor", "admin"))  // Step 2: Check role

// Admin-only routes
admin.DELETE("/courses/:id", authMiddleware.RequireRole("admin"), handler.DeleteCourse)
```

### JWT Token Structure
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "student|instructor|admin",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Role Check Logic
```go
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.Get("role").(string)
        
        for _, r := range allowedRoles {
            if userRole == r {
                c.Next()
                return
            }
        }
        
        c.JSON(403, gin.H{"error": "Insufficient permissions"})
        c.Abort()
    }
}
```

---

## 📊 COMPARISON TABLE

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| **View Courses** | ✅ | ✅ | ✅ |
| **Enroll Courses** | ✅ | ✅ | ✅ |
| **View Exercises** | ✅ | ✅ | ✅ |
| **Submit Exercises** | ✅ | ✅ | ✅ |
| **View Own Progress** | ✅ | ✅ | ✅ |
| **Create Courses** | ❌ | ✅ | ✅ |
| **Edit Courses** | ❌ | ✅ (own) | ✅ (all) |
| **Delete Courses** | ❌ | ❌ | ✅ |
| **Create Exercises** | ❌ | ✅ | ✅ |
| **Edit Exercises** | ❌ | ✅ (own) | ✅ (all) |
| **Delete Exercises** | ❌ | ✅ (own) | ✅ (all) |
| **View Student Progress** | ❌ | ✅ | ✅ |
| **View Analytics** | ❌ | ✅ (own content) | ✅ (all) |
| **Manage Users** | ❌ | ❌ | ✅ |
| **Assign Roles** | ❌ | ❌ | ✅ |
| **System Settings** | ❌ | ❌ | ✅ |
| **Bulk Notifications** | ❌ | ❌ | ✅ |
| **System Analytics** | ❌ | ❌ | ✅ |

---

## 🎯 USE CASES BY ROLE

### 👨‍🎓 Student Use Cases
1. **Học IELTS**: Browse courses → Enroll → Learn lessons → Submit exercises
2. **Theo dõi tiến độ**: View progress → Set goals → Track achievements
3. **Cài đặt**: Update profile → Set preferences → Manage reminders
4. **So sánh**: View leaderboard → See ranking

### 👨‍🏫 Instructor Use Cases
1. **Tạo nội dung**: Create course → Add modules → Add lessons → Upload videos
2. **Quản lý exercises**: Create exercise → Add questions → Set answers → Publish
3. **Theo dõi học viên**: View enrolled students → Check progress → View submissions
4. **Phân tích**: View course analytics → Check exercise difficulty → Improve content
5. **Quản lý tags**: Create tags → Organize content

### 👑 Admin Use Cases
1. **Quản lý users**: View all users → Assign roles → Lock/unlock accounts
2. **Quản trị nội dung**: Review courses → Approve content → Delete inappropriate
3. **Theo dõi hệ thống**: View system health → Monitor services → Check logs
4. **Phân tích toàn diện**: System analytics → User engagement → Revenue reports
5. **Gửi thông báo**: Bulk notifications → Targeted messages → System announcements
6. **Cài đặt hệ thống**: Configure settings → Manage parameters

---

## 🚀 FRONTEND IMPLICATIONS

### Student UI Components Needed:
- Course catalog
- Lesson player (video, text, quiz)
- Exercise player (4 question types)
- Progress dashboard
- Profile & settings
- Leaderboard
- Notifications

### Instructor UI Components Needed:
**All Student UI, PLUS:**
- Course creator (WYSIWYG, drag-drop modules/lessons)
- Exercise builder (question bank, templates)
- Content manager (my courses, my exercises)
- Student progress viewer (table, filters, charts)
- Analytics dashboard (course stats, exercise stats)
- Tag manager

### Admin UI Components Needed:
**All Instructor UI, PLUS:**
- User management table (CRUD, role assignment)
- System dashboard (health, status, resources)
- Analytics suite (comprehensive reports, charts)
- Notification center (bulk send, templates, scheduler)
- Content moderation queue
- System settings panel
- Logs viewer

---

## 📋 NEXT STEPS

### For Frontend Development:

1. **Student Dashboard** (Week 1-2)
   - Use existing V0_PROMPTS_GUIDE.md (7 layers)
   - Focus on learning experience

2. **Instructor Dashboard** (Week 3-4)
   - Content creator tools
   - Student progress tracking
   - Analytics views

3. **Admin Dashboard** (Week 5-6)
   - User management
   - System monitoring
   - Comprehensive analytics
   - System settings

**See**: V0_PROMPTS_ADMIN.md and V0_PROMPTS_INSTRUCTOR.md (will be created next)

---

**Document prepared:** 2025-10-15  
**Based on:** Database schemas, API routes, middleware analysis  
**Backend version:** Latest (all services operational)
