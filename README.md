# HỆ THỐNG HỌC IELTS ĐA NỀN TẢNG

## 1. GIỚI THIỆU

### 1.1 Mục tiêu

Xây dựng hệ thống học IELTS toàn diện hỗ trợ đa nền tảng (Web, Mobile), tích hợp trí tuệ nhân tạo để đánh giá và chấm điểm tự động các kỹ năng Writing và Speaking theo tiêu chuẩn IELTS.

### 1.2 Đối tượng sử dụng

- **Học viên**: Theo dõi tiến độ, làm bài tập, xem bài giảng
- **Giảng viên**: Tạo và quản lý khóa học, bài giảng, bài tập
- **Quản trị viên**: Quản lý toàn bộ hệ thống và người dùng

### 1.3 Phạm vi chức năng

Hệ thống cung cấp các chức năng chính: (1) Quản lý khóa học với cấu trúc modules và lessons, (2) Hệ thống bài tập Listening và Reading với tự động chấm điểm, (3) Đánh giá Writing dựa trên 4 tiêu chí IELTS, (4) Đánh giá Speaking với phân tích phát âm, (5) Theo dõi tiến độ học tập, (6) Thông báo đa kênh, và (7) Lưu trữ file đa phương tiện.

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Mô hình tổng quan

Hệ thống được thiết kế theo kiến trúc Microservices với ba tầng chính:

**Tầng Frontend**: Giao diện Web (Next.js 14) và Mobile (React Native - dự kiến) cho phép người dùng tương tác qua HTTP/REST API.

**Tầng Application**: Bao gồm API Gateway và 7 microservices độc lập:
- API Gateway (Port 8080): Điểm vào duy nhất, xử lý định tuyến, xác thực, rate limiting
- Auth Service (Port 8081): Xác thực và phân quyền
- User Service (Port 8082): Quản lý thông tin cá nhân và tiến độ
- Course Service (Port 8083): Quản lý khóa học và nội dung
- Exercise Service (Port 8084): Quản lý bài tập và chấm điểm
- AI Service (Port 8085): Đánh giá Writing và Speaking
- Notification Service (Port 8086): Thông báo đa kênh

**Tầng Infrastructure**: PostgreSQL (6 databases), Redis (cache), RabbitMQ (message queue), MinIO (object storage).

### 2.2 Nguyên lý hoạt động

Client gửi request đến API Gateway, Gateway xác thực JWT token và định tuyến đến microservice phù hợp. Các service xử lý business logic độc lập và giao tiếp qua REST API. Các tác vụ nặng (AI evaluation, email) được xử lý bất đồng bộ qua RabbitMQ. Redis lưu cache và session. MinIO lưu trữ file media.

---

## 3. CHI TIẾT CÁC THÀNH PHẦN

### 3.1 API Gateway

**Chức năng**: Định tuyến request theo URL pattern, xác thực JWT token, giới hạn số request (100/phút), phân tải request, xử lý CORS, ghi log request/response.

**Công nghệ**: Go, Gin Framework.

### 3.2 Auth Service

**Chức năng**: Đăng ký tài khoản với validation và hash password (bcrypt cost 12), đăng nhập với JWT token (Access: 24h, Refresh: 7 days), phân quyền RBAC với 3 roles (Student, Instructor, Admin), hỗ trợ Google OAuth 2.0.

**Database**: auth_db (9 tables) - users, roles, permissions, user_roles, refresh_tokens, oauth_providers, login_history.

### 3.3 User Service

**Chức năng**: Quản lý profile (avatar, bio, contact), thiết lập mục tiêu IELTS target score, theo dõi số giờ học và số bài đã hoàn thành, phân tích điểm mạnh/yếu theo skill, hệ thống achievement và leaderboard.

**Database**: user_db (10 tables) - user_profiles, learning_progress, study_goals, achievements, statistics.

### 3.4 Course Service

**Chức năng**: CRUD courses với phân loại theo skill (Listening, Reading, Writing, Speaking) và difficulty level, cấu trúc Course → Modules → Lessons, upload và streaming video qua MinIO, theo dõi watch progress, enrollment với kiểm tra prerequisites.

