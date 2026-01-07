#!/bin/bash
# ============================================
# CLEAN AND SEED ALL DATA
# ============================================
# Purpose: Clean all data and seed fresh data automatically
# Usage: ./database/seed_complete_data/clean-and-seed.sh
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database connection settings
# Default to Docker container credentials
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-ielts_admin}"
DB_PASSWORD="${DB_PASSWORD:-ielts_password_2025}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}CLEAN AND SEED ALL DATA${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "Using Docker container: ielts_postgres"
echo ""

# Check if Docker container is running
if ! docker ps | grep -q ielts_postgres; then
    echo -e "${RED}✗ Docker container ielts_postgres is not running${NC}"
    echo "Please start it with: docker-compose up -d postgres"
    exit 1
fi
echo -e "${GREEN}✓ Docker container is running${NC}"
echo ""

# Auto-confirm cleanup
echo -e "${RED}⚠️  WARNING: This will DELETE ALL existing data!${NC}"
echo -e "${YELLOW}Starting cleanup...${NC}"
echo ""

# Function to execute SQL via Docker
execute_sql() {
    local db_name=$1
    local sql=$2
    docker-compose exec -T postgres psql -U ielts_admin -d "$db_name" -c "$sql" 2>&1 | grep -v "NOTICE" | grep -v "does not exist" || true
}

# Function to run SQL file via Docker
run_sql_file_docker() {
    local db_name=$1
    local file_path=$2
    local description=$3
    
    echo -e "${YELLOW}→ Seeding ${description}...${NC}"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}✗ File not found: $file_path${NC}"
        return 1
    fi
    
    # Copy file to container and run
    docker cp "$file_path" ielts_postgres:/tmp/seed_file.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d "$db_name" -f /tmp/seed_file.sql 2>&1 | grep -v "NOTICE" | grep -v "already exists" || true
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✓ ${description} seeded successfully${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Some warnings in ${description}${NC}"
        return 0
    fi
}

# Clean all databases
echo -e "${YELLOW}Cleaning notification_db...${NC}"
execute_sql "notification_db" "TRUNCATE TABLE email_notifications, push_notifications, device_tokens, notification_logs, scheduled_notifications, notifications, notification_preferences CASCADE;" 2>/dev/null || echo "  (some tables may not exist yet)"
echo -e "${GREEN}✓ notification_db cleaned${NC}"

echo -e "${YELLOW}Cleaning ai_db...${NC}"
execute_sql "ai_db" "TRUNCATE TABLE speaking_evaluations, writing_evaluations, ai_processing_queue, evaluation_feedback_ratings, speaking_submissions, writing_submissions, speaking_prompts, writing_prompts CASCADE;" 2>/dev/null || echo "  (some tables may not exist yet)"
echo -e "${GREEN}✓ ai_db cleaned${NC}"

echo -e "${YELLOW}Cleaning exercise_db...${NC}"
execute_sql "exercise_db" "TRUNCATE TABLE user_answers, user_exercise_attempts, exercise_analytics, exercise_tag_mapping, question_bank, question_answers, question_options, questions, exercise_sections, exercises CASCADE;" 2>/dev/null || echo "  (some tables may not exist yet)"
echo -e "${GREEN}✓ exercise_db cleaned${NC}"

echo -e "${YELLOW}Cleaning course_db...${NC}"
execute_sql "course_db" "TRUNCATE TABLE video_watch_history, course_reviews, lesson_progress, course_enrollments, course_category_mapping, video_subtitles, lesson_materials, lesson_videos, lessons, modules, courses CASCADE;" 2>/dev/null || echo "  (some tables may not exist yet)"
echo -e "${GREEN}✓ course_db cleaned${NC}"

echo -e "${YELLOW}Cleaning user_db...${NC}"
execute_sql "user_db" "TRUNCATE TABLE study_reminders, user_preferences, user_achievements, study_goals, study_sessions, official_test_results, practice_activities, skill_statistics, learning_progress, user_profiles CASCADE;" 2>/dev/null || echo "  (some tables may not exist yet)"
echo -e "${GREEN}✓ user_db cleaned${NC}"

