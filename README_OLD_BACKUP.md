# 🎓 HỆ THỐNG HỌC IELTS ĐA NỀN TẢNG
## Multi-Platform IELTS Learning System

> Hệ thống học IELTS toàn diện với kiến trúc Microservices, tích hợp AI đánh giá Writing & Speaking

---

## 📋 MỤC LỤC

1. [Giới thiệu dự án](#-giới-thiệu-dự-án)
2. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
3. [Chi tiết các thành phần](#-chi-tiết-các-thành-phần)
4. [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
5. [Luồng hoạt động](#-luồng-hoạt-động)
6. [Công nghệ sử dụng](#%EF%B8%8F-công-nghệ-sử-dụng)
7. [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
8. [API Endpoints](#-api-endpoints)
9. [Testing](#-testing)
10. [Bảo mật](#-bảo-mật)
11. [Performance & Scaling](#-performance--scaling)
12. [Roadmap](#-roadmap)
13. [Tài liệu kỹ thuật](#-tài-liệu-kỹ-thuật)

---

## 📖 GIỚI THIỆU DỰ ÁN

### Mục tiêu dự án

Xây dựng một **hệ thống học IELTS toàn diện**, hỗ trợ **đa nền tảng** (Web, Mobile), tích hợp **trí tuệ nhân tạo (AI)** để đánh giá và chấm điểm tự động các kỹ năng Writing và Speaking theo tiêu chuẩn IELTS.

### Đối tượng sử dụng

- **Học viên (Students)**: Người học IELTS, theo dõi tiến độ, làm bài tập, xem bài giảng
- **Giảng viên (Instructors)**: Tạo và quản lý khóa học, bài giảng, bài tập
- **Quản trị viên (Admins)**: Quản lý toàn bộ hệ thống, người dùng, dữ liệu

### Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| **Quản lý khóa học** | Courses được tổ chức theo modules → lessons, hỗ trợ video streaming |
| **Hệ thống bài tập** | Listening & Reading với tự động chấm điểm cho trắc nghiệm |
| **AI Đánh giá Writing** | Phân tích bài viết theo 4 tiêu chí IELTS (TA, CC, LR, GRA) |
| **AI Đánh giá Speaking** | Speech-to-Text + Pronunciation Analysis + Grammar Check |
| **Theo dõi tiến độ** | Dashboard cá nhân, thống kê chi tiết, achievements |
| **Thông báo đa kênh** | Push notification (Mobile), Email, In-app |
| **Lưu trữ file** | MinIO (S3-compatible) cho audio, video, documents |

### Điểm đặc biệt

✅ **Kiến trúc Microservices**: Các services độc lập, dễ bảo trì và mở rộng  
✅ **Database per Service**: Mỗi service có database riêng, đảm bảo tính độc lập  
✅ **Containerized**: Toàn bộ chạy trên Docker, dễ triển khai  
✅ **Real-time Processing**: RabbitMQ cho xử lý bất đồng bộ  
✅ **Caching**: Redis cache tối ưu hiệu năng

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
                                │ HTTP/REST API
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                               │
│                      (Go - Port: 8080)                            │
│  • Request Routing      • Authentication Middleware               │
│  • Rate Limiting        • Load Balancing                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼──────────┐  ┌────────▼─────────┐  ┌─────────▼────────┐
│  AUTH SERVICE    │  │   USER SERVICE   │  │  COURSE SERVICE  │
│   Port: 8081     │  │    Port: 8082    │  │   Port: 8083     │
│                  │  │                  │  │                  │
│ • Register       │  │ • Profile        │  │ • Courses        │
│ • Login/Logout   │  │ • Progress       │  │ • Modules        │
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
│ • Auto-Grading   │  │ • AI Feedback    │  │ • Reminders      │
│                  │  │                  │  │                  │
│ DB: exercise_db  │  │ DB: ai_db        │  │ DB: notify_db    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                           │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ PostgreSQL   │  │    Redis     │  │  RabbitMQ    │           │
│  │  (Database)  │  │   (Cache)    │  │  (Queue)     │           │
│  │  Port: 5432  │  │  Port: 6379  │  │  Port: 5672  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │    MinIO     │  │   PgAdmin    │                              │
│  │  (Storage)   │  │   (DB GUI)   │                              │
│  │  Port: 9000  │  │  Port: 5050  │                              │
│  └──────────────┘  └──────────────┘                              │
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

| Chức năng | Mô tả |
|-----------|-------|
| **Request Routing** | Định tuyến request theo URL pattern:<br>• `/auth/*` → Auth Service<br>• `/users/*` → User Service<br>• `/courses/*` → Course Service<br>• `/exercises/*` → Exercise Service<br>• `/ai/*` → AI Service<br>• `/notifications/*` → Notification Service |
| **Authentication** | Xác thực JWT token, kiểm tra quyền truy cập |
| **Rate Limiting** | Giới hạn số request để chống abuse (100 req/min) |
| **Load Balancing** | Phân tải request khi scale services |
| **CORS Handling** | Xử lý Cross-Origin Resource Sharing |
| **Logging & Monitoring** | Ghi log tất cả request/response |

**Công nghệ**: Go (Golang), Gin Framework

---

### 2. Auth Service (Port: 8081)

**Vai trò**: Quản lý xác thực và phân quyền

**Chức năng**:

#### Đăng ký tài khoản
- Validate email, username, password
- Hash password bằng bcrypt (cost factor: 12)
- Tạo user record trong `auth_db`
- Gửi email xác thực (via Notification Service)

#### Đăng nhập
- Xác thực credentials
- Generate JWT Access Token (expires: 24h)
- Generate Refresh Token (expires: 7 days)
- Lưu session vào Redis

#### Phân quyền (RBAC)

| Role | Quyền hạn |
|------|-----------|
| **Student** | Xem courses, làm bài tập, xem tiến độ |
| **Instructor** | Tất cả quyền Student + Tạo/sửa courses & bài tập |
| **Admin** | Full access, quản lý users, view system logs |

**Database**: `auth_db` (9 tables)
- `users`, `roles`, `permissions`, `user_roles`, `refresh_tokens`, `oauth_providers`, `login_history`, etc.

---

### 3. User Service (Port: 8082)

**Vai trò**: Quản lý thông tin cá nhân và tiến độ học tập

**Chức năng**:

#### Profile Management
- Cập nhật avatar, bio, contact info
- Thiết lập mục tiêu học tập (target IELTS score)
- Cài đặt nhắc nhở học tập

#### Learning Progress Tracking
- Theo dõi số giờ học, số bài đã hoàn thành
- Tính điểm trung bình các bài test
- Lưu lịch sử xem video, làm bài tập
- Gợi ý bài học tiếp theo

#### Dashboard Analytics
- Biểu đồ tiến độ theo thời gian
- Phân tích điểm mạnh/yếu theo skill
- Thống kê study streak (số ngày học liên tục)

#### Achievements & Badges
- Hệ thống huy hiệu
- Leaderboard (xếp hạng)
- Reward points

**Database**: `user_db` (10 tables)

---

### 4. Course Service (Port: 8083)

**Vai trò**: Quản lý nội dung khóa học

**Chức năng**:

#### Course Management
- CRUD courses (Create, Read, Update, Delete)
- Phân loại theo skill: Listening, Reading, Writing, Speaking
- Difficulty level (Beginner, Intermediate, Advanced)

#### Module & Lesson Structure
```
Course
 ├── Module 1
 │   ├── Lesson 1 (Video)
 │   ├── Lesson 2 (Reading Material)
 │   └── Lesson 3 (Practice Exercise)
 ├── Module 2
 │   └── ...
```

#### Video Lectures
- Upload video lên MinIO storage
- Video streaming support
- Theo dõi watch progress

#### Enrollment
- Học viên đăng ký khóa học
- Kiểm tra prerequisites
- Tracking completion status

**Database**: `course_db` (12 tables)

---

### 5. Exercise Service (Port: 8084)

**Vai trò**: Quản lý bài tập và chấm điểm tự động

**Chức năng**:

#### Exercise Management
- Tạo bài tập Listening & Reading
- Các dạng: Multiple Choice, True/False/Not Given, Matching, Fill in the Blanks
- Thiết lập time limit, difficulty, points

#### Question Bank
- Lưu trữ câu hỏi theo dạng
- Support passage/audio
- Đáp án và giải thích chi tiết

#### Auto-Grading
- Chấm điểm tự động cho trắc nghiệm
- Tính band score theo chuẩn IELTS
- Statistics (accuracy rate, time spent)

**Database**: `exercise_db` (11 tables)

---

### 6. AI Service (Port: 8085)

**Vai trò**: Đánh giá Writing & Speaking bằng AI

**Chức năng**:

#### A. Writing Evaluation

| Tiêu chí | Mô tả |
|----------|-------|
| **Task Achievement (TA)** | Có trả lời đúng yêu cầu đề bài không? |
| **Coherence & Cohesion (CC)** | Ý tưởng mạch lạc, liên kết tốt |
| **Lexical Resource (LR)** | Từ vựng đa dạng, chính xác |
| **Grammatical Range & Accuracy (GRA)** | Ngữ pháp phong phú, ít lỗi |

**Quy trình**:
1. Học viên nộp bài → Queue vào RabbitMQ
2. AI Worker (OpenAI GPT-4) phân tích
3. Scoring 0-9 cho từng tiêu chí
4. Generate feedback chi tiết

#### B. Speaking Evaluation

**Quy trình**:
1. Học viên ghi âm → Upload file (MP3/WAV)
2. Speech-to-Text (OpenAI Whisper)
3. Pronunciation Analysis
4. Grammar & Vocabulary Check
5. Scoring & Feedback

**Database**: `ai_db` (10 tables)

**External APIs**: OpenAI GPT-4, Whisper

---

### 7. Notification Service (Port: 8086)

**Vai trò**: Gửi thông báo đa kênh

**Chức năng**:

| Kênh | Công nghệ | Use Case |
|------|-----------|----------|
| **Push Notification** | Firebase FCM | Thông báo bài tập mới, deadline |
| **Email** | SMTP (Gmail/SendGrid) | Welcome email, Password reset |
| **In-App** | WebSocket | Notification bell trong web app |
| **Study Reminder** | Scheduled Jobs | Nhắc nhở học bài hàng ngày |

**Database**: `notification_db` (8 tables)

---

## 💾 CƠ SỞ DỮ LIỆU

### Database Architecture

**Database per Service Pattern**: Mỗi service có database riêng

**Ưu điểm**:
- ✅ Loose Coupling: Services không phụ thuộc lẫn nhau
- ✅ Independent Scaling: Scale từng database riêng
- ✅ Fault Isolation: Lỗi ở một DB không ảnh hưởng services khác

### Danh sách Databases

| Service | Database | Số Tables | Mô tả |
|---------|----------|-----------|-------|
| **Auth Service** | `auth_db` | 9 | Authentication, roles, permissions, JWT tokens |
| **User Service** | `user_db` | 10 | User profiles, learning progress, achievements |
| **Course Service** | `course_db` | 12 | Courses, modules, lessons, videos, enrollments |
| **Exercise Service** | `exercise_db` | 11 | Exercises, questions, answers, submissions |
| **AI Service** | `ai_db` | 10 | Writing/Speaking evaluations, AI processing |
| **Notification Service** | `notification_db` | 8 | Notifications, email queue, device tokens |

**Tổng cộng**: **60 tables** trên **6 databases**

### Schema Chi tiết

#### Auth Service (`auth_db`)
```sql
• users                    # Tài khoản người dùng
• roles                    # Vai trò (Student, Instructor, Admin)
• permissions              # Quyền hạn chi tiết
• user_roles               # Mapping user-role (many-to-many)
• role_permissions         # Mapping role-permission
• refresh_tokens           # JWT refresh tokens
• password_reset_tokens    # Token reset password
• oauth_providers          # Google OAuth data
• login_history            # Lịch sử đăng nhập
```

#### User Service (`user_db`)
```sql
• user_profiles            # Thông tin cá nhân (avatar, bio, contact)
• learning_progress        # Tiến độ học tập chi tiết
• study_goals              # Mục tiêu IELTS target score
• user_achievements        # Huy hiệu, thành tựu
• user_statistics          # Thống kê số giờ học, bài đã làm
• study_streaks            # Chuỗi ngày học liên tục
• user_preferences         # Cài đặt cá nhân
• learning_recommendations # Gợi ý bài học tiếp theo
• study_sessions           # Phiên học (start/end time, duration)
• leaderboard              # Bảng xếp hạng
```

#### Course Service (`course_db`)
```sql
• courses                  # Khóa học (title, description, difficulty)
• course_modules           # Modules trong khóa học
• lessons                  # Bài học (video, reading, exercise)
• lesson_videos            # Metadata video (URL, duration)
• video_subtitles          # Phụ đề video
• course_materials         # Tài liệu (PDF, slides)
• course_enrollments       # Đăng ký khóa học
• lesson_progress          # Tiến độ xem bài
• course_reviews           # Đánh giá khóa học
• course_categories        # Phân loại khóa học
• prerequisites            # Khóa học yêu cầu trước
• course_instructors       # Giảng viên phụ trách
```

#### Exercise Service (`exercise_db`)
```sql
• exercises                # Bài tập (Listening/Reading)
• exercise_questions       # Câu hỏi trong bài tập
• question_types           # Loại câu hỏi (Multiple Choice, T/F/NG...)
• question_options         # Các đáp án
• reading_passages         # Đoạn văn cho Reading
• audio_files              # File audio cho Listening
• exercise_attempts        # Lần làm bài
• attempt_answers          # Câu trả lời của học viên
• attempt_results          # Kết quả (score, band score)
• answer_explanations      # Giải thích đáp án
• exercise_statistics      # Thống kê độ khó, tỷ lệ đúng
```

#### AI Service (`ai_db`)
```sql
• writing_submissions      # Bài Writing nộp lên
• writing_evaluations      # Kết quả chấm Writing (TA, CC, LR, GRA)
• writing_feedback         # Feedback chi tiết
• speaking_submissions     # File audio Speaking
• speaking_evaluations     # Kết quả chấm Speaking
• speech_transcripts       # Text transcribed từ audio
• pronunciation_analysis   # Phân tích phát âm
• ai_processing_queue      # Queue jobs chờ xử lý
• ai_models_config         # Cấu hình AI models (GPT-4, Whisper)
• evaluation_criteria      # Tiêu chí chấm điểm
```

#### Notification Service (`notification_db`)
```sql
• notifications            # Thông báo (in-app, push, email)
• notification_types       # Loại thông báo
• notification_templates   # Template thông báo
• device_tokens            # FCM tokens cho push notification
• email_queue              # Queue email cần gửi
• email_logs               # Lịch sử gửi email
• notification_preferences # Cài đặt nhận thông báo
• scheduled_notifications  # Thông báo đặt lịch (reminders)
```

### Database Relationships

**Cross-Database References** (via `dblink` extension):
- `user_db.user_profiles.user_id` → `auth_db.users.id`
- `course_db.course_enrollments.user_id` → `auth_db.users.id`
- `exercise_db.exercise_attempts.user_id` → `auth_db.users.id`
- `ai_db.writing_submissions.user_id` → `auth_db.users.id`

**Tài liệu chi tiết**: [database/README.md](database/README.md)

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
[User] → [Browse Courses] → GET /courses
   ↓
[Course Service]
   ├─ Verify JWT
   ├─ Query courses from course_db
   └─ Return course list
        ↓
[User] → [Enroll Course] → POST /courses/:id/enroll
   ↓
[Course Service]
   ├─ Check prerequisites
   ├─ Insert into course_enrollments
   ├─ Publish "course.enrolled" event → RabbitMQ
   └─ Return success
        ↓
[User] → [Watch Video] → GET /courses/:id/lessons/:lessonId
   ↓
[Course Service]
   ├─ Get video URL from MinIO
   ├─ Return pre-signed URL (expires 1h)
   └─ Track lesson_progress
        ↓
[Frontend] Stream video từ MinIO
   ├─ Track watch progress (every 10s)
   └─ POST /lessons/:id/progress
```

### 3. Luồng Làm bài tập (Listening/Reading)

```
[User] → [View Exercises] → GET /exercises
   ↓
[Exercise Service] Return exercise list
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
   └─ POST /attempts/:id/answers
        ↓
[User] → [Submit] → POST /attempts/:id/submit
   ↓
[Exercise Service]
   ├─ Update attempt status: completed
   ├─ Auto-grade (compare with correct answers)
   ├─ Calculate score, band score
   ├─ Publish "exercise.completed" event
   └─ Return results (score, correct_answers, explanations)
```

### 4. Luồng Chấm bài Writing (AI)

```
[User] → [Write Essay] → POST /ai/writing/submit
   ↓
[AI Service]
   ├─ Validate submission (word count)
   ├─ Insert into writing_submissions
   ├─ Publish job → RabbitMQ: "ai.writing.evaluate"
   └─ Return submission_id (status: pending)
        ↓
[AI Worker] (background)
   ├─ Consume job from RabbitMQ
   ├─ Call OpenAI GPT-4 API
   │   Prompt: "Evaluate this IELTS Writing essay..."
   ├─ Parse AI response → Scores (TA, CC, LR, GRA)
   ├─ Calculate band score (average)
   ├─ Insert into writing_evaluations
   └─ Update status: completed
        ↓
[User] → GET /ai/writing/submissions/:id
   ↓
[AI Service] Return evaluation results
   ├─ Band scores (TA: 7.0, CC: 6.5, LR: 7.5, GRA: 7.0)
   ├─ Overall band score: 7.0
   └─ Feedback chi tiết
```

### 5. Luồng Chấm bài Speaking (AI)

```
[User] → [Record Audio] → POST /ai/speaking/submit
   ↓
[AI Service]
   ├─ Validate audio file
   ├─ Upload to MinIO: bucket "speaking-submissions"
   ├─ Insert into speaking_submissions
   ├─ Publish job → RabbitMQ: "ai.speaking.evaluate"
   └─ Return submission_id (status: pending)
        ↓
[AI Worker] (background)
   ├─ Download audio from MinIO
   ├─ Call OpenAI Whisper API (Speech-to-Text)
   │   → Get transcript
   ├─ Analyze transcript with GPT-4
   │   - Grammar errors
   │   - Vocabulary assessment
   ├─ Pronunciation analysis (audio analysis)
   ├─ Calculate scores: Fluency, Lexical, Grammar, Pronunciation
   └─ Update status: completed
        ↓
[User] → GET /ai/speaking/submissions/:id
   ↓
[AI Service] Return results
   ├─ Transcript text
   ├─ Band scores
   ├─ Pronunciation analysis
   └─ Feedback
```

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend Services
| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **Go (Golang)** | 1.21+ | Ngôn ngữ chính cho microservices |
| **Gin** | - | HTTP routing framework |
| **GORM** | - | ORM (Object-Relational Mapping) |
| **JWT-go** | - | JWT token handling |
| **bcrypt** | - | Password hashing |

### Frontend
| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **Next.js** | 14 | React framework (SSR/SSG) |
| **TypeScript** | - | Type safety |
| **TailwindCSS** | - | Utility-first CSS |
| **shadcn/ui** | - | Component library |
| **Zustand** | - | State management |

### Databases & Storage
| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **PostgreSQL** | 15 | Primary database (6 databases) |
| **Redis** | 7 | Caching, session storage |
| **MinIO** | Latest | Object storage (S3-compatible) |

### Message Queue & Infrastructure
| Công nghệ | Version | Vai trò |
|-----------|---------|---------|
| **RabbitMQ** | 3 | Asynchronous processing |
| **Docker** | 20.10+ | Containerization |
| **Docker Compose** | 2.0+ | Multi-container orchestration |

### External APIs
| API | Vai trò |
|-----|---------|
| **OpenAI GPT-4** | Writing evaluation, text analysis |
| **OpenAI Whisper** | Speech-to-Text cho Speaking |
| **Firebase FCM** | Push notifications |
| **Google OAuth 2.0** | Social login |
| **SMTP (Gmail/SendGrid)** | Email delivery |

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

# Nếu không chạy dev server tự động:
pnpm dev
```

#### Bước 4: Truy cập hệ thống

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend (Web App)** | http://localhost:3000 | - |
| **Backend API Gateway** | http://localhost:8080 | - |
| **PgAdmin (DB GUI)** | http://localhost:5050 | admin@ielts.com / admin |
| **RabbitMQ Management** | http://localhost:15672 | ielts_admin / ielts_rabbitmq_password |
| **MinIO Console** | http://localhost:9001 | ielts_admin / ielts_minio_password_2025 |

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

```bash
chmod +x update.sh
./update.sh

# Script sẽ tự động:
# ✓ Pull code mới từ Git
# ✓ Rebuild các services đã thay đổi
# ✓ Chạy migrations mới (nếu có)
# ✓ Restart services
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
```

### Seed Data (Dữ liệu mẫu)

**Tài khoản demo**:
- Admin: admin@ielts.com / Admin@123
- Instructor: instructor@ielts.com / Instructor@123
- Student: student@ielts.com / Student@123

```bash
# Seed users
docker exec -i ielts_postgres psql -U ielts_admin -d auth_db \
  < database/seed_complete_data/01_auth_users.sql

# Seed courses
docker exec -i ielts_postgres psql -U ielts_admin -d course_db \
  < database/seed_complete_data/03_courses.sql
```

---

## 🔗 API ENDPOINTS

### Authentication Service (8081)
```
POST   /auth/register              Đăng ký tài khoản
POST   /auth/login                 Đăng nhập
POST   /auth/refresh               Refresh token
POST   /auth/logout                Đăng xuất
POST   /auth/google                Google OAuth login
POST   /auth/forgot-password       Quên mật khẩu
POST   /auth/reset-password        Reset mật khẩu
```

### User Service (8082)
```
GET    /users/profile              Xem profile
PUT    /users/profile              Cập nhật profile
PUT    /users/avatar               Upload avatar
GET    /users/progress             Tiến độ học tập
GET    /users/statistics           Thống kê chi tiết
GET    /users/achievements         Danh sách thành tựu
POST   /users/goals                Thiết lập mục tiêu
GET    /users/leaderboard          Bảng xếp hạng
```

### Course Service (8083)
```
GET    /courses                    Danh sách khóa học
GET    /courses/:id                Chi tiết khóa học
POST   /courses                    Tạo khóa học (Instructor)
PUT    /courses/:id                Cập nhật khóa học
DELETE /courses/:id                Xóa khóa học
POST   /courses/:id/enroll         Đăng ký khóa học
GET    /courses/:id/modules        Danh sách modules
GET    /courses/:id/lessons/:lessonId  Chi tiết bài học
POST   /lessons/:id/progress       Cập nhật tiến độ
```

### Exercise Service (8084)
```
GET    /exercises                  Danh sách bài tập
GET    /exercises/:id              Chi tiết bài tập
POST   /exercises                  Tạo bài tập (Instructor)
POST   /exercises/:id/start        Bắt đầu làm bài
POST   /attempts/:id/answers       Lưu câu trả lời
POST   /attempts/:id/submit        Nộp bài
GET    /attempts/:id               Xem kết quả
GET    /exercises/history          Lịch sử làm bài
```

### AI Service (8085)
```
POST   /ai/writing/submit          Nộp bài Writing
GET    /ai/writing/submissions/:id Kết quả chấm Writing
POST   /ai/speaking/submit         Nộp bài Speaking (upload audio)
GET    /ai/speaking/submissions/:id Kết quả chấm Speaking
GET    /ai/speaking/:id/transcript Xem transcript
GET    /ai/evaluations/history     Lịch sử đánh giá AI
```

### Notification Service (8086)
```
GET    /notifications              Danh sách thông báo
PUT    /notifications/:id/read     Đánh dấu đã đọc
DELETE /notifications/:id          Xóa thông báo
POST   /notifications/register-device  Đăng ký device token (FCM)
GET    /notifications/preferences  Cài đặt thông báo
PUT    /notifications/preferences  Cập nhật cài đặt
```

**Tài liệu chi tiết**: [Postman Collection](postman/IELTS_Platform_API.postman_collection.json)

---

## 🧪 TESTING

### Manual Testing

```bash
# Health check
curl http://localhost:8080/health

# Register
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Test@123"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}'

# Get profile (với JWT token)
curl http://localhost:8080/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Testing với Postman

1. Import collection: `postman/IELTS_Platform_API.postman_collection.json`
2. Import environment: `postman/IELTS_Platform_Local.postman_environment.json`
3. Run collection để test tất cả endpoints

---

## 🔐 BẢO MẬT

### Authentication & Authorization

- **JWT Tokens**: Access token (24h) + Refresh token (7 days)
- **Password Hashing**: Bcrypt với cost factor 12
- **HTTPS**: Bắt buộc trong production
- **CORS**: Whitelist origins trong `.env`

### Authorization (RBAC)

| Role | Quyền hạn |
|------|-----------|
| **Student** | Xem courses, làm bài tập, xem tiến độ |
| **Instructor** | Tất cả quyền Student + Tạo/sửa courses & bài tập |
| **Admin** | Full access, quản lý users, view logs |

### Security Best Practices

- ✅ Input validation trên tất cả endpoints
- ✅ SQL injection prevention (GORM ORM)
- ✅ XSS protection (sanitize HTML)
- ✅ Rate limiting (100 req/minute per IP)
- ✅ Audit logging (track user actions)
- ✅ Refresh token rotation
- ✅ Secure session storage (Redis)

---

## 📈 PERFORMANCE & SCALING

### Caching Strategy

**Redis Cache** cho:
- Session management (JWT tokens)
- Frequently accessed data (course list, user profiles)
- API response cache (TTL: 5 phút)

### Database Optimization

- **Indexing**: Indexes trên columns thường query (user_id, course_id, email)
- **Connection Pooling**: Max 50 connections per service
- **Query Optimization**: Avoid N+1 queries, use JOINs

### Message Queue (RabbitMQ)

**Async Processing** cho:
- AI evaluation (writing/speaking) - tốn thời gian
- Email sending - không block request
- Notification delivery

### Horizontal Scaling

```bash
# Scale course-service lên 3 instances
docker-compose up -d --scale course-service=3

# API Gateway sẽ load balance requests
```

### Performance Metrics

**Mục tiêu**:
- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)
- AI evaluation time: < 30 giây (writing), < 60 giây (speaking)
- System uptime: 99.9%

---

## 🚧 ROADMAP

### Phase 1: Foundation ✅ (Hoàn thành)
- ✅ Thiết kế database schemas (60 tables)
- ✅ Setup Docker infrastructure
- ✅ Database migrations system
- ✅ Seed data mẫu

### Phase 2: Core Services 🔄 (Đang thực hiện - 80%)
- ✅ Auth Service: Register, Login, JWT
- ✅ User Service: Profile, Progress tracking
- 🔄 Course Service: Courses, Lessons, Video streaming (90%)
- 🔄 Exercise Service: Exercises, Auto-grading (85%)
- ⏳ AI Service: Writing/Speaking evaluation (50%)
- ⏳ Notification Service: Push, Email, In-app (60%)

### Phase 3: Frontend 🔄 (Đang thực hiện - 70%)
- ✅ Next.js 14 setup, TypeScript
- ✅ Authentication pages (Login, Register)
- ✅ Dashboard, Profile
- 🔄 Course pages (List, Detail, Video player) (80%)
- 🔄 Exercise pages (Listening, Reading) (70%)
- ⏳ AI evaluation pages (Writing, Speaking) (40%)

### Phase 4: AI Integration ⏳ (Tiếp theo)
- ⏳ OpenAI GPT-4 integration (Writing)
- ⏳ Whisper Speech-to-Text (Speaking)
- ⏳ Pronunciation analysis
- ⏳ Fine-tune AI models cho IELTS

### Phase 5: Mobile App ⏳ (Dự kiến)
- ⏳ React Native app
- ⏳ Android/iOS builds
- ⏳ Push notification
- ⏳ Offline mode

### Phase 6: Advanced Features ⏳ (Tương lai)
- ⏳ Live classes (Video conferencing)
- ⏳ Payment integration (VNPay, Stripe)
- ⏳ Social features (Forum, Study groups)
- ⏳ Gamification

### Phase 7: Production & DevOps ⏳
- ⏳ CI/CD pipeline (GitHub Actions)
- ⏳ Kubernetes deployment
- ⏳ Monitoring (Prometheus, Grafana)
- ⏳ Load testing

---

## 📚 TÀI LIỆU KỸ THUẬT

### Documentation Structure

```
DATN/
├── README.md                           ⭐ Tài liệu chính (file này)
├── QUICK_START.md                      Hướng dẫn khởi động nhanh
├── TEAM_SETUP.md                       Hướng dẫn setup cho team
│
├── database/
│   ├── README.md                       Database overview + Migration guide
│   ├── schemas/                        Database schemas (SQL)
│   ├── migrations/                     Migration files
│   └── seed_complete_data/             Dữ liệu mẫu
│
├── docs/
│   ├── MIGRATION_PLAN.md               Kiến trúc hệ thống chi tiết
│   ├── DATA_MODEL_RELATIONSHIPS.md     Mối quan hệ giữa các bảng
│   ├── GOOGLE_OAUTH_SETUP.md           Cấu hình Google OAuth
│   ├── MINIO_SETUP.md                  Cấu hình MinIO storage
│   └── ROLES_AND_PERMISSIONS.md        Hệ thống phân quyền
│
├── Frontend-IELTSGo/
│   ├── README.md                       Frontend overview
│   ├── SETUP_GUIDE.md                  Hướng dẫn setup frontend (chi tiết)
│   ├── ARCHITECTURE.md                 Kiến trúc frontend
│   └── QUICK_START.md                  Quick start frontend
│
└── postman/
    ├── README.md                       Hướng dẫn test API
    └── IELTS_Platform_API.postman_collection.json
```

### Quick Reference

| Bạn muốn | Xem tài liệu |
|----------|--------------|
| Setup lần đầu | `README.md` → `./setup.sh` |
| Pull code mới | `./update.sh` |
| Làm việc với database | `database/README.md` |
| Hiểu system architecture | `docs/MIGRATION_PLAN.md` |
| Setup frontend | `Frontend-IELTSGo/SETUP_GUIDE.md` |
| Test API | `postman/README.md` |

---

## 👥 TEAM & CONTRIBUTION

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-speaking-evaluation

# 2. Make changes & commit
git add .
git commit -m "feat(ai-service): add speaking evaluation endpoint"

# 3. Push to remote
git push origin feature/add-speaking-evaluation

# 4. Create Pull Request trên GitHub
```

### Commit Message Convention

Format: `<type>(<scope>): <subject>`

**Types**:
- `feat`: Tính năng mới
- `fix`: Sửa bug
- `docs`: Cập nhật documentation
- `refactor`: Refactor code
- `test`: Thêm tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): implement Google OAuth login
fix(exercise): fix auto-grading calculation
docs(readme): update installation guide
refactor(user): optimize profile query
```

---

## 📞 HỖ TRỢ & TROUBLESHOOTING

### Common Issues

**Docker containers không start**:
```bash
# Check logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild từ đầu
docker-compose down -v
docker-compose up -d --build
```

**Database connection error**:
```bash
# Check PostgreSQL status
docker-compose ps postgres

# Restart
docker-compose restart postgres
```

**Frontend không connect được backend**:
- Check backend đang chạy: `curl http://localhost:8080/health`
- Check `.env.local` có `NEXT_PUBLIC_API_URL=http://localhost:8080`

---

## 🎓 TÓM TẮT CHO GIẢNG VIÊN

### Điểm nổi bật của dự án

1. **Kiến trúc Microservices tiêu chuẩn**: 
   - 7 services độc lập, dễ maintain và scale
   - Database per service pattern
   - Communication qua REST API + Message Queue

2. **Công nghệ hiện đại**:
   - Go (performance cao, concurrency tốt)
   - PostgreSQL (ACID, relations)
   - Docker (containerization, portable)
   - Next.js 14 (SSR, SEO friendly)

3. **AI Integration thực tế**:
   - OpenAI GPT-4 cho Writing evaluation
   - Whisper Speech-to-Text cho Speaking
   - Scoring theo chuẩn IELTS

4. **Asynchronous Processing**:
   - RabbitMQ cho heavy tasks
   - Background workers
   - Non-blocking API responses

5. **Security & Best Practices**:
   - JWT authentication
   - RBAC (Role-Based Access Control)
   - Input validation
   - Audit logging

### Kỹ năng học được

- ✅ Thiết kế hệ thống phân tán (Distributed Systems)
- ✅ Microservices architecture patterns
- ✅ RESTful API design
- ✅ Database modeling & optimization
- ✅ Authentication & Authorization
- ✅ Asynchronous processing (Message Queue)
- ✅ Caching strategies
- ✅ Containerization (Docker)
- ✅ AI integration (OpenAI APIs)
- ✅ Full-stack development (Go + Next.js)

---

**Được cập nhật**: Tháng 1, 2026  
**Version**: 1.0.0  
**Tác giả**: DATN Team

---

## 📄 LICENSE

MIT License

Copyright (c) 2026 IELTS Learning Platform

---

**🌟 Star this repo nếu bạn thấy hữu ích!**