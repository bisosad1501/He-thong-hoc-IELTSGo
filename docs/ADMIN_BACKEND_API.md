# Admin Backend Endpoints - Complete Reference

This document provides a comprehensive overview of all admin-related endpoints across all microservices in the IELTS platform.

## Table of Contents
- [Auth Service](#auth-service)
- [User Service](#user-service)
- [Course Service](#course-service)
- [Exercise Service](#exercise-service)
- [Notification Service](#notification-service)
- [Storage Service](#storage-service)

---

## Auth Service
**Base URL:** `/api/v1/auth`

### Admin User Management

#### 1. Get All Users (Paginated)
```
GET /admin/users
```
**Permission:** Admin only  
**Query Parameters:**
- `page` (int) - Page number (default: 1)
- `limit` (int) - Items per page (default: 20)
- `search` (string) - Search by email or name
- `role` (string) - Filter by role (admin, instructor, student)
- `status` (string) - Filter by status (active, inactive)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "role": "student",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

#### 2. Get User by ID
```
GET /admin/users/:id
```
**Permission:** Admin only  
**Path Parameters:**
- `id` (uuid) - User ID

**Response:** Returns complete user details including profile information

#### 3. Create User
```
POST /admin/users
```
**Permission:** Admin only  
**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123",
  "role": "student",
  "fullName": "John Doe"
}
```

#### 4. Update User
```
PUT /admin/users/:id
```
**Permission:** Admin only  
**Request Body:** Partial user update (email, fullName, etc.)

#### 5. Delete User
```
DELETE /admin/users/:id
```
**Permission:** Admin only  
**Note:** Soft delete (sets deleted_at timestamp)

#### 6. Update User Status
```
PUT /admin/users/:id/status
```
**Permission:** Admin only  
**Request Body:**
```json
{
  "status": "active" // or "inactive"
}
```

#### 7. Update User Role
```
PUT /admin/users/:id/roles
```
**Permission:** Admin only  
**Request Body:**
```json
{
  "role": "instructor" // admin, instructor, student
}
```

---

## User Service
**Base URL:** `/api/v1/user`

### Admin Statistics & Analytics

#### 1. Dashboard Statistics
```
GET /admin/stats/dashboard
```
**Permission:** Admin only  
**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 1500,
    "active_users": 1234,
    "total_courses": 25,
    "total_exercises": 150,
    "user_growth": 15.5,
    "revenue": 50000.00
  }
}
```

#### 2. User Growth Analytics
```
GET /admin/stats/user-growth
```
**Permission:** Admin only  
**Query Parameters:**
- `period` (string) - "week", "month", "year" (default: "month")
- `start_date` (date) - YYYY-MM-DD
- `end_date` (date) - YYYY-MM-DD

**Response:** Time-series data of user registration and activity

#### 3. Enrollment Statistics
```
GET /admin/stats/enrollments
```
**Permission:** Admin only  
**Response:** Course enrollment trends and statistics

#### 4. Activity Statistics
```
GET /admin/stats/activities
```
**Permission:** Admin only  
**Query Parameters:**
- `days` (int) - Number of days to analyze (default: 30)

**Response:** Platform activity metrics (logins, submissions, etc.)

---

## Course Service
**Base URL:** `/api/v1/courses`

### Admin & Instructor Course Management
**Note:** Most course endpoints are available to both admin and instructor roles

#### 1. Get All Courses (Admin View)
```
GET /admin/courses
```
**Permission:** Admin, Instructor  
**Query Parameters:**
- `page`, `limit`, `search`, `status`, `instructor_id`

**Response:** Complete course list with all details

#### 2. Create Course
```
POST /admin/courses
```
**Permission:** Admin, Instructor  
**Request Body:**
```json
{
  "title": "IELTS Academic Preparation",
  "description": "Complete IELTS preparation course",
  "category": "academic",
  "level": "intermediate",
  "price": 199.99,
  "thumbnail_url": "https://...",
  "instructor_id": "uuid"
}
```

#### 3. Update Course
```
PUT /admin/courses/:id
```
**Permission:** Admin, Instructor (own courses)  
**Request Body:** Partial course update

#### 4. Delete Course
```
DELETE /admin/courses/:id
```
**Permission:** Admin, Instructor (own courses)  
**Note:** Soft delete

#### 5. Publish/Unpublish Course
```
PUT /admin/courses/:id/publish
```
**Request Body:**
```json
{
  "is_published": true
}
```

### Module Management

#### 6. Get Course Modules
```
GET /admin/courses/:course_id/modules
```
**Permission:** Admin, Instructor

#### 7. Create Module
```
POST /admin/modules
```
**Permission:** Admin, Instructor  
**Request Body:**
```json
{
  "course_id": "uuid",
  "title": "Introduction to IELTS",
  "description": "Getting started",
  "order_index": 1
}
```

#### 8. Update Module
```
PUT /admin/modules/:id
```

#### 9. Delete Module
```
DELETE /admin/modules/:id
```

#### 10. Reorder Modules
```
PUT /admin/modules/reorder
```
**Request Body:**
```json
{
  "module_order": [
    { "id": "uuid1", "order_index": 1 },
    { "id": "uuid2", "order_index": 2 }
  ]
}
```

### Lesson Management

#### 11. Create Lesson
```
POST /admin/lessons
```
**Request Body:**
```json
{
  "module_id": "uuid",
  "title": "Understanding Band Scores",
  "content_type": "video",
  "content": "video_url or text content",
  "duration": 600,
  "order_index": 1
}
```
**Content Types:** "video", "text", "audio"

#### 12. Update Lesson
```
PUT /admin/lessons/:id
```

#### 13. Delete Lesson
```
DELETE /admin/lessons/:id
```

#### 14. Reorder Lessons
```
PUT /admin/lessons/reorder
```

---

## Exercise Service
**Base URL:** `/api/v1/exercises`

### Admin Exercise Management

#### 1. Get All Exercises
```
GET /admin/exercises
```
**Permission:** Admin, Instructor  
**Query Parameters:**
- `page`, `limit`, `search`
- `skill_type` - "listening", "reading", "writing", "speaking"
- `difficulty` - "easy", "medium", "hard"
- `status` - "draft", "published"

#### 2. Create Exercise
```
POST /admin/exercises
```
**Permission:** Admin, Instructor  
**Request Body:**
```json
{
  "title": "IELTS Listening Practice Test 1",
  "skill_type": "listening",
  "difficulty": "medium",
  "duration": 1800,
  "course_id": "uuid",
  "module_id": "uuid",
  "description": "Full listening test",
  "instructions": "Listen carefully...",
  // Skill-specific fields:
  // For Listening:
  "listening_audio_url": "https://...",
  "listening_audio_duration": 1200,
  // For Reading:
  "ielts_test_type": "academic",
  // For Writing:
  "writing_task_type": "task1",
  "writing_prompt_text": "Describe the graph...",
  "writing_word_limit": 150,
  // For Speaking:
  "speaking_part_number": 1,
  "speaking_prompt_text": "Tell me about...",
  "speaking_preparation_time": 60,
  "speaking_response_time": 120
}
```

#### 3. Get Exercise by ID
```
GET /admin/exercises/:id
```
**Permission:** Admin, Instructor  
**Response:** Complete exercise details including all sections and questions

#### 4. Update Exercise
```
PUT /admin/exercises/:id
```
**Permission:** Admin, Instructor

#### 5. Delete Exercise
```
DELETE /admin/exercises/:id
```
**Permission:** Admin, Instructor  
**Note:** Currently sets is_published=false (should use soft delete with deleted_at)

### Section Management (Listening & Reading)

#### 6. Get Exercise Sections
```
GET /admin/exercises/:exercise_id/sections
```

#### 7. Create Section
```
POST /admin/exercises/:exercise_id/sections
```
**Request Body:**
```json
{
  // For Listening:
  "section_number": 1,
  "section_title": "Section 1 - Everyday Conversation",
  "section_audio_url": "https://...",
  "section_audio_duration": 300,
  "instructions": "Listen to the conversation...",
  
  // For Reading:
  "passage_title": "The History of Language",
  "passage_content": "Long text passage...",
  "word_count": 850
}
```

#### 8. Update Section
```
PUT /admin/exercises/:exercise_id/sections/:section_id
```

#### 9. Delete Section
```
DELETE /admin/exercises/:exercise_id/sections/:section_id
```

### Question Management

#### 10. Get Section Questions
```
GET /admin/exercises/:exercise_id/sections/:section_id/questions
```

#### 11. Create Question
```
POST /admin/exercises/:exercise_id/questions
```
**Request Body:**
```json
{
  "section_id": "uuid",
  "question_type": "multiple_choice", // or "fill_in_blank", "true_false", "matching"
  "question_text": "What is the main topic?",
  "question_number": 1,
  "options": ["Option A", "Option B", "Option C", "Option D"], // for multiple_choice
  "correct_answers": ["Option A"], // array for flexibility
  "explanation": "The answer is A because...",
  "points": 1
}
```

#### 12. Update Question
```
PUT /admin/exercises/:exercise_id/questions/:question_id
```

#### 13. Delete Question
```
DELETE /admin/exercises/:exercise_id/questions/:question_id
```

#### 14. Bulk Create Questions
```
POST /admin/exercises/:exercise_id/questions/bulk
```
**Request Body:**
```json
{
  "questions": [
    { /* question object */ },
    { /* question object */ }
  ]
}
```

---

## Notification Service
**Base URL:** `/api/v1/notifications`

### Admin Notification Management

#### 1. Create Notification
```
POST /admin/notifications
```
**Permission:** Admin only  
**Request Body:**
```json
{
  "user_id": "uuid", // Target user (null for system-wide)
  "title": "Important Update",
  "message": "The platform will undergo maintenance...",
  "type": "info", // "info", "success", "warning", "error"
  "category": "system", // "system", "course", "exercise", "achievement"
  "priority": "high", // "low", "medium", "high"
  "action_url": "/courses/123",
  "scheduled_for": "2024-01-20T10:00:00Z" // Optional: schedule for future
}
```

#### 2. Bulk Send Notifications
```
POST /admin/notifications/bulk
```
**Permission:** Admin only  
**Request Body:**
```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"], // or null for all users
  "title": "New Feature Announcement",
  "message": "We've added a new feature...",
  "type": "info",
  "category": "system",
  "role_filter": "student", // Optional: "admin", "instructor", "student"
  "send_email": true, // Also send email notification
  "send_push": false // Also send push notification
}
```

#### 3. Get All Notifications (Admin View)
```
GET /admin/notifications
```
**Permission:** Admin only  
**Query Parameters:**
- `user_id`, `type`, `category`, `is_sent`, `page`, `limit`

**Response:** All notifications with delivery status

#### 4. Update Notification
```
PUT /admin/notifications/:id
```
**Permission:** Admin only  
**Note:** Can only update unsent scheduled notifications

#### 5. Cancel Scheduled Notification
```
DELETE /admin/notifications/:id
```
**Permission:** Admin only

### Student Notification Endpoints
*(Available to all authenticated users)*

#### 6. Get User Notifications
```
GET /notifications
```
**Query Parameters:** `is_read`, `type`, `category`, `page`, `limit`

#### 7. Get Unread Count
```
GET /notifications/unread-count
```
**Response:**
```json
{
  "unread_count": 5
}
```

#### 8. Mark as Read
```
PUT /notifications/:id/read
```

#### 9. Mark All as Read
```
PUT /notifications/mark-all-read
```

#### 10. Delete Notification
```
DELETE /notifications/:id
```

#### 11. SSE Real-time Stream
```
GET /notifications/stream
```
**Response:** Server-Sent Events stream for real-time notifications

#### 12. Get/Update Preferences
```
GET /notifications/preferences
PUT /notifications/preferences
```
**Preferences:**
```json
{
  "email_enabled": true,
  "push_enabled": true,
  "categories": {
    "course": true,
    "exercise": true,
    "achievement": true,
    "system": true
  }
}
```

#### 13. Register Push Device
```
POST /notifications/devices
```
**Request Body:**
```json
{
  "device_token": "fcm_token_here",
  "device_type": "ios", // or "android", "web"
  "device_name": "iPhone 14"
}
```

---

## Storage Service
**Base URL:** `/api/v1/storage`

### File Upload & Management
**Note:** Storage service doesn't have specific admin-only endpoints, but file management is typically restricted by role

#### 1. Upload File
```
POST /upload
```
**Permission:** Authenticated users (role-based access)  
**Request:** Multipart form data
- `file` - File to upload
- `type` - "avatar", "audio", "video", "document", "thumbnail"

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://minio.../files/uuid_filename.ext",
    "filename": "original_filename.ext",
    "size": 1024000,
    "content_type": "audio/mpeg"
  }
}
```

#### 2. Generate Presigned URL
```
POST /presigned-url
```
**Request Body:**
```json
{
  "filename": "my-audio.mp3",
  "content_type": "audio/mpeg",
  "type": "audio"
}
```
**Response:** Presigned URL for direct upload to MinIO

#### 3. Delete File
```
DELETE /files/:filename
```
**Permission:** Admin, file owner

---

## Permission Summary

| Endpoint Category | Admin | Instructor | Student |
|------------------|-------|------------|---------|
| Auth - User Management | ✅ | ❌ | ❌ |
| User - Statistics | ✅ | ❌ | ❌ |
| Course - CRUD | ✅ | ✅* | ❌ |
| Module - CRUD | ✅ | ✅* | ❌ |
| Lesson - CRUD | ✅ | ✅* | ❌ |
| Exercise - CRUD | ✅ | ✅* | ❌ |
| Notification - Admin | ✅ | ❌ | ❌ |
| Notification - User | ✅ | ✅ | ✅ |
| Storage - Upload | ✅ | ✅ | ✅** |

*Instructors can only manage their own content  
**Students have limited upload capabilities (avatar, submissions)

---

## Error Response Format

All services use consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error context"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Invalid request data
- `INTERNAL_ERROR` - Server error

---

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <access_token>
```

The API Gateway validates tokens and adds user context to requests via headers:
- `X-User-ID`: User UUID
- `X-User-Role`: User role (admin, instructor, student)

---

## Rate Limiting

Admin endpoints have higher rate limits:
- Admin: 1000 requests/minute
- Instructor: 500 requests/minute
- Student: 200 requests/minute

---

## Notes for Frontend Development

1. **Notification System:**
   - Use SSE (`/notifications/stream`) for real-time updates
   - Poll `/notifications/unread-count` every 30s as fallback
   - Cache recent notifications locally

2. **Exercise Management:**
   - Exercise creation requires course_id and module_id
   - Sections are required for Listening/Reading exercises
   - Questions can be created individually or in bulk

3. **File Uploads:**
   - Audio files should use presigned URLs for large files
   - Thumbnails and avatars can use direct upload
   - Always validate file size/type on client before upload

4. **Permission Checks:**
   - Always check user role before showing admin UI
   - Instructors should only see their own content in management views
   - Use role badges to indicate admin/instructor status

---

**Last Updated:** January 2024  
**API Version:** v1