echo -e "${YELLOW}Cleaning auth_db...${NC}"
execute_sql "auth_db" "TRUNCATE TABLE audit_logs, email_verification_tokens, password_reset_tokens, refresh_tokens, user_roles CASCADE;" 2>/dev/null || echo "  (some tables may not exist yet)"
execute_sql "auth_db" "TRUNCATE TABLE users CASCADE;" 2>/dev/null || echo "  (users table may not exist yet)"
echo -e "${GREEN}✓ auth_db cleaned${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ ALL DATA CLEANED!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ============================================
# RECREATE SCHEMA FROM SCHEMA FILES
# ============================================
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}RECREATING DATABASE SCHEMAS...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

SCHEMA_DIR="$(dirname "$SCRIPT_DIR")/schemas"

if [ -d "$SCHEMA_DIR" ]; then
    echo -e "${YELLOW}→ Recreating auth_db schema...${NC}"
    docker cp "$SCHEMA_DIR/01_auth_service.sql" ielts_postgres:/tmp/schema.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d auth_db -f /tmp/schema.sql > /dev/null 2>&1 || echo -e "${YELLOW}  (schema may already exist)${NC}"
    echo -e "${GREEN}✓ auth_db schema ready${NC}"
    
    echo -e "${YELLOW}→ Recreating user_db schema...${NC}"
    docker cp "$SCHEMA_DIR/02_user_service.sql" ielts_postgres:/tmp/schema.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d user_db -f /tmp/schema.sql > /dev/null 2>&1 || echo -e "${YELLOW}  (schema may already exist)${NC}"
    echo -e "${GREEN}✓ user_db schema ready${NC}"
    
    echo -e "${YELLOW}→ Recreating course_db schema...${NC}"
    docker cp "$SCHEMA_DIR/03_course_service.sql" ielts_postgres:/tmp/schema.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d course_db -f /tmp/schema.sql > /dev/null 2>&1 || echo -e "${YELLOW}  (schema may already exist)${NC}"
    echo -e "${GREEN}✓ course_db schema ready${NC}"
    
    echo -e "${YELLOW}→ Recreating exercise_db schema...${NC}"
    docker cp "$SCHEMA_DIR/04_exercise_service.sql" ielts_postgres:/tmp/schema.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d exercise_db -f /tmp/schema.sql > /dev/null 2>&1 || echo -e "${YELLOW}  (schema may already exist)${NC}"
    echo -e "${GREEN}✓ exercise_db schema ready${NC}"
    
    echo -e "${YELLOW}→ Recreating ai_db schema...${NC}"
    docker cp "$SCHEMA_DIR/05_ai_service.sql" ielts_postgres:/tmp/schema.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d ai_db -f /tmp/schema.sql > /dev/null 2>&1 || echo -e "${YELLOW}  (schema may already exist)${NC}"
    echo -e "${GREEN}✓ ai_db schema ready${NC}"
    
    echo -e "${YELLOW}→ Recreating notification_db schema...${NC}"
    docker cp "$SCHEMA_DIR/06_notification_service.sql" ielts_postgres:/tmp/schema.sql > /dev/null 2>&1
    docker-compose exec -T postgres psql -U ielts_admin -d notification_db -f /tmp/schema.sql > /dev/null 2>&1 || echo -e "${YELLOW}  (schema may already exist)${NC}"
    echo -e "${GREEN}✓ notification_db schema ready${NC}"
    
    echo ""
    echo -e "${GREEN}✅ All database schemas ready!${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠ Schema directory not found: $SCHEMA_DIR${NC}"
    echo -e "${YELLOW}  Assuming schemas already exist...${NC}"
    echo ""
fi

# Fetch YouTube video durations before seeding
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}FETCHING YOUTUBE VIDEO DURATIONS...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Update video IDs from url_yt.txt if file exists
if [ -f "$SCRIPT_DIR/url_yt.txt" ]; then
    echo -e "${YELLOW}→ Updating video IDs from url_yt.txt...${NC}"
    if python3 "$SCRIPT_DIR/update_video_ids.py" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Video IDs updated from url_yt.txt${NC}"
    else
        echo -e "${YELLOW}⚠ Failed to update video IDs (continuing with existing IDs)${NC}"
    fi
    echo ""
