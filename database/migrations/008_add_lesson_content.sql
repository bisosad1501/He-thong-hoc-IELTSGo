-- Migration: Add content field to lessons table for article/text lessons
-- Date: 2026-01-08

-- Add content column for storing article/text content
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT;

-- Create index for full-text search on content
CREATE INDEX IF NOT EXISTS idx_lessons_content_search ON lessons USING gin (to_tsvector('english', content));

-- Comment
COMMENT ON COLUMN lessons.content IS 'Full content for article/text type lessons (HTML/Markdown supported)';
