# Postman Collection - Update Summary

## ✅ Đã hoàn thành cập nhật

**Date:** 2025-11-08
**File:** `IELTS_Platform_API.postman_collection.json`
**Backup:** `IELTS_Platform_API.postman_collection.json.backup`

---

## 📊 Thống kê

| Before | After |
|--------|-------|
| 8,032 lines | 8,242 lines |
| 8 services | 9 services |
| Missing endpoints | All critical endpoints added |

---

## 🔧 Các thay đổi

### 1. ✅ Exercise Service - Submit Answers
**Sửa body request:**
```json
{
  "answers": [...],
  "time_spent_seconds": 120  // ← Đã thêm
}
```

### 2. ✅ Exercise Service - Submit Exercise
**Thêm endpoint mới:**
- **Name:** Submit Exercise (Writing/Speaking)
- **Method:** POST
- **URL:** `/api/v1/submissions/:id/submit`
- **Body:** Hỗ trợ `writing_data` hoặc `speaking_data`

### 3. ✅ Exercise Service - Complete Submission
**Action:** ❌ ĐÃ XÓA (endpoint không tồn tại)

### 4. ✅ Storage Service
**Thêm folder mới hoàn chỉnh:**
- Health Check
- Upload Audio
- Get Presigned URL
- Get Audio Info
- Serve Audio File

### 5. ✅ User Service - Internal APIs
**Thêm folder mới:**
- Record Practice Activity
- Record Official Test Result
- Update Progress

---

## 📋 Collection Structure

```
IELTS Platform API
├─ Auth Service (8081)
├─ Google OAuth
├─ Auth Service - Error Cases
├─ User Service (8082)
│  ├─ Health Check
│  ├─ Get My Profile
│  ├─ Update Profile
│  ├─ ...
│  ├─ Statistics & Achievements
│  ├─ Social Features
│  └─ Internal APIs ← NEW
├─ Course Service (planned)
├─ Exercise Service (8084)
│  ├─ Public APIs
│  ├─ Student APIs
│  │  ├─ Start Exercise
│  │  ├─ Submit Answers ← UPDATED
│  │  ├─ Submit Exercise (W/S) ← NEW
│  │  ├─ Get Submission Result
│  │  └─ My Submissions
│  ├─ Admin APIs
│  └─ Tags
├─ Notification Service (8085)
├─ Storage Service (8083) ← NEW FOLDER
│  ├─ Health Check
│  ├─ Upload Audio
│  ├─ Get Presigned URL
│  ├─ Get Audio Info
│  └─ Serve Audio File
└─ AI Service (8086)
   ├─ Evaluate Writing
   ├─ Transcribe Speaking
   └─ Evaluate Speaking
```

---

## 🎯 Testing Guide

### Test 1: Submit Answers (Listening/Reading)
```
1. Login → Get token
2. Start Exercise → Get submission_id
3. Submit Answers với:
   {
     "answers": [...],
     "time_spent_seconds": 120
   }
4. Verify: Check database time_spent_seconds = 120
```

### Test 2: Submit Exercise (Writing)
```
1. Login → Get token
2. Start Writing Exercise
3. Submit Exercise với:
   {
     "writing_data": {...},
     "time_spent_seconds": 300
   }
4. Poll status until completed
5. Verify: time_spent = 300
```

### Test 3: Upload Audio (Speaking)
```
1. Upload audio to Storage Service
2. Get audio_url from response
3. Submit Exercise với audio_url
4. Verify: Audio played correctly
```

### Test 4: Achievements
```
1. Complete exercise
2. GET /api/v1/user/achievements
3. Verify: first_lesson unlocked
4. Check leaderboard points
```

---

## 🔑 Environment Variables

Cần có trong Postman Environment:

```
base_url = http://localhost:8080 (API Gateway)
auth_url = http://localhost:8081
user_service_url = http://localhost:8082
storage_service_url = http://localhost:8083
exercise_service_url = http://localhost:8084
notification_service_url = http://localhost:8085
ai_service_url = http://localhost:8086

access_token = (auto-set after login)
refresh_token = (auto-set after login)
user_id = (auto-set after login)
test_exercise_id = (set manually)
test_submission_id = (auto-set after start exercise)

internal_api_key = internal_secret_key_ielts_2025_change_in_production
```

---

## ✅ Validation

```bash
# Check JSON validity
cd postman
jq '.' IELTS_Platform_API.postman_collection.json > /dev/null && echo "✅ JSON valid"

# Count services
jq '.item | length' IELTS_Platform_API.postman_collection.json
# Output: 9

# List all services
jq '.item[] | .name' IELTS_Platform_API.postman_collection.json
```

---

## 🚀 Next Steps

1. **Import vào Postman:**
   - File → Import → Choose file
   - Select: `IELTS_Platform_API.postman_collection.json`

2. **Import Environment:**
   - Import: `IELTS_Platform_Local.postman_environment.json`
   - Set as active environment

3. **Test Critical Flows:**
   - Auth → Login
   - Exercise → Start → Submit Answers (with time_spent)
   - Exercise → Submit Exercise (Writing)
   - Storage → Upload Audio
   - User → Get Achievements

4. **Verify:**
   - All requests return 200/201
   - Time tracking works correctly
   - Achievements unlock
   - Storage upload works

---

## 📝 Changelog

### v2.0.0 (2025-11-08)
- ✅ Fixed: Submit Answers body (added time_spent_seconds)
- ✅ Added: Submit Exercise endpoint (POST /submit)
- ✅ Removed: Complete Submission (deprecated endpoint)
- ✅ Added: Storage Service folder (5 endpoints)
- ✅ Added: User Service → Internal APIs (3 endpoints)
- ✅ Updated: Descriptions and comments
- ✅ Improved: Test scripts

---

**Status:** ✅ READY FOR TESTING
**Next:** Import và test trong Postman