**Database**: course_db (12 tables) - courses, modules, lessons, lesson_videos, enrollments, materials.

### 3.5 Exercise Service

**Chức năng**: Tạo bài tập Listening và Reading theo format IELTS (Multiple Choice, True/False/Not Given, Matching, Fill in the Blanks), quản lý question bank với passage/audio, tự động chấm điểm trắc nghiệm và tính band score, lưu submission history.

**Database**: exercise_db (11 tables) - exercises, questions, options, attempts, answers, results.

### 3.6 AI Service

**Chức năng**:

**Writing Evaluation**: Phân tích bài viết theo 4 tiêu chí IELTS - Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy. Sử dụng OpenAI GPT-4, scoring 0-9 cho từng tiêu chí, generate feedback chi tiết.

**Speaking Evaluation**: Chuyển đổi audio thành text (OpenAI Whisper), phân tích phát âm, đánh giá grammar và vocabulary, scoring theo 4 tiêu chí (Fluency, Lexical, Grammar, Pronunciation).

Xử lý bất đồng bộ qua RabbitMQ để không block request.

**Database**: ai_db (10 tables) - writing_submissions, writing_evaluations, speaking_submissions, speaking_evaluations, transcripts, pronunciation_analysis.

### 3.7 Notification Service

**Chức năng**: Gửi Push notification qua Firebase FCM, gửi email qua SMTP (Gmail/SendGrid), in-app notification qua WebSocket, scheduled reminders cho học tập.

**Database**: notification_db (8 tables) - notifications, templates, device_tokens, email_queue.

---

## 4. CƠ SỞ DỮ LIỆU

### 4.1 Database Architecture

Áp dụng pattern "Database per Service" - mỗi microservice có database riêng để đảm bảo loose coupling, independent scaling và fault isolation. Tổng cộng 60 tables trên 6 databases PostgreSQL.

### 4.2 Cross-Database References

Sử dụng dblink extension để query cross-database khi cần thiết:
- user_db.user_profiles.user_id → auth_db.users.id
- course_db.course_enrollments.user_id → auth_db.users.id
- exercise_db.exercise_attempts.user_id → auth_db.users.id

### 4.3 Migration System

Database migrations được quản lý bằng numbered SQL files (001, 002, ...) trong thư mục database/migrations. Migration tracker lưu history trong bảng schema_migrations. Tự động chạy khi setup hoặc update.

---

## 5. LUỒNG HOẠT ĐỘNG

### 5.1 Luồng xác thực

User gửi credentials → API Gateway → Auth Service validate → Hash password → Query auth_db → Generate JWT tokens (Access 24h + Refresh 7 days) → Store session in Redis → Return tokens → Frontend lưu vào LocalStorage.

### 5.2 Luồng học khóa học

User request courses → API Gateway verify JWT → Course Service query course_db → Return list → User enroll → Check prerequisites → Insert enrollment → Publish event → User watch video → Get pre-signed URL from MinIO (expires 1h) → Track progress every 10s.

### 5.3 Luồng làm bài tập

User view exercises → Exercise Service return list → User start → Create attempt (status: in_progress) → Start timer → User submit answers → Auto-grade → Compare correct answers → Calculate band score → Publish "exercise.completed" event → User Service update statistics.

### 5.4 Luồng đánh giá Writing

User submit essay → AI Service validate → Insert writing_submissions → Publish job to RabbitMQ → Return submission_id (status: pending) → AI Worker consume job → Call OpenAI GPT-4 → Parse response → Calculate scores (TA, CC, LR, GRA) → Average band score → Generate feedback → Update status: completed → User polling result.

### 5.5 Luồng đánh giá Speaking

User upload audio → AI Service validate → Upload to MinIO → Insert speaking_submissions → Publish job → AI Worker download audio → Call Whisper API (Speech-to-Text) → Analyze transcript with GPT-4 → Pronunciation analysis → Calculate scores → Generate feedback → Update status: completed.

---

## 6. CÔNG NGHỆ SỬ DỤNG

### 6.1 Backend

