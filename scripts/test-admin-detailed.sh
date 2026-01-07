#!/bin/bash

# Test admin permissions with detailed output

ADMIN_TOKEN=$(cat /tmp/admin_token.txt)
API_BASE="http://localhost:8080/api/v1"

echo "========================================"
echo "DETAILED ADMIN PERMISSIONS TEST"
echo "========================================"
echo ""

# Test 1: Get all users (admin only)
echo "1. GET all users (admin only):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/admin/users?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 2: Create course (admin/instructor)
echo "2. POST create course (admin/instructor only):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/admin/courses" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test Course",
    "description": "Testing admin can create",
    "level": "intermediate",
    "category": "speaking"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 3: Update course (admin/instructor)
echo "3. PUT update course (admin/instructor only):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/admin/courses/10000001-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated by Admin Test"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 4: Create exercise (admin/instructor)
echo "4. POST create exercise (admin/instructor only):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/admin/exercises" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test Exercise",
    "description": "Testing",
    "type": "speaking",
    "difficulty": "intermediate",
    "time_limit": 600,
    "max_score": 100
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 5: Update exercise
echo "5. PUT update exercise (admin/instructor only):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/admin/exercises/20000001-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Exercise by Admin"
  }')
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Test 6: Get course by ID (public)
echo "6. GET course by ID (public):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/courses/10000001-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.data.title // .error.message' 2>/dev/null
echo ""

# Test 7: Get exercise by ID (public)
echo "7. GET exercise by ID (public):"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/exercises/20000001-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq '.data.title // .error.message' 2>/dev/null
echo ""

echo "========================================"
echo "SUMMARY"
echo "========================================"
echo "Admin should be able to:"
echo "  ✓ GET public resources (courses, exercises)"
echo "  ✓ CREATE courses/exercises (manage_courses, manage_exercises)"
echo "  ✓ UPDATE courses/exercises (manage_courses, manage_exercises)"
echo "  ✓ DELETE courses/exercises (manage_courses, manage_exercises)"
echo "  ✓ GET all users (manage_users)"
echo "  ✓ GET student progress (view_student_progress)"
echo ""
