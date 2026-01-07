# 🎓 HỆ THỐNG HỌC IELTS ĐA NỀN TẢNG
## Multi-Platform IELTS Learning System

---

## 📋 MỤC LỤC

1. [Giới thiệu dự án](#giới-thiệu-dự-án)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Chi tiết các thành phần](#chi-tiết-các-thành-phần)
4. [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
5. [Luồng hoạt động](#luồng-hoạt-động)
6. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
7. [Hướng dẫn cài đặt](#hướng-dẫn-cài-đặt)
8. [Tài liệu kỹ thuật](#tài-liệu-kỹ-thuật)

---

## 📖 GIỚI THIỆU DỰ ÁN

### Mục tiêu dự án
Xây dựng một hệ thống học IELTS toàn diện, hỗ trợ đa nền tảng (Web, Mobile), tích hợp trí tuệ nhân tạo (AI) để đánh giá và chấm điểm tự động các kỹ năng Writing và Speaking.

### Đối tượng sử dụng
- **Học viên (Students)**: Người học IELTS, theo dõi tiến độ, làm bài tập, xem bài giảng
- **Giảng viên (Instructors)**: Tạo và quản lý khóa học, bài giảng, bài tập
- **Quản trị viên (Admins)**: Quản lý toàn bộ hệ thống, người dùng, và dữ liệu

### Tính năng chính
1. **Quản lý khóa học**: Tổ chức khóa học theo modules và lessons, hỗ trợ video bài giảng
2. **Hệ thống bài tập**: Bài tập Listening, Reading với tự động chấm điểm
3. **AI Đánh giá Writing**: Phân tích và chấm điểm bài viết theo 4 tiêu chí IELTS (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)
4. **AI Đánh giá Speaking**: Chuyển đổi giọng nói thành văn bản (Speech-to-Text), đánh giá phát âm, ngữ pháp, từ vựng
5. **Theo dõi tiến độ**: Dashboard cá nhân, thống kê học tập, thành tựu
6. **Thông báo đa kênh**: Push notification (Mobile), Email, In-app notification
7. **Lưu trữ file**: Quản lý audio, video, documents qua MinIO (S3-compatible storage)

### Điểm đặc biệt
- **Kiến trúc Microservices**: Hệ thống được chia thành các services độc lập, dễ bảo trì và mở rộng
- **Database per Service**: Mỗi service có database riêng, đảm bảo tính độc lập
- **Containerized**: Toàn bộ hệ thống chạy trên Docker, dễ dàng triển khai
- **Real-time Processing**: Sử dụng RabbitMQ cho xử lý bất đồng bộ (AI evaluation, notifications)
- **Caching**: Redis cache để tối ưu hiệu năng

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                                                                   │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │   Web App       │              │   Mobile App    │           │
│  │  (Next.js 14)   │              │   (React Native)│           │
│  │  Port: 3000     │              │   (Future)      │           │
│  └─────────────────┘              └─────────────────┘           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         API GATEWAY                              │
│                      (Go - Port: 8080)                           │
│  • Request Routing                                               │
│  • Authentication Middleware                                     │
│  • Rate Limiting                                                 │
│  • Load Balancing                                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼──────────┐  ┌────────▼─────────┐  ┌─────────▼────────┐
│  AUTH SERVICE    │  │   USER SERVICE   │  │  COURSE SERVICE  │
│   Port: 8081     │  │    Port: 8082    │  │   Port: 8083     │
│                  │  │                  │  │                  │
│ • Register       │  │ • Profile        │  │ • Courses        │
│ • Login          │  │ • Progress       │  │ • Modules        │
│ • JWT Tokens     │  │ • Achievements   │  │ • Lessons        │
│ • Permissions    │  │ • Statistics     │  │ • Enrollments    │
│                  │  │                  │  │                  │
│ DB: auth_db      │  │ DB: user_db      │  │ DB: course_db    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                       │                       │
┌───────▼──────────┐  ┌────────▼─────────┐  ┌─────────▼────────┐
│ EXERCISE SERVICE │  │   AI SERVICE     │  │ NOTIFICATION SRV │
│   Port: 8084     │  │    Port: 8085    │  │   Port: 8086     │
│                  │  │                  │  │                  │
│ • Exercises      │  │ • Writing Eval   │  │ • Push Notify    │
│ • Questions      │  │ • Speaking Eval  │  │ • Email          │
│ • Submissions    │  │ • Pronunciation  │  │ • In-app         │
│ • Grading        │  │ • AI Feedback    │  │ • Reminders      │
│                  │  │                  │  │                  │
│ DB: exercise_db  │  │ DB: ai_db        │  │ DB: notify_db    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │    Redis     │  │  RabbitMQ    │          │
│  │  (Database)  │  │   (Cache)    │  │ (Queue)      │          │
│  │  Port: 5432  │  │  Port: 6379  │  │ Port: 5672   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │    MinIO     │  │   PgAdmin    │                             │
│  │  (Storage)   │  │   (DB GUI)   │                             │
│  │  Port: 9000  │  │  Port: 5050  │                             │
│  └──────────────┘  └──────────────┘                             │
└───────────────────────────────────────────────────────────────────┘
```

### Nguyên lý hoạt động

1. **Client Layer**: Người dùng tương tác qua Web App (Next.js) hoặc Mobile App
2. **API Gateway**: Điểm vào duy nhất, xác thực request, định tuyến đến service phù hợp
3. **Microservices**: Xử lý business logic độc lập, giao tiếp qua REST API
4. **Infrastructure**: Cơ sở hạ tầng chia sẻ (database, cache, queue, storage)

---

## 🔧 CHI TIẾT CÁC THÀNH PHẦN

### 1. API Gateway (Port: 8080)

**Vai trò**: Cổng vào trung tâm, điều phối request đến các microservices

**Chức năng**:
- **Request Routing**: Định tuyến request dựa trên URL pattern
  - `/auth/*` → Auth Service
  - `/users/*` → User Service  
  - `/courses/*` → Course Service
  - `/exercises/*` → Exercise Service
  - `/ai/*` → AI Service
  - `/notifications/*` → Notification Service
  
- **Authentication Middleware**: Xác thực JWT token, kiểm tra quyền truy cập
- **Rate Limiting**: Giới hạn số request để chống abuse
- **Load Balancing**: Phân tải request khi scale services
- **CORS Handling**: Xử lý Cross-Origin Resource Sharing
- **Logging & Monitoring**: Ghi log tất cả request/response

**Công nghệ**: Go (Golang), Gin Framework

---

### 2. Auth Service (Port: 8081)

**Vai trò**: Quản lý xác thực và phân quyền

**Chức năng**:
- **Đăng ký tài khoản**: 
  - Validate email, username, password
  - Hash password bằng bcrypt
  - Tạo user record trong `auth_db`
  - Gửi email xác thực (via Notification Service)

- **Đăng nhập**:
  - Xác thực credentials
  - Generate JWT Access Token (expires: 24h)
  - Generate Refresh Token (expires: 7 days)
  - Lưu session vào Redis

- **Refresh Token**: Gia hạn Access Token mà không cần đăng nhập lại

- **Phân quyền (RBAC)**:
  - **Roles**: Student, Instructor, Admin
  - **Permissions**: Read, Write, Delete trên từng resource
  - **Role Assignment**: Admin có thể gán role cho users

- **OAuth Integration**: Hỗ trợ Google OAuth 2.0 login

**Database**: `auth_db` (9 tables)
- `users`: Thông tin đăng nhập
- `roles`: Định nghĩa vai trò
- `permissions`: Quyền hạn chi tiết
- `user_roles`: Mapping user-role
- `refresh_tokens`: Lưu refresh tokens
- `oauth_providers`: Google OAuth data

---

### 3. User Service (Port: 8082)

**Vai trò**: Quản lý thông tin cá nhân và tiến độ học tập

**Chức năng**:
- **Profile Management**:
  - Cập nhật avatar, bio, contact info
  - Thiết lập mục tiêu học tập (target IELTS score)
  - Cài đặt nhắc nhở học tập

- **Learning Progress Tracking**:
  - Theo dõi số giờ học, số bài đã hoàn thành
  - Tính điểm trung bình các bài test
  - Lưu lịch sử xem video, làm bài tập
  - Gợi ý bài học tiếp theo dựa trên progress

- **Dashboard Analytics**:
  - Biểu đồ tiến độ theo thời gian
  - Phân tích điểm mạnh/yếu theo từng skill
  - So sánh với mục tiêu đề ra
  - Thống kê study streak (số ngày học liên tục)

- **Achievements & Badges**:
  - Hệ thống huy hiệu (đạt milestone, hoàn thành khóa học)
  - Leaderboard (xếp hạng người học)
  - Reward points

**Database**: `user_db` (10 tables)
- `user_profiles`: Thông tin cá nhân
- `learning_progress`: Tiến độ học tập
- `study_goals`: Mục tiêu học tập
- `achievements`: Thành tựu
- `user_statistics`: Thống kê chi tiết

---

### 4. Course Service (Port: 8083)

**Vai trò**: Quản lý nội dung khóa học

**Chức năng**:
- **Course Management**:
  - CRUD courses (Create, Read, Update, Delete)
  - Phân loại theo skill: Listening, Reading, Writing, Speaking
  - Thiết lập difficulty level (Beginner, Intermediate, Advanced)
  - Course thumbnail, description, objectives

- **Module & Lesson Structure**:
  - Mỗi course có nhiều modules
  - Mỗi module có nhiều lessons
  - Lesson types: Video, Reading Material, Practice Exercise
  - Ordering (thứ tự học tập)

- **Video Lectures**:
  - Upload video lên MinIO storage
  - Lưu video URL, duration, thumbnail
  - Video streaming support
  - Theo dõi video watch progress

- **Enrollment**:
  - Học viên đăng ký khóa học
  - Kiểm tra prerequisites (khóa học yêu cầu trước)
  - Tracking enrollment date, completion status

- **Learning Materials**:
  - PDF documents, slide presentations
  - Vocabulary lists, grammar notes
  - Downloadable resources

**Database**: `course_db` (12 tables)
- `courses`: Thông tin khóa học
- `modules`: Phân chia modules
- `lessons`: Chi tiết bài học
- `lesson_videos`: Video metadata
- `course_enrollments`: Đăng ký khóa học
- `course_materials`: Tài liệu học tập

---

### 5. Exercise Service (Port: 8084)

**Vai trò**: Quản lý bài tập và chấm điểm tự động

**Chức năng**:
- **Exercise Management**:
  - Tạo bài tập Listening & Reading
  - Phân loại theo IELTS format (Multiple Choice, True/False/Not Given, Matching, Fill in the Blanks, etc.)
  - Thiết lập time limit, difficulty, points

- **Question Bank**:
  - Lưu trữ câu hỏi theo dạng
  - Support passage/audio cho Reading/Listening
  - Đáp án đúng và giải thích chi tiết

- **Exercise Attempts**:
  - Học viên bắt đầu làm bài (tạo attempt)
  - Lưu trạng thái làm bài (in_progress, completed)
  - Timer countdown
  - Auto-submit khi hết giờ

- **Auto-Grading**:
  - Chấm điểm tự động cho Multiple Choice, True/False
  - Tính band score theo chuẩn IELTS
  - Hiển thị đáp án đúng/sai
  - Statistics (accuracy rate, time spent)

- **Submission History**:
  - Lưu lịch sử các lần làm bài
  - So sánh điểm qua các lần
  - Review answers

**Database**: `exercise_db` (11 tables)
- `exercises`: Thông tin bài tập
- `exercise_questions`: Câu hỏi
- `question_options`: Đáp án các câu hỏi
- `exercise_attempts`: Lần làm bài
- `attempt_answers`: Câu trả lời của học viên
- `audio_files`: File audio cho Listening

---

### 6. AI Service (Port: 8085)

**Vai trò**: Đánh giá Writing & Speaking bằng AI

**Chức năng**:

#### A. Writing Evaluation
- **Submission Process**:
  - Học viên nộp bài Writing (Task 1 hoặc Task 2)
  - Extract text content, word count
  - Queue vào RabbitMQ để xử lý bất đồng bộ

- **AI Analysis** (Sử dụng OpenAI GPT-4):
  - **Task Achievement (TA)**: Có trả lời đúng yêu cầu đề bài không?
  - **Coherence & Cohesion (CC)**: Ý tưởng có mạch lạc, liên kết tốt không?
  - **Lexical Resource (LR)**: Từ vựng đa dạng, chính xác
  - **Grammatical Range & Accuracy (GRA)**: Ngữ pháp phong phú, ít lỗi

- **Scoring**: Mỗi tiêu chí cho điểm 0-9, tính trung bình ra band score

- **Feedback Generation**:
  - Nhận xét chi tiết từng tiêu chí
  - Highlight lỗi cụ thể (grammar, vocabulary mistakes)
  - Gợi ý cải thiện
  - Sample sentences

#### B. Speaking Evaluation
- **Audio Upload**:
  - Học viên ghi âm và upload file (MP3, WAV)
  - Lưu vào MinIO storage

- **Speech-to-Text**:
  - Sử dụng OpenAI Whisper hoặc Google Speech-to-Text
  - Transcribe audio thành text
  - Detect ngôn ngữ, giọng

- **Pronunciation Analysis**:
  - Đánh giá độ chính xác phát âm
  - Phát hiện lỗi phát âm phổ biến
  - Word stress, intonation analysis

- **Fluency & Coherence**:
  - Tốc độ nói (words per minute)
  - Số lần dừng, từ lấp (um, uh)
  - Mạch lạc ý tưởng

- **Grammar & Vocabulary Assessment**:
  - Phân tích text đã transcribe
  - Tìm lỗi ngữ pháp
  - Đánh giá vocabulary range

- **Scoring & Feedback**:
  - Band score 0-9
  - Chi tiết từng tiêu chí
  - Audio replay với highlight lỗi

**Database**: `ai_db` (10 tables)
- `writing_submissions`: Bài viết nộp
- `writing_evaluations`: Kết quả chấm Writing
- `speaking_submissions`: File audio Speaking
- `speaking_evaluations`: Kết quả chấm Speaking
- `ai_processing_queue`: Queue jobs
- `evaluation_feedback`: Feedback chi tiết

**External APIs**:
- OpenAI GPT-4 (Writing evaluation)
- OpenAI Whisper (Speech-to-Text)
- Google Cloud Speech-to-Text (alternative)

---

### 7. Notification Service (Port: 8086)

**Vai trò**: Gửi thông báo đa kênh

**Chức năng**:
- **Push Notifications** (Mobile):
  - Sử dụng Firebase Cloud Messaging (FCM)
  - Gửi khi có assignment mới, deadline sắp tới
  - Badge, sound, vibration

- **Email Notifications**:
  - SMTP integration (Gmail, SendGrid)
  - Email templates (welcome email, password reset, course completion)
  - HTML formatting

- **In-App Notifications**:
  - Thông báo trong web app
  - Dropdown notification bell
  - Mark as read/unread

- **Study Reminders**:
  - Scheduled notifications (hàng ngày, hàng tuần)
  - Nhắc nhở học bài, làm bài tập
  - Customizable schedule

- **Event-driven**:
  - Listen vào RabbitMQ queues
  - Trigger notification khi có event (course enrollment, exercise submission, etc.)

**Database**: `notification_db` (8 tables)
- `notifications`: Danh sách thông báo
- `notification_templates`: Mẫu thông báo
- `device_tokens`: FCM tokens cho mobile
- `email_queue`: Queue email cần gửi
- `notification_preferences`: Cài đặt người dùng

---

### 8. Storage Service (MinIO)

**Vai trò**: Lưu trữ file (S3-compatible)

**Chức năng**:
- Upload/Download files
- Buckets: `videos`, `audios`, `documents`, `images`
- Pre-signed URLs (URL có thời hạn)
- Access control

---

## 💾 CƠ SỞ DỮ LIỆU

### Database Architecture

**Database per Service Pattern**: Mỗi service có database riêng để đảm bảo:
- **Loose Coupling**: Services không phụ thuộc lẫn nhau
- **Independent Scaling**: Scale từng database riêng biệt
- **Technology Diversity**: Có thể dùng DB khác nhau cho từng service
- **Fault Isolation**: Lỗi ở một DB không ảnh hưởng services khác

### Danh sách Databases

| Service | Database | Số Tables | Mô tả |
|---------|----------|-----------|-------|
| **Auth Service** | `auth_db` | 9 | Quản lý authentication, roles, permissions, JWT tokens |
| **User Service** | `user_db` | 10 | User profiles, learning progress, achievements, statistics |
| **Course Service** | `course_db` | 12 | Courses, modules, lessons, videos, enrollments |
| **Exercise Service** | `exercise_db` | 11 | Exercises, questions, answers, submissions, auto-grading |
| **AI Service** | `ai_db` | 10 | Writing/Speaking evaluations, AI processing, feedback |
| **Notification Service** | `notification_db` | 8 | Notifications, email queue, device tokens, preferences |

**Tổng cộng**: 60 tables trên 6 databases

### Schema Chi tiết

#### Auth Service (`auth_db`)
```sql
- users                    # Tài khoản người dùng
- roles                    # Vai trò (Student, Instructor, Admin)
- permissions              # Quyền hạn chi tiết
- user_roles               # Mapping user-role (many-to-many)
- role_permissions         # Mapping role-permission
- refresh_tokens           # JWT refresh tokens
- password_reset_tokens    # Token reset password
- oauth_providers          # Google OAuth data
- login_history            # Lịch sử đăng nhập
```

#### User Service (`user_db`)
```sql
- user_profiles            # Thông tin cá nhân (avatar, bio, contact)
- learning_progress        # Tiến độ học tập chi tiết
- study_goals              # Mục tiêu IELTS target score
- user_achievements        # Huy hiệu, thành tựu
- user_statistics          # Thống kê số giờ học, bài đã làm
- study_streaks            # Chuỗi ngày học liên tục
- user_preferences         # Cài đặt cá nhân (timezone, language)
- learning_recommendations # Gợi ý bài học tiếp theo
- study_sessions           # Phiên học (start time, end time, duration)
- leaderboard              # Bảng xếp hạng
```

#### Course Service (`course_db`)
```sql
- courses                  # Khóa học (title, description, difficulty)
- course_modules           # Modules trong khóa học
- lessons                  # Bài học (video, reading, exercise)
- lesson_videos            # Metadata video (URL, duration)
- video_subtitles          # Phụ đề video
- course_materials         # Tài liệu (PDF, slides)
- course_enrollments       # Đăng ký khóa học
- lesson_progress          # Tiến độ xem bài (completed/in_progress)
- course_reviews           # Đánh giá khóa học (rating, comments)
- course_categories        # Phân loại khóa học
- prerequisites            # Khóa học yêu cầu trước
- course_instructors       # Giảng viên phụ trách
```

#### Exercise Service (`exercise_db`)
```sql
- exercises                # Bài tập (Listening/Reading)
- exercise_questions       # Câu hỏi trong bài tập
- question_types           # Loại câu hỏi (Multiple Choice, T/F/NG...)
- question_options         # Các đáp án cho câu hỏi
- reading_passages         # Đoạn văn cho Reading
- audio_files              # File audio cho Listening
- exercise_attempts        # Lần làm bài (start time, submit time)
- attempt_answers          # Câu trả lời của học viên
- attempt_results          # Kết quả (score, band score)
- answer_explanations      # Giải thích đáp án
- exercise_statistics      # Thống kê độ khó, tỷ lệ đúng của câu hỏi
```

#### AI Service (`ai_db`)
```sql
- writing_submissions      # Bài Writing nộp lên
- writing_evaluations      # Kết quả chấm Writing (TA, CC, LR, GRA)
- writing_feedback         # Feedback chi tiết
- speaking_submissions     # File audio Speaking
- speaking_evaluations     # Kết quả chấm Speaking
- speech_transcripts       # Text transcribed từ audio
- pronunciation_analysis   # Phân tích phát âm
- ai_processing_queue      # Queue jobs chờ xử lý
- ai_models_config         # Cấu hình AI models (GPT-4, Whisper)
- evaluation_criteria      # Tiêu chí chấm điểm
```

#### Notification Service (`notification_db`)
```sql
- notifications            # Thông báo (in-app, push, email)
- notification_types       # Loại thông báo
- notification_templates   # Template thông báo
- device_tokens            # FCM tokens cho push notification
- email_queue              # Queue email cần gửi
- email_logs               # Lịch sử gửi email
- notification_preferences # Cài đặt nhận thông báo
- scheduled_notifications  # Thông báo đặt lịch (reminders)
```

### Database Relationships

**Cross-Database References** (via `dblink` extension):
- `user_db.user_profiles.user_id` → `auth_db.users.id`
- `course_db.course_enrollments.user_id` → `auth_db.users.id`
- `exercise_db.exercise_attempts.user_id` → `auth_db.users.id`
- `ai_db.writing_submissions.user_id` → `auth_db.users.id`

**Tài liệu chi tiết**: [database/README.md](database/README.md), [docs/DATA_MODEL_RELATIONSHIPS.md](docs/DATA_MODEL_RELATIONSHIPS.md)

---

## 🔄 LUỒNG HOẠT ĐỘNG

### 1. Luồng Đăng ký & Đăng nhập

```
[User] → [Frontend: Register Form]
   ↓
[API Gateway: POST /auth/register]
   ↓
[Auth Service]
   ├─ Validate email, username, password
   ├─ Hash password (bcrypt)
   ├─ Insert vào auth_db.users
   ├─ Publish event "user.registered" → RabbitMQ
   └─ Return success
        ↓
[Notification Service] (consume event)
   └─ Send welcome email
        ↓
[User] → Login → [Auth Service]
   ├─ Validate credentials
   ├─ Generate JWT Access Token (24h)
   ├─ Generate Refresh Token (7 days)
   ├─ Store session in Redis
   └─ Return tokens
        ↓
[Frontend] Lưu tokens → LocalStorage/Cookie
```

### 2. Luồng Xem khóa học & Bài giảng

```
[User] → [Frontend: Browse Courses]
   ↓
[API Gateway: GET /courses] + JWT Token
   ↓
[Course Service]
   ├─ Verify JWT (via Auth Service)
   ├─ Query courses from course_db
   ├─ Check enrollment status
   └─ Return course list
        ↓
[User] → [Enroll Course] → POST /courses/:id/enroll
   ↓
[Course Service]
   ├─ Check prerequisites
   ├─ Insert into course_enrollments
   ├─ Publish event "course.enrolled" → RabbitMQ
   └─ Return success
        ↓
[User Service] (consume event)
   └─ Update learning_progress
        ↓
[User] → [Watch Video Lesson] → GET /courses/:id/lessons/:lessonId
   ↓
[Course Service]
   ├─ Get video URL from MinIO
   ├─ Return pre-signed URL (expires 1h)
   └─ Track lesson_progress
        ↓
[Frontend] Stream video từ MinIO
   ├─ Track watch progress (every 10s)
   └─ POST /courses/:id/lessons/:lessonId/progress
        ↓
[Course Service] Update lesson_progress
   └─ If completed → Publish "lesson.completed" event
```

### 3. Luồng Làm bài tập (Listening/Reading)

```
[User] → [Frontend: View Exercises]
   ↓
[API Gateway: GET /exercises?type=listening]
   ↓
[Exercise Service]
   ├─ Query exercises from exercise_db
   ├─ Return exercise list (without answers)
   └─ User chọn bài → GET /exercises/:id
        ↓
[User] → [Start Exercise] → POST /exercises/:id/start
   ↓
[Exercise Service]
   ├─ Create exercise_attempt (status: in_progress)
   ├─ Start timer
   └─ Return attempt_id, questions
        ↓
[User] Làm bài trên Frontend
   ├─ Select answers
   ├─ Auto-save draft (every 30s)
   └─ POST /exercises/attempts/:id/answers
        ↓
[User] → [Submit] → POST /exercises/attempts/:id/submit
   ↓
[Exercise Service]
   ├─ Update attempt status: completed
   ├─ Auto-grade (compare with correct answers)
   ├─ Calculate score, band score
   ├─ Insert into attempt_results
   ├─ Publish "exercise.completed" event
   └─ Return results (score, correct_answers, explanations)
        ↓
[User Service] (consume event)
   └─ Update user_statistics, learning_progress
```

### 4. Luồng Chấm bài Writing (AI)

```
[User] → [Frontend: Writing Exercise]
   ↓
[User] Type essay → [Submit] → POST /ai/writing/submit
   ↓
[API Gateway] → [AI Service]
   ├─ Validate submission (word count, essay length)
   ├─ Insert into writing_submissions
   ├─ Publish job → RabbitMQ: "ai.writing.evaluate"
   └─ Return submission_id (status: pending)
        ↓
[AI Worker] (background)
   ├─ Consume job from RabbitMQ
   ├─ Call OpenAI GPT-4 API
   │   Prompt: "Evaluate this IELTS Writing Task 2 essay..."
   │   Request: Task Achievement, Coherence, Lexical, Grammar scores
   ├─ Parse AI response
   ├─ Calculate band score (average of 4 criteria)
   ├─ Insert into writing_evaluations
   ├─ Generate detailed feedback
   ├─ Update submission status: completed
   └─ Publish "ai.writing.completed" event
        ↓
[Frontend] Polling hoặc WebSocket
   ↓
[User] → GET /ai/writing/submissions/:id
   ↓
[AI Service] Return evaluation results
   ├─ Band scores (TA, CC, LR, GRA)
   ├─ Overall band score
   ├─ Feedback chi tiết
   └─ Sample improvements
```

### 5. Luồng Chấm bài Speaking (AI)

```
[User] → [Frontend: Speaking Exercise]
   ↓
[User] Record audio (browser microphone)
   ↓
[Frontend] Upload audio → POST /ai/speaking/submit
   ↓
[API Gateway] → [AI Service]
   ├─ Validate audio file (format, size)
   ├─ Upload to MinIO: bucket "speaking-submissions"
   ├─ Insert into speaking_submissions
   ├─ Publish job → RabbitMQ: "ai.speaking.evaluate"
   └─ Return submission_id (status: pending)
        ↓
[AI Worker] (background)
   ├─ Consume job from RabbitMQ
   ├─ Download audio from MinIO
   ├─ Call OpenAI Whisper API (Speech-to-Text)
   │   → Get transcript
   ├─ Insert into speech_transcripts
   ├─ Analyze transcript with GPT-4
   │   - Grammar errors
   │   - Vocabulary assessment
   │   - Coherence analysis
   ├─ Pronunciation analysis (compare audio with text)
   ├─ Calculate scores:
   │   - Fluency & Coherence (từ transcript)
   │   - Lexical Resource
   │   - Grammatical Range & Accuracy
   │   - Pronunciation (từ audio analysis)
   ├─ Calculate overall band score
   ├─ Insert into speaking_evaluations
   ├─ Generate feedback
   ├─ Update submission status: completed
   └─ Publish "ai.speaking.completed" event
        ↓
[Frontend] Polling
   ↓
[User] → GET /ai/speaking/submissions/:id
   ↓
[AI Service] Return results
   ├─ Transcript text
   ├─ Band scores (4 criteria)
   ├─ Pronunciation analysis
   ├─ Highlighted errors
   └─ Feedback & suggestions
```

### 6. Luồng Thông báo

```
[System Event] (exercise completed, deadline approaching...)
   ↓
[Service X] Publish event → RabbitMQ
   ↓
[Notification Service] Consume event
   ├─ Check notification_preferences (user có bật thông báo không?)
   ├─ Load notification_template
   ├─ Generate notification content
   └─ Send notification:
        ├─ Push Notification (FCM)
        │   - Get device_tokens
        │   - Call FCM API
        │   - Log result
        ├─ Email Notification
        │   - Insert into email_queue
        │   - SMTP worker send email
        │   - Log to email_logs
        └─ In-App Notification
            - Insert into notifications table
            - WebSocket push to frontend (real-time)
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend Services
- **Go (Golang) 1.21+**: Ngôn ngữ chính cho microservices
  - **Frameworks**: Gin (HTTP routing), GORM (ORM)
  - **Libraries**: 
    - JWT-go (Authentication)
    - bcrypt (Password hashing)
    - validator (Input validation)
    - logrus (Logging)

### Frontend
- **Next.js 14**: React framework với SSR/SSG
- **TypeScript**: Type safety
- **TailwindCSS**: Utility-first CSS
- **shadcn/ui**: Component library
- **React Hook Form**: Form management
- **Zustand**: State management
- **Axios**: HTTP client

### Databases & Storage
- **PostgreSQL 15**: Primary database (6 databases)
- **Redis 7**: Caching, session storage
- **MinIO**: Object storage (S3-compatible) cho videos, audios, documents

### Message Queue
- **RabbitMQ 3**: Asynchronous processing, event-driven architecture

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy (production)

### External APIs
- **OpenAI GPT-4**: Writing evaluation, text analysis
- **OpenAI Whisper**: Speech-to-Text cho Speaking
- **Firebase Cloud Messaging (FCM)**: Push notifications
- **Google OAuth 2.0**: Social login
- **SendGrid/SMTP**: Email delivery

### DevOps & Tools
- **Git**: Version control
- **GitHub**: Code repository
- **Postman**: API testing
- **PgAdmin**: Database GUI
- **Make**: Task automation (Makefile)

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT

### Yêu cầu hệ thống

- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Disk**: 10GB trống

### Cài đặt đầy đủ (Backend + Frontend)

#### Bước 1: Clone repository
```bash
git clone https://github.com/bisosad1501/DATN.git
cd DATN
```

#### Bước 2: Setup Backend
```bash
# Chạy script tự động
chmod +x setup.sh
./setup.sh

# Script sẽ tự động:
# ✓ Kiểm tra Docker & Docker Compose
# ✓ Tạo .env file từ .env.example
# ✓ Build tất cả Docker images
# ✓ Start PostgreSQL, Redis, RabbitMQ, MinIO
# ✓ Chạy database migrations (tạo schema, seed data)
# ✓ Start tất cả microservices (7 services)
```

#### Bước 3: Setup Frontend
```bash
cd Frontend-IELTSGo

# Chạy script tự động
chmod +x setup-team.sh
./setup-team.sh

# Script sẽ tự động:
# ✓ Check & install pnpm (nếu chưa có)
# ✓ Copy .env.example → .env.local
# ✓ Install dependencies (pnpm install)
# ✓ Check backend status
# ✓ Hỏi có muốn chạy dev server không

# Nếu không chạy dev server tự động:
pnpm dev
```

#### Bước 4: Truy cập hệ thống
- **Frontend (Web App)**: http://localhost:3000
- **Backend API Gateway**: http://localhost:8080
- **PgAdmin (Database GUI)**: http://localhost:5050
  - Email: admin@ielts.com
  - Password: admin
- **RabbitMQ Management**: http://localhost:15672
  - Username: ielts_admin
  - Password: ielts_rabbitmq_password
- **MinIO Console**: http://localhost:9001
  - Username: ielts_admin
  - Password: ielts_minio_password_2025

#### Bước 5: Kiểm tra Services

```bash
# Check Docker containers
docker-compose ps

# Nên thấy các services:
# ✓ ielts_postgres (PostgreSQL)
# ✓ ielts_redis (Redis)
# ✓ ielts_rabbitmq (RabbitMQ)
# ✓ ielts_minio (MinIO)
# ✓ api-gateway (Port 8080)
# ✓ auth-service (Port 8081)
# ✓ user-service (Port 8082)
# ✓ course-service (Port 8083)
# ✓ exercise-service (Port 8084)
# ✓ ai-service (Port 8085)
# ✓ notification-service (Port 8086)

# Check logs
docker-compose logs -f api-gateway

# Health check
curl http://localhost:8080/health
```

### Cài đặt chỉ Backend

```bash
cd DATN
chmod +x setup.sh
./setup.sh
```

### Update code mới

Khi pull code mới từ Git, chạy script update:

```bash
chmod +x update.sh
./update.sh

# Script sẽ tự động:
# ✓ Pull code mới từ Git
# ✓ Rebuild các services đã thay đổi
# ✓ Chạy migrations mới (nếu có)
# ✓ Restart services
```

### Manual Setup (Nếu không dùng script)

```bash
# 1. Tạo .env file
cp .env.example .env

# 2. Edit .env (nếu cần thay đổi ports, passwords...)
nano .env

# 3. Build và start infrastructure
docker-compose up -d postgres redis rabbitmq minio

# 4. Chờ databases khởi động (30 giây)
sleep 30

# 5. Chạy migrations
docker-compose up migrations

# 6. Start microservices
docker-compose up -d api-gateway auth-service user-service \
  course-service exercise-service ai-service notification-service

# 7. Check status
docker-compose ps
docker-compose logs -f
```

### Database Migrations

```bash
# Chạy tất cả migrations
./scripts/run-all-migrations.sh

# Hoặc via Docker
docker-compose up migrations

# Check migrations đã apply
docker exec -i ielts_postgres psql -U ielts_admin -d auth_db \
  -c "SELECT * FROM schema_migrations ORDER BY applied_at DESC;"

# Xem danh sách tables
docker exec -i ielts_postgres psql -U ielts_admin -d auth_db -c "\dt"
```

### Seed Data (Dữ liệu mẫu)

Hệ thống có sẵn dữ liệu mẫu trong `database/seed_complete_data/`:

```bash
# Seed users, courses, exercises
docker exec -i ielts_postgres psql -U ielts_admin -d auth_db \
  < database/seed_complete_data/01_auth_users.sql

docker exec -i ielts_postgres psql -U ielts_admin -d course_db \
  < database/seed_complete_data/03_courses.sql

# Seed tất cả (cẩn thận: sẽ thêm nhiều data)
for file in database/seed_complete_data/*.sql; do
  db_name=$(basename $file | cut -d_ -f1)
  docker exec -i ielts_postgres psql -U ielts_admin -d ${db_name}_db < $file
done
```

**Tài khoản demo**:
- Admin: admin@ielts.com / Admin@123
- Instructor: instructor@ielts.com / Instructor@123
- Student: student@ielts.com / Student@123

---

## 🔧 CONFIGURATION

### Environment Variables

File `.env` chứa cấu hình chính:

```bash
# Database
POSTGRES_USER=ielts_admin
POSTGRES_PASSWORD=ielts_password_2025
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=ielts_redis_password

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=ielts_admin
RABBITMQ_PASSWORD=ielts_rabbitmq_password

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=ielts_admin
MINIO_SECRET_KEY=ielts_minio_password_2025

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_ACCESS_TOKEN_EXPIRY=24h
JWT_REFRESH_TOKEN_EXPIRY=168h  # 7 days

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
WHISPER_MODEL=whisper-1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Firebase Cloud Messaging
FCM_SERVER_KEY=your-fcm-server-key

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=development  # development, staging, production
```

**⚠️ Quan trọng**: 
- Đổi `JWT_SECRET` trong production
- Không commit file `.env` lên Git
- Sử dụng `.env.example` làm template

---

## 🏗️ KIẾN TRÚC MICROSERVICES

## 🏗️ Kiến trúc Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
│                    (Port: 8080)                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│  Auth Service  │   │  User Service  │   │ Course Service │
│  (Port: 8081)  │   │  (Port: 8082)  │   │  (Port: 8083)  │
└────────────────┘   └────────────────┘   └────────────────┘
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│Exercise Service│   │   AI Service   │   │Notification Srv│
│  (Port: 8084)  │   │  (Port: 8085)  │   │  (Port: 8086)  │
└────────────────┘   └────────────────┘   └────────────────┘
```

## 📦 Services

### 1. **API Gateway** (Port: 8080)
- Routing requests đến các microservices
- Authentication middleware
- Rate limiting
- Load balancing

### 2. **Auth Service** (Port: 8081)
- Đăng ký, đăng nhập
- JWT token generation & validation
- Phân quyền: Student, Instructor, Admin
- Refresh token mechanism

### 3. **User Service** (Port: 8082)
- Quản lý profile học viên
- Dashboard tracking tiến trình
- Learning statistics
- Study goals & reminders

### 4. **Course Service** (Port: 8083)
- Quản lý courses, modules, lessons
- Video lectures (4 skills: Listening, Reading, Writing, Speaking)
- Learning materials & resources
- Course enrollment

### 5. **Exercise Service** (Port: 8084)
- Bài tập Listening & Reading
- Question bank management
- Auto-grading cho trắc nghiệm
- Submission history

### 6. **AI Service** (Port: 8085)
- Writing evaluation (Task Achievement, Coherence, Lexical, Grammar)
- Speaking evaluation (Speech-to-Text + NLP)
- Pronunciation analysis
- Feedback generation

### 7. **Notification Service** (Port: 8086)
- Push notifications (Android)
- Email notifications
- In-app notifications
- Study reminders

## 🗄️ Database Design

Mỗi service có database riêng (Database per Service pattern):

- **auth_db**: Authentication data
- **user_db**: User profiles & progress
- **course_db**: Course content & materials
- **exercise_db**: Questions & submissions
- **ai_db**: AI evaluations & feedback
- **notification_db**: Notification queue

## 🛠️ Tech Stack

- **Language**: Go 1.21+
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger/OpenAPI

## 🚀 Quick Start

```bash
# Clone repository
git clone <repo-url>
cd DATN

# Start all services with Docker Compose
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
DATN/
├── api-gateway/
├── services/
│   ├── auth-service/
│   ├── user-service/
│   ├── course-service/
│   ├── exercise-service/
│   ├── ai-service/
│   └── notification-service/
├── shared/
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── models/
│   └── utils/
├── database/
│   ├── migrations/
│   └── seeds/
├── docker-compose.yml
└── README.md
```

## 🔐 Environment Variables

Xem file `.env.example` để cấu hình môi trường.

## 📚 API Documentation

Sau khi start services, truy cập:
- Swagger UI: http://localhost:8080/swagger

## 🧪 Testing

```bash
# Run unit tests
go test ./...

# Run integration tests
go test -tags=integration ./...
```

## � Database Overview

### Service Databases

| Service | Database | Tables | Purpose |
|---------|----------|--------|---------|
| Auth Service | `auth_db` | 9 tables | Authentication, roles, permissions, JWT tokens |
| User Service | `user_db` | 10 tables | User profiles, learning progress, achievements |
| Course Service | `course_db` | 12 tables | Courses, lessons, videos, enrollments |
| Exercise Service | `exercise_db` | 11 tables | Exercises, questions, answers, submissions |
| AI Service | `ai_db` | 10 tables | Writing/Speaking evaluations, AI processing |
| Notification Service | `notification_db` | 8 tables | Notifications, push/email delivery |

**Total**: 60 tables across 6 databases

Xem chi tiết: [Database Documentation](database/README.md)

---

## 🔗 API Endpoints

### Authentication Service (8081)
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Đăng xuất

### User Service (8082)
- `GET /users/profile` - Xem profile
- `PUT /users/profile` - Cập nhật profile
- `GET /users/progress` - Tiến trình học tập
- `GET /users/achievements` - Thành tựu

### Course Service (8083)
- `GET /courses` - Danh sách khóa học
- `GET /courses/:id` - Chi tiết khóa học
- `POST /courses/:id/enroll` - Đăng ký khóa học
- `GET /courses/:courseId/lessons/:lessonId` - Xem bài học

### Exercise Service (8084)
- `GET /exercises` - Danh sách bài tập
- `POST /exercises/:id/start` - Bắt đầu làm bài
- `POST /exercises/attempts/:id/submit` - Nộp bài

### AI Service (8085)
- `POST /ai/writing/submit` - Nộp bài Writing
- `GET /ai/writing/submissions/:id` - Kết quả chấm Writing
- `POST /ai/speaking/submit` - Nộp bài Speaking
- `GET /ai/speaking/submissions/:id` - Kết quả chấm Speaking

### Notification Service (8086)
- `GET /notifications` - Danh sách thông báo
- `PUT /notifications/:id/read` - Đánh dấu đã đọc
- `POST /notifications/register-device` - Đăng ký push notification

Xem chi tiết: [API Documentation](docs/API_ENDPOINTS.md)

---

## 🎯 Features Roadmap

### Phase 1: Core Features (Current)
- ✅ Database schema design
- ✅ Docker infrastructure setup
- 🔄 Basic CRUD APIs
- 🔄 Authentication & Authorization
- 🔄 User management

### Phase 2: Learning Features
- ⏳ Course management
- ⏳ Video streaming
- ⏳ Exercise system (Listening/Reading)
- ⏳ Progress tracking

### Phase 3: AI Integration
- ⏳ Writing AI evaluation
- ⏳ Speaking AI evaluation (Speech-to-Text + NLP)
- ⏳ Pronunciation analysis
- ⏳ Feedback generation

### Phase 4: Advanced Features
- ⏳ Notification system
- ⏳ Achievement system
- ⏳ Android app
- ⏳ Payment integration
- ⏳ Live classes

### Phase 5: Optimization
- ⏳ Performance optimization
- ⏳ Caching strategy
- ⏳ Load testing
- ⏳ CI/CD pipeline

---

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting
- SQL injection prevention
- XSS protection
- CORS configuration
- Audit logging
- Refresh token rotation

---

## 🔧 Configuration

### Environment Variables

Key environment variables (xem `.env.example` để biết đầy đủ):

```bash
# Database
POSTGRES_USER=ielts_admin
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Notifications
FCM_SERVER_KEY=your_fcm_key
SMTP_HOST=smtp.gmail.com
```

---

## 📈 Performance Considerations

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling
- Read replicas for heavy read operations
- Materialized views for analytics

### Caching Strategy
- Redis for session management
- Cache frequently accessed data (courses, users)
- Cache invalidation on updates

### Message Queue
- RabbitMQ for async processing
- AI evaluation jobs
- Email sending
- Notification delivery

---

## 👥 Team Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/auth-service

# Commit changes
git add .
git commit -m "feat: implement JWT authentication"

# Push to remote
git push origin feature/auth-service

# Create Pull Request on GitHub
```

### Commit Message Convention
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

## 🧪 Testing Strategy

### Unit Tests
```bash
go test ./...
```

### Integration Tests
```bash
go test -tags=integration ./...
```

### API Tests
Sử dụng Postman hoặc curl để test APIs

---

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md)
- [Database Schema Documentation](database/README.md)
- [API Endpoints](docs/API_ENDPOINTS.md)
- [MinIO Storage Setup](docs/MINIO_SETUP.md)
- [Architecture Overview](docs/ARCHITECTURE.md) (TODO)

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## �📝 License

MIT License
