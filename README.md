# IELTS Learning Platform - Backend Microservices

## 🚀 Quick Start

### 🎯 Full Stack Setup (Backend + Frontend)

```bash
# 1. Clone project
git clone https://github.com/bisosad1501/DATN.git
cd DATN

# 2. Setup Backend (Docker services)
chmod +x setup.sh
./setup.sh

# 3. Setup Frontend
cd Frontend-IELTSGo
./setup-team.sh    # Script tự động setup cho team

# Script sẽ tự động:
# ✓ Check & install pnpm nếu chưa có
# ✓ Copy .env.example → .env.local
# ✓ Install dependencies (pnpm install)
# ✓ Check backend status
# ✓ Hỏi có muốn chạy dev server không
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PgAdmin: http://localhost:5050

**Frontend Documentation:**
- 📖 **Setup Guide**: `Frontend-IELTSGo/SETUP_GUIDE.md` (chi tiết nhất)
- 🚀 **Quick Start**: `FRONTEND_TEAM_SETUP.md` (ở root)
- 🏗️ **Architecture**: `Frontend-IELTSGo/ARCHITECTURE.md`

---

### 📦 Backend Only Setup

#### Cài đặt mới (Lần đầu hoặc Fresh Install)

```bash
# 1. Clone project
git clone https://github.com/bisosad1501/DATN.git
cd DATN

# 2. Chạy script tự động (tất cả trong 1 lệnh!)
chmod +x setup.sh
./setup.sh

# ✅ Script sẽ tự động:
#    - Kiểm tra Docker & Docker Compose
#    - Tạo .env file (nếu chưa có)
#    - Build tất cả Docker images
#    - Start database & infrastructure
#    - Chạy migrations
#    - Start tất cả services
```

#### Update code (Khi đã có project và cần pull code mới)

```bash
# Chỉ cần 1 lệnh!
chmod +x update.sh
./update.sh

# ✅ Script sẽ tự động:
#    - Pull code mới từ git
#    - Rebuild các services đã thay đổi
#    - Chạy migrations mới (nếu có)
#    - Restart services
```

#### Manual Setup (Nếu muốn control từng bước)

```bash
# 1. Tạo .env từ template
cp .env.example .env

# 2. Build và start services
docker-compose up -d --build

# 3. Chạy migrations
docker-compose up migrations

# 4. Kiểm tra status
docker-compose ps
```

**Chi tiết**: Xem [TEAM_SETUP.md](./TEAM_SETUP.md) hoặc [QUICK_START.md](./QUICK_START.md)

---

## 🗄️ Database Migrations

**Migrations tự động chạy** khi dùng `./setup.sh` hoặc `./update.sh`

```bash
# Chạy manual (nếu cần)
./scripts/run-all-migrations.sh

# Hoặc via Docker
docker-compose up migrations

# Check migrations đã apply
docker exec -i ielts_postgres psql -U ielts_admin -d course_db -c \
  "SELECT * FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;"
```

**Migration Files:** `database/migrations/*.sql` (numbered: 001, 002, ...)  
**Docs:** `database/README.md` và `database/migrations/README_MIGRATION_*.md`

**⚠️ Quan trọng:**
- Migration 011: Xóa field `video_watch_percentage`
- Migration 012: Enable dblink extension (cross-database queries)

---

## 📋 Tổng quan

Hệ thống học IELTS trực tuyến với kiến trúc microservices, được xây dựng bằng Golang và PostgreSQL.

**Tech Stack:**
- **Backend**: Go 1.21+ (Microservices)
- **Frontend**: Next.js 14, TypeScript, TailwindCSS (trong folder `Frontend-IELTSGo/`)
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Message Queue**: RabbitMQ

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
