# API Changes - Postman Collection Update Guide

## 🔄 Các thay đổi API quan trọng cần update

### ⚠️ Breaking Changes

#### 1. **Exercise Service - Submit Answers** (L/R)
**Endpoint:** `PUT /api/v1/submissions/:id/answers`

**CŨ:**
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "selected_option_id": "uuid",
      "time_spent_seconds": 0
    }
  ]
}
```

**MỚI:** ✅
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "selected_option_id": "uuid",
      "time_spent_seconds": 0
    }
  ],
  "time_spent_seconds": 120  // ← THÊM MỚI: Tổng thời gian làm bài
}
```

---

#### 2. **Exercise Service - Submit Exercise** (W/S)
**Endpoint:** `POST /api/v1/submissions/:id/submit`

**KHÔNG THAY ĐỔI STRUCTURE** - Đã có `time_spent_seconds`
```json
{
  "writing_data": {
    "essay_text": "...",
    "word_count": 250,
    "task_type": "task2",
    "prompt_text": "..."
  },
  "time_spent_seconds": 300,  // Đã có từ trước
  "is_official_test": false
}
```

---

### ✨ New Endpoints

#### User Service - Achievements

**1. Get All Achievements**
```
GET /api/v1/user/achievements
Headers: Authorization: Bearer {{access_token}}

Response:
{
  "success": true,
  "data": {
    "achievements": [
      {
        "achievement": {
          "id": 1,
          "code": "first_lesson",
          "name": "Bài học đầu tiên",
          "criteria_type": "completion",
          "criteria_value": 1,
          "points": 10
        },
        "is_earned": true,
        "earned_at": "2025-11-07T20:02:33Z",
        "progress": 1,
        "progress_percentage": 100
      }
    ]
  }
}
```

**2. Get Earned Achievements**
```
GET /api/v1/user/achievements/earned
Headers: Authorization: Bearer {{access_token}}
```

---

#### User Service - Scoring System (Phase 3)

**1. Record Official Test Result**
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

**2. Record Practice Activity**
```
POST /api/v1/user/internal/users/:user_id/practice-activities
Headers: X-Internal-API-Key: {{internal_api_key}}

Body:
{
  "skill": "reading",
  "activity_type": "practice",
  "score": 6.5,
  "accuracy_percentage": 85.5,
  "time_spent_seconds": 1200,
  "exercise_id": "uuid",
  "submission_id": "uuid"
}
```

**3. Get Practice Statistics**
```
GET /api/v1/user/internal/users/:user_id/practice-statistics?skill=listening
Headers: X-Internal-API-Key: {{internal_api_key}}
```

---

### 🔧 Updated Endpoints

#### Storage Service (NEW endpoints)

**1. Upload Audio**
```
POST /api/v1/storage/audio/upload
Content-Type: multipart/form-data

Form Data:
- file: (binary audio file)
- folder: "speaking" (optional)

Response:
{
  "success": true,
  "data": {
    "audio_url": "http://localhost:9000/audio/speaking/uuid.mp3",
    "object_name": "speaking/uuid.mp3",
    "size": 12345,
    "content_type": "audio/mpeg"
  }
}
```

**2. Get Presigned URL**
```
GET /api/v1/storage/audio/presigned-url/speaking/uuid.mp3

Response:
{
  "success": true,
  "data": {
    "url": "http://localhost:9000/audio/speaking/uuid.mp3?X-Amz-...",
    "expires_in": 3600
  }
}
```

---

## 📋 Checklist để update Postman

### Auth Service ✅ (Không đổi)
- [x] Login
- [x] Register
- [x] Refresh Token
- [x] Google OAuth
- [x] Password Reset

### User Service
- [x] Profile endpoints (không đổi)
- [x] Progress endpoints (không đổi)
- [x] Follow/Unfollow (không đổi)
- [ ] **NEW**: `/achievements` - Cần thêm
- [ ] **NEW**: `/achievements/earned` - Cần thêm
- [ ] **NEW**: Internal scoring endpoints - Cần thêm

### Exercise Service
- [ ] **UPDATE**: `PUT /submissions/:id/answers` - Thêm `time_spent_seconds` vào body
- [x] Other endpoints (không đổi)

### AI Service ✅ (Không đổi)
- [x] Evaluate Writing
- [x] Transcribe Speaking
- [x] Evaluate Speaking

### Storage Service
- [ ] **NEW**: All audio endpoints - Cần thêm folder mới

### Notification Service ✅ (Không đổi nhiều)
- [x] Get notifications
- [x] Mark as read
- [x] SSE stream

---

## 🎯 Priority Updates

### HIGH PRIORITY:
1. ✅ Exercise Service - Submit Answers (thêm `time_spent_seconds`)
2. ✅ User Service - Achievements endpoints
3. ✅ Storage Service - Audio upload endpoints

### MEDIUM PRIORITY:
4. User Service - Internal scoring endpoints
5. Exercise Service - New fields in responses

### LOW PRIORITY:
6. Environment variables update
7. Test scripts update

---

## 🔑 Environment Variables cần có

```
// Local Development
base_url = http://localhost:8080
auth_url = http://localhost:8081
user_url = http://localhost:8082
storage_url = http://localhost:8083
exercise_url = http://localhost:8084
notification_url = http://localhost:8085
ai_url = http://localhost:8086

// Tokens
access_token = (auto-set after login)
refresh_token = (auto-set after login)
token_expiry = (auto-set after login)
user_id = (auto-set after login)

// Internal
internal_api_key = internal_secret_key_ielts_2025_change_in_production
```

---

## 📝 Sample Requests

### Test Achievement System
```
1. Login → Get token
2. Complete an exercise
3. GET /api/v1/user/achievements → Verify "first_lesson" unlocked
4. GET /api/v1/user/leaderboard/rank → Check points
```

### Test Time Tracking
```
1. Start exercise → Get submission_id
2. Do exercise for 2 minutes
3. Submit with time_spent_seconds: 120
4. GET /api/v1/submissions/:id/result
5. Verify time_spent_seconds = 120
```

---

## 🚀 Quick Fix

Nếu muốn quick update collection hiện tại:

1. **Tìm request:** "Submit Answers" trong Exercise Service folder
2. **Update Body:**
   ```json
   {
     "answers": {{existing_answers}},
     "time_spent_seconds": 120  // Add this line
   }
   ```

3. **Add folder:** "Achievements" trong User Service
   - GET /api/v1/user/achievements
   - GET /api/v1/user/achievements/earned

4. **Add folder:** "Storage - Audio" trong Storage Service
   - POST /api/v1/storage/audio/upload
   - GET /api/v1/storage/audio/presigned-url/*

---

## ✅ Verification

After update, test these critical flows:

1. **Auth Flow** ✅
   - Login → Store token → Auto-refresh

2. **Exercise Flow** ✅
   - List → Detail → Start → Submit → Result

3. **Achievement Flow** ✅
   - Complete exercise → Check achievements → Verify points

4. **Storage Flow** ✅  
   - Upload audio → Get URL → Use in speaking submission

---

**Last Updated:** 2025-11-08
**Version:** 2.0.0 (Time Tracking + Achievements)


