#!/bin/bash

# Test admin permissions - admin should be able to do admin/instructor actions

ADMIN_TOKEN=$(cat /tmp/admin_token.txt)
API_BASE="http://localhost:8080/api/v1"

echo "========================================"
echo "TESTING ADMIN PERMISSIONS"
echo "========================================"
echo ""

# Test 1: Get all courses (public - should work)
echo "1. GET all courses (public):"
curl -s -w "\nHTTP: %{http_code}\n" -X GET "$API_BASE/courses?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r 'if .success then "✓ SUCCESS" else .error.message end' 2>/dev/null
echo ""

# Test 2: Get all exercises (public - should work)
echo "2. GET all exercises (public):"
curl -s -w "\nHTTP: %{http_code}\n" -X GET "$API_BASE/exercises?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r 'if .success then "✓ SUCCESS" else .error.message end' 2>/dev/null
echo ""

# Test 3: Create course (admin/instructor - should work)
echo "3. POST create course (admin/instructor only):"
curl -s -w "\nHTTP: %{http_code}\n" -X POST "$API_BASE/admin/courses" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test Course",
    "description": "Testing admin can create",
    "level": "Intermediate",
    "category": "Speaking",
    "instructor_id": "admin-test"
  }' | jq -r 'if .success then "✓ SUCCESS - Course created" else .error.message end' 2>/dev/null
echo ""

# Test 4: Update course (admin/instructor - should work)
echo "4. PUT update course (admin/instructor only):"
curl -s -w "\nHTTP: %{http_code}\n" -X PUT "$API_BASE/admin/courses/10000001-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated by Admin",
    "description": "Admin can update"
  }' | jq -r 'if .success then "✓ SUCCESS - Course updated" else .error.message end' 2>/dev/null
echo ""

# Test 5: Delete course (admin only - should work)
echo "5. DELETE course (admin only):"
curl -s -w "\nHTTP: %{http_code}\n" -X DELETE "$API_BASE/admin/courses/10000001-0000-0000-0000-000000000099" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r 'if .success then "✓ SUCCESS - Course deleted" else .error.message end' 2>/dev/null
echo ""

# Test 6: Create exercise (admin/instructor - should work)
echo "6. POST create exercise (admin/instructor only):"
curl -s -w "\nHTTP: %{http_code}\n" -X POST "$API_BASE/admin/exercises" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Admin Test Exercise",
    "description": "Testing admin can create",
    "type": "speaking",
    "difficulty": "intermediate",
    "time_limit": 600
  }' | jq -r 'if .success then "✓ SUCCESS - Exercise created" else .error.message end' 2>/dev/null
echo ""

# Test 7: Update exercise (admin/instructor - should work)
echo "7. PUT update exercise (admin/instructor only):"
curl -s -w "\nHTTP: %{http_code}\n" -X PUT "$API_BASE/admin/exercises/20000001-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated by Admin",
    "description": "Admin can update"
  }' | jq -r 'if .success then "✓ SUCCESS - Exercise updated" else .error.message end' 2>/dev/null
echo ""

# Test 8: Delete exercise (admin only - should work)
echo "8. DELETE exercise (admin only):"
curl -s -w "\nHTTP: %{http_code}\n" -X DELETE "$API_BASE/admin/exercises/20000001-0000-0000-0000-000000000099" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r 'if .success then "✓ SUCCESS - Exercise deleted" else .error.message end' 2>/dev/null
echo ""

# Test 9: Get all users (admin only - should work)
echo "9. GET all users (admin only):"
curl -s -w "\nHTTP: %{http_code}\n" -X GET "$API_BASE/admin/users?page=1&limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r 'if .success then "✓ SUCCESS - Users retrieved" else .error.message end' 2>/dev/null
echo ""

# Test 10: Get student progress (admin - should work)
echo "10. GET student progress (admin only):"
curl -s -w "\nHTTP: %{http_code}\n" -X GET "$API_BASE/admin/progress/student-test-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r 'if .success then "✓ SUCCESS - Progress retrieved" else .error.message end' 2>/dev/null
echo ""

echo "========================================"
echo "TEST COMPLETE"
echo "========================================"
