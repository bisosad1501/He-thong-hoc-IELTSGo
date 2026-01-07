#!/bin/bash

# Test admin permissions - fixed for macOS

ADMIN_TOKEN=$(cat /tmp/admin_token.txt)
API_BASE="http://localhost:8080/api/v1"

echo "========================================"
echo "ADMIN PERMISSIONS TEST"
echo "========================================"
echo ""

# Test 1: Get all users
echo "1. GET all users (admin only):"
echo "Note: User management endpoint not implemented yet, skipping..."
echo ""

# Test 2: Create course
echo "2. POST create course (admin/instructor only):"
curl -s -X POST "$API_BASE/admin/courses" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test Course",
    "slug": "admin-test-course-'$(date +%s)'",
    "description": "Testing admin can create",
    "skill_type": "speaking",
    "level": "intermediate",
    "enrollment_type": "free",
    "price": 0,
    "currency": "USD"
  }' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 3: Update course
echo "3. PUT update course (admin/instructor only):"
curl -s -X PUT "$API_BASE/admin/courses/c5000013-0000-0000-0000-000000000013" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated by Admin Test"}' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 4: Get course by ID
echo "4. GET course by ID (public):"
curl -s -X GET "$API_BASE/courses/c5000013-0000-0000-0000-000000000013" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.data.title // .error // .'
echo ""

# Test 5: Create exercise
echo "5. POST create exercise (admin/instructor only):"
curl -s -X POST "$API_BASE/admin/exercises" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test Exercise",
    "slug": "admin-test-exercise-'$(date +%s)'",
    "description": "Testing admin can create exercise",
    "skill_type": "speaking",
    "exercise_type": "practice",
    "difficulty": "intermediate",
    "time_limit_minutes": 10
  }' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 6: Update exercise
echo "6. PUT update exercise (admin/instructor only):"
curl -s -X PUT "$API_BASE/admin/exercises/e4000060-0000-0000-0000-000000000060" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated by Admin Test"}' > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.'
echo ""

# Test 7: Get exercise by ID
echo "7. GET exercise by ID (public):"
curl -s -X GET "$API_BASE/exercises/e4000060-0000-0000-0000-000000000060" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.data.title // .error // .'
echo ""

# Test 8: Get all courses
echo "8. GET all courses (public):"
curl -s -X GET "$API_BASE/courses?page=1&limit=3" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.data.courses[0].title // .error // .'
echo ""

# Test 9: Get all exercises
echo "9. GET all exercises (public):"
curl -s -X GET "$API_BASE/exercises?page=1&limit=3" \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /tmp/test_result.json
echo "Response:"
cat /tmp/test_result.json | jq '.data.exercises[0].title // .error // .'
echo ""

echo "========================================"
echo "TEST COMPLETE"
echo "========================================"