- Go 1.21+: Ngôn ngữ chính cho microservices
- Gin: HTTP routing framework
- GORM: ORM cho PostgreSQL
- JWT-go: JWT token handling
- bcrypt: Password hashing

### 6.2 Frontend

- Next.js 14: React framework với SSR/SSG
- TypeScript: Type safety
- TailwindCSS: Utility-first CSS
- shadcn/ui: Component library

### 6.3 Infrastructure

- PostgreSQL 15: Primary database (6 databases)
- Redis 7: Cache và session storage
- RabbitMQ 3: Message queue
- MinIO: S3-compatible object storage
- Docker & Docker Compose: Containerization

### 6.4 External APIs

- OpenAI GPT-4: Writing evaluation
- OpenAI Whisper: Speech-to-Text
- Firebase Cloud Messaging: Push notifications
- Google OAuth 2.0: Social login
- SMTP: Email delivery

---

## 7. HƯỚNG DẪN CÀI ĐẶT

### 7.1 Yêu cầu hệ thống

- Docker 20.10+
- Docker Compose 2.0+
- RAM: 4GB minimum (8GB recommended)
- Disk: 10GB free space

### 7.2 Cài đặt Backend

```bash
git clone https://github.com/bisosad1501/DATN.git
cd DATN
chmod +x setup.sh
./setup.sh
```

Script tự động: Check Docker, tạo .env file, build images, start infrastructure (PostgreSQL, Redis, RabbitMQ, MinIO), chạy migrations, start microservices.

### 7.3 Cài đặt Frontend

```bash
cd Frontend-IELTSGo
chmod +x setup-team.sh
./setup-team.sh
pnpm dev
```

### 7.4 Truy cập hệ thống

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- PgAdmin: http://localhost:5050 (admin@ielts.com / admin)
- RabbitMQ Management: http://localhost:15672 (ielts_admin / ielts_rabbitmq_password)
- MinIO Console: http://localhost:9001 (ielts_admin / ielts_minio_password_2025)

### 7.5 Kiểm tra services

```bash
docker-compose ps
docker-compose logs -f api-gateway
curl http://localhost:8080/health
```

### 7.6 Database migrations

```bash
./scripts/run-all-migrations.sh
docker exec -i ielts_postgres psql -U ielts_admin -d auth_db -c "SELECT * FROM schema_migrations;"
```

### 7.7 Seed data

Tài khoản demo:
- Admin: admin@ielts.com / Admin@123
- Instructor: instructor@ielts.com / Instructor@123
- Student: student@ielts.com / Student@123

---

## 8. API ENDPOINTS

### 8.1 Authentication (8081)

- POST /auth/register - Đăng ký tài khoản
- POST /auth/login - Đăng nhập
- POST /auth/refresh - Refresh token
- POST /auth/logout - Đăng xuất
- POST /auth/google - Google OAuth login

### 8.2 User (8082)

- GET /users/profile - Xem profile
- PUT /users/profile - Cập nhật profile
- GET /users/progress - Tiến độ học tập
- GET /users/statistics - Thống kê chi tiết
- GET /users/achievements - Danh sách thành tựu

### 8.3 Course (8083)

- GET /courses - Danh sách khóa học
- GET /courses/:id - Chi tiết khóa học
- POST /courses - Tạo khóa học (Instructor)
- POST /courses/:id/enroll - Đăng ký khóa học
- GET /courses/:id/lessons/:lessonId - Chi tiết bài học
- POST /lessons/:id/progress - Cập nhật tiến độ

### 8.4 Exercise (8084)

- GET /exercises - Danh sách bài tập
- GET /exercises/:id - Chi tiết bài tập
- POST /exercises/:id/start - Bắt đầu làm bài
- POST /attempts/:id/answers - Lưu câu trả lời
- POST /attempts/:id/submit - Nộp bài
- GET /attempts/:id - Xem kết quả

### 8.5 AI (8085)

- POST /ai/writing/submit - Nộp bài Writing
- GET /ai/writing/submissions/:id - Kết quả chấm Writing
- POST /ai/speaking/submit - Nộp bài Speaking
- GET /ai/speaking/submissions/:id - Kết quả chấm Speaking

### 8.6 Notification (8086)

