# Postman Collection - Audit & Fixes

## 🔍 Kiểm tra toàn diện Collection

**File:** `IELTS_Platform_API.postman_collection.json`
**Size:** 8,032 lines
**Services:** 8 folders
**Date:** 2025-11-08

---

## ✅ Đã sửa

### 1. **Submit Answers** - Exercise Service ✅
**Location:** Exercise Service → Student APIs → Submit Answers

**ĐÃ SỬA:**
```json
{
  "answers": [...],
  "time_spent_seconds": 120  // ← Đã thêm
}
```

**Endpoint:** `PUT /api/v1/submissions/:id/answers` ✅

---

## ❌ Cần sửa/Thêm

### 2. **Submit Exercise** (POST /submit) - THIẾU
**Location:** Exercise Service → Student APIs
**Status:** ❌ THIẾU HOÀN TOÀN

**Cần thêm request:**
```
Name: Submit Exercise (Writing/Speaking)
Method: POST
URL: {{exercise_service_url}}/api/v1/submissions/{{test_submission_id}}/submit

Body:
{
  "writing_data": {
    "essay_text": "Sample essay text here...",
    "word_count": 250,
    "task_type": "task2",
    "prompt_text": "Discuss the advantages and disadvantages..."
  },
  "time_spent_seconds": 300,
  "is_official_test": false
}

OR

{
  "speaking_data": {
    "audio_url": "http://localhost:9000/audio/speaking/uuid.mp3",
    "audio_duration_seconds": 45,
    "speaking_part_number": 1
  },
  "time_spent_seconds": 60,
  "is_official_test": false
}
```

---

### 3. **Storage Service** - THIẾU HOÀN TOÀN
**Status:** ❌ KHÔNG CÓ FOLDER

**Cần thêm folder mới:** "Storage Service"

**Endpoints cần có:**

#### 3.1. Upload Audio
```
POST /api/v1/storage/audio/upload
Content-Type: multipart/form-data

Form Data:
- file: (audio file)
- folder: "speaking" (optional)
```

#### 3.2. Get Presigned URL
```
GET /api/v1/storage/audio/presigned-url/speaking/filename.mp3
```

#### 3.3. Get Audio Info
```
GET /api/v1/storage/audio/info/speaking/filename.mp3
```

#### 3.4. Serve Audio File
```
GET /api/v1/storage/audio/file/speaking/filename.mp3
```

#### 3.5. Delete Audio
```
DELETE /api/v1/storage/audio/speaking/filename.mp3
```

---

### 4. **Complete Submission** - ENDPOINT CŨ SAI
**Location:** Exercise Service → Student APIs → Complete Submission
**Status:** ❌ ENDPOINT KHÔNG TỒN TẠI

**Hiện tại:**
```
POST /api/v1/submissions/:id/complete
```

**Thực tế:** Endpoint này KHÔNG có trong code!

**Action:** ❌ XÓA request này

**Lý do:** Backend tự động complete khi:
- Listening/Reading: Gọi `PUT /submissions/:id/answers`
- Writing/Speaking: Gọi `POST /submissions/:id/submit`

---

### 5. **User Service - Internal Endpoints** - THIẾU
**Location:** User Service
**Status:** ❌ THIẾU FOLDER "Internal APIs"

**Cần thêm folder:** "Internal APIs" (for service-to-service calls)

#### 5.1. Record Practice Activity
```
POST /api/v1/user/internal/users/:user_id/practice-activities
Headers: X-Internal-API-Key: {{internal_api_key}}

Body:
{
  "skill": "listening",
  "activity_type": "practice",
  "score": 6.5,
  "accuracy_percentage": 85.5,
  "time_spent_seconds": 1200,
  "exercise_id": "uuid",
  "submission_id": "uuid",
  "completion_status": "completed"
}
```

#### 5.2. Record Official Test Result
```
POST /api/v1/user/internal/users/:user_id/test-results
Headers: X-Internal-API-Key: {{internal_api_key}}

Body:
{
  "skill": "listening",
  "test_type": "full_test",
  "band_score": 7.5,
  "test_date": "2025-11-07T10:00:00Z",
  "exercise_id": "uuid",
  "submission_id": "uuid"
}
```

#### 5.3. Update Progress
```
PUT /api/v1/user/internal/progress/update
Headers: X-Internal-API-Key: {{internal_api_key}}

Body:
{
  "user_id": "uuid",
  "updates": {
    "total_exercises_completed": 1
  }
}
```

---

### 6. **AI Service** - CẦN KIỂM TRA
**Location:** AI Service

**Endpoints hiện tại trong code:**
- `POST /api/v1/ai/internal/writing/evaluate`
- `POST /api/v1/ai/internal/speaking/transcribe`
- `POST /api/v1/ai/internal/speaking/evaluate`

**Cần verify:** Collection có đúng endpoints này không?

---

### 7. **Notification Service** - CẦN KIỂM TRA

**Endpoints mới trong code:**
- `GET /api/v1/notifications/stream` (SSE)
- `PUT /api/v1/notifications/mark-all-read`
- `POST /api/v1/notifications/devices` (FCM registration)

---

## 📋 Summary - Cần làm gì

### Priority 1: CẦN SỬA NGAY
- [x] ✅ Submit Answers - Đã thêm `time_spent_seconds`
- [ ] ❌ XÓA "Complete Submission" endpoint (không tồn tại)
- [ ] ❌ THÊM "Submit Exercise" endpoint (POST /submit)
- [ ] ❌ THÊM Storage Service folder

### Priority 2: CẦN BỔ SUNG
- [ ] THÊM User Service → Internal APIs folder
- [ ] CHECK AI Service endpoints
- [ ] CHECK Notification Service endpoints

### Priority 3: OPTIONAL
- [ ] Update descriptions
- [ ] Update example data
- [ ] Add more test scripts

---

## 🎯 Quick Fix Commands

Đã tạo backup:
```bash
postman/IELTS_Platform_API.postman_collection.json.backup
```

Do collection quá lớn và phức tạp, **khuyến nghị:**
1. Import vào Postman
2. Sửa trực tiếp trong Postman UI
3. Export lại

**Hoặc:**
- Dùng document này làm checklist
- Manually add/update từng request trong Postman

---

## ✅ Verification Checklist

Test sau khi update:

- [ ] Auth: Login → Get token → Auto-save
- [ ] Exercise: List → Start → Submit Answers (with time_spent) → Get Result
- [ ] Exercise: Start → Submit Exercise (W/S) → Polling status
- [ ] User: Get Profile → Get Achievements → Check points
- [ ] Storage: Upload Audio → Get URL
- [ ] AI: Evaluate Writing → Get scores

---

**Next Steps:**
1. Review document này
2. Quyết định sửa trong Postman UI hay programmatically
3. Test thoroughly after update



