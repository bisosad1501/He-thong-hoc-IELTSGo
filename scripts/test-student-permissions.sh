#!/bin/bash

# Test student permissions - student should be able to do student actions

API_BASE="http://localhost:8080/api/v1"

echo "========================================"
echo "STUDENT PERMISSIONS TEST"
echo "========================================"
echo ""

# Login as student
echo "Logging in as student..."
STUDENT_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anh.tran@example.com",
    "password": "password123"
  }')

STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | jq -r '.data.access_token')

if [ "$STUDENT_TOKEN" = "null" ] || [ -z "$STUDENT_TOKEN" ]; then
  echo "Failed to login as student"
  echo "$STUDENT_LOGIN" | jq '.'
  exit 1
fi

echo "✓ Student logged in successfully"
echo "Token: ${STUDENT_TOKEN:0:50}..."
echo ""

# Test 1: Enroll in course (should work)
echo "1. POST enroll in course (student action):"
curl -s -X POST "$API_BASE/enrollments" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"course_id":"c5000013-0000-0000-0000-000000000013"}' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 2: Start exercise (should work)
echo "2. POST start exercise (student action):"
curl -s -X POST "$API_BASE/exercises/e4000060-0000-0000-0000-000000000060/start" \
  -H "Authorization: Bearer $STUDENT_TOKEN" > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 3: Submit exercise (should work)
echo "3. POST submit exercise (student action):"
curl -s -X POST "$API_BASE/submissions" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_id": "e4000060-0000-0000-0000-000000000060",
    "answers": [{"question_id": "test", "answer": "test"}]
  }' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 4: Track video progress (should work)
echo "4. POST track video (student action):"
curl -s -X POST "$API_BASE/videos/track" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "video_id": "e0197511-0861-496d-b30f-2ebe114553b8",
    "progress_seconds": 10
  }' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 5: Post review (should work)
echo "5. POST review (student action):"
curl -s -X POST "$API_BASE/courses/c5000013-0000-0000-0000-000000000013/reviews" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Great course!"}' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 6: Try to create course (should fail)
echo "6. POST create course (admin/instructor only - should FAIL):"
curl -s -X POST "$API_BASE/admin/courses" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Student Test Course",
    "slug": "student-test",
    "skill_type": "speaking",
    "level": "intermediate",
    "enrollment_type": "free",
    "price": 0,
    "currency": "USD"
  }' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

echo "========================================"
echo "SUMMARY"
echo "========================================"
echo "Student should be able to:"
echo "  ✓ Enroll in courses"
echo "  ✓ Start exercises"
echo "  ✓ Submit exercises"
echo "  ✓ Track video progress"
echo "  ✓ Post reviews"
echo ""
echo "Student should NOT be able to:"
echo "  ✗ Create/update/delete courses (admin/instructor only)"
echo "  ✗ Create/update/delete exercises (admin/instructor only)"
echo ""
