-- Migration: Update question_answers table to match current code
-- Date: 2026-01-08

BEGIN;

-- Rename answer_variations to alternative_answers and change to TEXT (JSON string)
ALTER TABLE question_answers 
    DROP COLUMN IF EXISTS answer_variations CASCADE;

-- Add alternative_answers as TEXT for JSON storage
ALTER TABLE question_answers 
    ADD COLUMN IF NOT EXISTS alternative_answers TEXT;

-- Add is_case_sensitive column
ALTER TABLE question_answers 
    ADD COLUMN IF NOT EXISTS is_case_sensitive BOOLEAN DEFAULT false;

-- Add matching_order column  
ALTER TABLE question_answers 
    ADD COLUMN IF NOT EXISTS matching_order INTEGER;

-- Drop unused columns
ALTER TABLE question_answers 
    DROP COLUMN IF EXISTS match_left CASCADE,
    DROP COLUMN IF EXISTS match_right CASCADE,
    DROP COLUMN IF EXISTS is_primary_answer CASCADE;

COMMIT;