fi

# Check if YOUTUBE_API_KEY is available
if [ -z "$YOUTUBE_API_KEY" ]; then
    # Try to load from .env file in project root
    if [ -f "$SCRIPT_DIR/../../.env" ]; then
        # Extract YOUTUBE_API_KEY from .env file
        YOUTUBE_API_KEY=$(grep -v '^#' "$SCRIPT_DIR/../../.env" | grep "^YOUTUBE_API_KEY=" | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
    fi
    
    # Try to get from docker-compose environment if still not found
    if [ -z "$YOUTUBE_API_KEY" ] && [ -f "$SCRIPT_DIR/../../docker-compose.yml" ]; then
        # Extract from docker-compose.yml if course-service has it
        YOUTUBE_API_KEY=$(grep -A 30 "course-service:" "$SCRIPT_DIR/../../docker-compose.yml" | grep "YOUTUBE_API_KEY" | sed 's/.*YOUTUBE_API_KEY=\${YOUTUBE_API_KEY:-\(.*\)}/\1/' | tr -d ':-}' | xargs)
    fi
fi

if [ -n "$YOUTUBE_API_KEY" ]; then
    echo -e "${GREEN}✓ YouTube API key found${NC}"
    
    # Check if cache file exists and has data
    if [ -f "$SCRIPT_DIR/youtube_durations.json" ]; then
        CACHED_COUNT=$(python3 -c "import json; f=open('$SCRIPT_DIR/youtube_durations.json'); print(len(json.load(f)))" 2>/dev/null || echo "0")
        if [ "$CACHED_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ Found $CACHED_COUNT cached durations${NC}"
            echo -e "${YELLOW}→ Fetching durations (will reuse cache to save API quota)...${NC}"
        else
            echo -e "${YELLOW}→ Fetching durations from YouTube API...${NC}"
        fi
    else
        echo -e "${YELLOW}→ Fetching durations from YouTube API...${NC}"
    fi
    
    # Export API key for Python script
    export YOUTUBE_API_KEY
    
    # Run Python script to fetch durations (will reuse cache)
    if python3 "$SCRIPT_DIR/fetch_youtube_durations.py" 2>&1 | tee /tmp/youtube_fetch.log; then
        echo -e "${GREEN}✓ Video durations ready${NC}"
        
        # Check if mapping file was created
        if [ -f "$SCRIPT_DIR/youtube_durations.json" ]; then
            VIDEO_COUNT=$(python3 -c "import json; f=open('$SCRIPT_DIR/youtube_durations.json'); print(len(json.load(f)))" 2>/dev/null || echo "0")
            echo -e "${GREEN}✓ Generated mapping for $VIDEO_COUNT videos${NC}"
            
            # Update seed files with fetched durations (only if not already updated)
            # Note: Seed files may already have durations hardcoded, so this is optional
            if [ -f "$SCRIPT_DIR/youtube_durations.json" ]; then
                echo -e "${YELLOW}→ Updating seed files with accurate durations...${NC}"
                UPDATE_OUTPUT=$(python3 "$SCRIPT_DIR/update_seed_with_durations.py" 2>&1)
                if echo "$UPDATE_OUTPUT" | grep -q "Updated.*seed file"; then
                    echo -e "${GREEN}✓ Seed files updated with accurate durations${NC}"
                else
                    echo -e "${GREEN}✓ Seed files already have durations (skipped update)${NC}"
                fi
            fi
        fi
    else
        echo -e "${YELLOW}⚠ Failed to fetch durations (continuing with default durations)${NC}"
        echo -e "${YELLOW}  Check /tmp/youtube_fetch.log for details${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}⚠ YOUTUBE_API_KEY not found - using default durations${NC}"
    echo -e "${YELLOW}  Set YOUTUBE_API_KEY in .env file or environment to fetch accurate durations${NC}"
    echo ""
fi

# Run seed script with Docker
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}SEEDING NEW DATA...${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Seed files in order
SEED_DIR="$SCRIPT_DIR"

echo -e "${GREEN}PHASE 1: AUTH_DB - USERS & ROLES${NC}"
run_sql_file_docker "auth_db" "$SEED_DIR/01_auth_users.sql" "Users and Roles"
echo ""

echo -e "${GREEN}PHASE 2.5: COURSE_DB - COURSES STRUCTURE${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/03_courses.sql" "Courses, Modules, Lessons, and Videos"
echo ""

echo -e "${GREEN}PHASE 2: USER_DB - PROFILES & PROGRESS${NC}"
run_sql_file_docker "user_db" "$SEED_DIR/02_user_profiles.sql" "User Profiles and Progress"
run_sql_file_docker "user_db" "$SEED_DIR/02_learning_progress_FIXED.sql" "Learning Progress (Band Score Validation)"
echo ""

echo -e "${GREEN}PHASE 2B: USER_DB - OFFICIAL TEST RESULTS${NC}"
run_sql_file_docker "user_db" "$SEED_DIR/02b_official_test_results.sql" "Official Test Results (Per-Skill Model)"
echo ""

echo -e "${GREEN}PHASE 3: COURSE_DB - USER ACTIVITIES${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/04_course_activities.sql" "Course Enrollments, Progress, Reviews"
echo ""

echo -e "${GREEN}PHASE 4: EXERCISE_DB - EXERCISES${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/03_exercises.sql" "Exercises, Questions, and User Attempts"
run_sql_file_docker "exercise_db" "$SEED_DIR/03_exercises_FIXED.sql" "Writing & Speaking Exercises (Schema Compliant)"
run_sql_file_docker "exercise_db" "$SEED_DIR/03_exercises_enhanced.sql" "Enhanced Realistic Questions"
echo ""

echo -e "${GREEN}PHASE 5: AI_DB - WRITING & SPEAKING${NC}"
run_sql_file_docker "ai_db" "$SEED_DIR/05_ai_submissions.sql" "Writing and Speaking Submissions"
echo ""

echo -e "${GREEN}PHASE 6: NOTIFICATION_DB - NOTIFICATIONS${NC}"
run_sql_file_docker "notification_db" "$SEED_DIR/06_notifications.sql" "Notifications and Preferences"
echo ""

echo -e "${GREEN}PHASE 7: MISSING TABLES${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/07_missing_tables.sql" "Question Bank"
run_sql_file_docker "ai_db" "$SEED_DIR/07b_evaluation_feedback.sql" "Evaluation Feedback Ratings"
echo ""

echo -e "${GREEN}PHASE 8: ADDITIONAL MISSING TABLES & RELATIONSHIPS${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/08a_course_additional.sql" "Video Subtitles, Lesson Materials"
run_sql_file_docker "exercise_db" "$SEED_DIR/08b_exercise_additional.sql" "Exercise Tag Mapping, Exercise Analytics"
run_sql_file_docker "notification_db" "$SEED_DIR/08c_notification_additional.sql" "Scheduled Notifications"
echo ""

echo -e "${GREEN}PHASE 9: ENHANCED REALISTIC DATA${NC}"
run_sql_file_docker "user_db" "$SEED_DIR/09_enhanced_data_simple.sql" "User Follows, Study Sessions, Goals"
echo ""

echo -e "${GREEN}PHASE 10: FIX DATA TIMELINE & LOGIC${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/FIX_DATA_TIMELINE.sql" "Ensure Logical Flow & Timeline Consistency"
echo ""

echo -e "${GREEN}PHASE 11: VALIDATE DATA INTEGRITY${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/VALIDATE_DATA_INTEGRITY.sql" "Validate All Data Relationships"
echo ""

echo -e "${GREEN}PHASE 12: FILL MISSING FIELDS${NC}"
run_sql_file_docker "user_db" "$SEED_DIR/13_fill_missing_fields.sql" "Populate Empty Metadata Fields"
echo ""

echo -e "${GREEN}PHASE 13: FIX COURSE PROGRESS LOGIC${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/14_fix_course_progress.sql" "Reset Enrollment Progress (Real-Time Calculation)"
echo ""

echo -e "${GREEN}PHASE 14: FIX VIDEO RESUME POSITION${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/15_fix_lesson_position.sql" "Calculate Last Position for Video Resume"
echo ""

echo -e "${GREEN}PHASE 15: FIX EXERCISE SYNC STATUS${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/16_fix_exercise_sync.sql" "Mark Completed Exercises as Synced"
echo ""

echo -e "${GREEN}PHASE 16: FIX DATA LOGIC ISSUES${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/17_fix_data_logic.sql" "Fix Writing/Speaking Scores, Streaks, Access Times"
echo ""

echo -e "${GREEN}PHASE 17: COMPREHENSIVE VALIDATION${NC}"
run_sql_file_docker "course_db" "$SEED_DIR/COMPREHENSIVE_VALIDATION.sql" "Validate All Data Logic"
echo ""

echo -e "${GREEN}PHASE 18: PRACTICE ACTIVITIES${NC}"
echo "Running practice activities seeding script..."
bash "$SEED_DIR/18_practice_activities.sh"
echo ""

echo -e "${GREEN}PHASE 19: DATA COMPLETENESS & OPTIMIZATION (NEW)${NC}"
echo -e "${YELLOW}→ Adding more realistic IELTS exercises...${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/25_add_more_exercises.sql" "Additional Writing & Speaking Exercises (Part 1)"
run_sql_file_docker "exercise_db" "$SEED_DIR/26_complete_exercise_coverage.sql" "Complete Exercise Coverage (Part 2)"
echo ""

echo -e "${YELLOW}→ Adding Writing/Speaking evaluation criteria...${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/20_writing_speaking_questions.sql" "Writing & Speaking Evaluation Criteria"
echo ""

echo -e "${YELLOW}→ Syncing exercise attempts to user service...${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/21_sync_attempts_to_user_service.sql" "Sync Attempts to User Service"
echo ""

echo -e "${YELLOW}→ Adding cross-database validation triggers...${NC}"
run_sql_file_docker "auth_db" "$SEED_DIR/22_add_cross_db_validation.sql" "Cross-Database Validation Triggers"
echo ""

echo -e "${YELLOW}→ Fixing timestamp logic issues...${NC}"
run_sql_file_docker "auth_db" "$SEED_DIR/23_fix_timestamps.sql" "Fix Timestamp Logic"
echo ""

echo -e "${YELLOW}→ Adding performance indexes...${NC}"
run_sql_file_docker "auth_db" "$SEED_DIR/24_add_performance_indexes.sql" "Performance Indexes"
echo ""

echo -e "${YELLOW}→ Adding timestamp validation constraints (FINAL STEP)...${NC}"
run_sql_file_docker "auth_db" "$SEED_DIR/27_add_timestamp_constraints.sql" "Timestamp Validation Constraints"
echo ""

echo -e "${YELLOW}→ Fixing Writing/Speaking exercises total_questions...${NC}"
run_sql_file_docker "exercise_db" "$SEED_DIR/99_fix_writing_speaking_questions.sql" "Fix Writing/Speaking Questions Count"
echo ""

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ COMPLETE!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Phase 1-18: Core data seeded"
echo -e "  ${GREEN}✓${NC} Phase 19: Data completeness & optimization"
echo -e "  ${GREEN}✓${NC} Writing/Speaking evaluation criteria added"
echo -e "  ${GREEN}✓${NC} Exercise attempts synced to user service"
echo -e "  ${GREEN}✓${NC} Cross-database validation enabled"
echo -e "  ${GREEN}✓${NC} Timestamps fixed and validated"
echo -e "  ${GREEN}✓${NC} Performance indexes created"
echo -e "  ${GREEN}✓${NC} Writing/Speaking questions count fixed"
echo ""
echo -e "${YELLOW}📖 For detailed analysis, see: database/seed_complete_data/VALIDATION_REPORT.md${NC}"
echo ""