- GET /notifications - Danh sách thông báo
- PUT /notifications/:id/read - Đánh dấu đã đọc
- POST /notifications/register-device - Đăng ký device token
- GET /notifications/preferences - Cài đặt thông báo

---

## 9. BẢO MẬT

### 9.1 Authentication

JWT tokens với Access token (24h) và Refresh token (7 days). Password hashing sử dụng bcrypt với cost factor 12. HTTPS bắt buộc trong production.

### 9.2 Authorization

Role-Based Access Control (RBAC) với 3 roles:
- **Student**: Xem courses, làm bài tập, xem tiến độ
- **Instructor**: Quyền Student + Tạo/sửa courses và bài tập
- **Admin**: Full access, quản lý users, view logs

### 9.3 Security Practices

Input validation trên tất cả endpoints. SQL injection prevention (GORM ORM). XSS protection (sanitize HTML). Rate limiting (100 requests/minute per IP). Audit logging. Refresh token rotation. Secure session storage (Redis).

---

## 10. PERFORMANCE

### 10.1 Caching Strategy

Redis cache cho: Session management, frequently accessed data (course list, user profiles), API response cache với TTL 5 phút.

### 10.2 Database Optimization

Indexes trên columns thường query (user_id, course_id, email). Connection pooling (max 50 connections per service). Query optimization (avoid N+1 queries).

### 10.3 Asynchronous Processing

RabbitMQ xử lý các tác vụ nặng: AI evaluation (30-60s), email sending, notification delivery. Background workers consume jobs từ queue.

### 10.4 Horizontal Scaling

Services có thể scale độc lập:
```bash
docker-compose up -d --scale course-service=3
```

API Gateway tự động load balance requests.

### 10.5 Performance Targets

- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)
- AI evaluation: < 30s (writing), < 60s (speaking)
- System uptime: 99.9%

---

## 11. ROADMAP

### Phase 1: Foundation (Hoàn thành)
Database schemas (60 tables), Docker infrastructure, migrations system, seed data.

### Phase 2: Core Services (80%)
Auth Service (hoàn thành), User Service (hoàn thành), Course Service (90%), Exercise Service (85%), AI Service (50%), Notification Service (60%).

### Phase 3: Frontend (70%)
Next.js setup, authentication pages, dashboard, course pages (80%), exercise pages (70%), AI evaluation pages (40%).

### Phase 4: AI Integration
OpenAI GPT-4 integration, Whisper Speech-to-Text, pronunciation analysis, feedback generation.

### Phase 5: Mobile App
React Native, Android/iOS builds, push notification, offline mode.

### Phase 6: Advanced Features
Live classes, payment integration, social features, gamification.

### Phase 7: Production
CI/CD pipeline, Kubernetes deployment, monitoring (Prometheus/Grafana), load testing.

---

## 12. TÀI LIỆU THAM KHẢO

- README.md: Tài liệu chính
- database/README.md: Database overview và migration guide
- docs/MIGRATION_PLAN.md: Kiến trúc hệ thống chi tiết
- docs/DATA_MODEL_RELATIONSHIPS.md: Mối quan hệ giữa các bảng
- Frontend-IELTSGo/SETUP_GUIDE.md: Hướng dẫn setup frontend
- postman/: API collection và environment

---

## 13. KẾT LUẬN

Hệ thống học IELTS đa nền tảng được xây dựng với kiến trúc Microservices hiện đại, tích hợp AI để đánh giá tự động Writing và Speaking. Hệ thống áp dụng các best practices về security (JWT, RBAC), performance (caching, message queue), và scalability (horizontal scaling, database per service). 

Công nghệ sử dụng: Go cho backend (performance cao, concurrency tốt), PostgreSQL cho data persistence (ACID, relations), Redis cho caching, RabbitMQ cho async processing, Docker cho containerization. Frontend sử dụng Next.js 14 với SSR/SSG để tối ưu SEO và performance.

Hệ thống đã hoàn thành 80% core features, tiếp tục phát triển AI integration và mobile app trong các phase tiếp theo.

---

**Ngày cập nhật**: Tháng 1, 2026  
**Version**: 1.0.0  
**License**: MIT