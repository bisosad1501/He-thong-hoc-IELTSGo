-- ============================================
-- FIX: Writing/Speaking exercises should have total_questions = 0
-- ============================================
-- Issue: Writing/Speaking exercises don't have multiple choice questions
-- but were incorrectly set to have total_questions = 4
-- This causes frontend to display "0/4 questions" which is confusing

\echo '→ Fixing Writing/Speaking exercises total_questions...'

-- Update exercises table
UPDATE exercises 
SET 
    total_questions = 0,
    total_sections = 0
WHERE skill_type IN ('writing', 'speaking');

-- Update existing submissions for Writing/Speaking
UPDATE user_exercise_attempts 
SET total_questions = 0
WHERE exercise_id IN (
    SELECT id FROM exercises WHERE skill_type IN ('writing', 'speaking')
);

-- Verify the fix
SELECT 
    skill_type,
    COUNT(*) as exercise_count,
    SUM(CASE WHEN total_questions = 0 THEN 1 ELSE 0 END) as fixed_count,
    SUM(CASE WHEN total_questions > 0 THEN 1 ELSE 0 END) as still_wrong_count
FROM exercises
WHERE skill_type IN ('writing', 'speaking')
GROUP BY skill_type;

\echo '✓ Writing/Speaking exercises total_questions fixed'
