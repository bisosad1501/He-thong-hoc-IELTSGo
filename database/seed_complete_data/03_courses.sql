-- Real YouTube video IDs (120 videos, can be reused)
-- Format: https://www.youtube.com/watch?v=[VIDEO_ID]
-- These videos are real and available
-- Video IDs: 120 unique YouTube video IDs randomly distributed across lessons
-- Purpose: Create diverse and detailed courses with modules, lessons, and videos
-- Database: course_db
-- 
-- Creates:
-- - Courses (30+ diverse courses)
-- - Modules (3-6 modules per course)
-- - Lessons (4-8 lessons per module)
-- - Lesson videos (for video lessons)
-- - Course category mappings
-- ============================================

-- ============================================
-- 1. COURSES
-- ============================================
-- Note: instructor_id references users from auth_db (instructors: b0000001 to b0000015)

INSERT INTO courses (
    id, title, slug, description, short_description, skill_type, level, target_band_score,
    thumbnail_url, preview_video_url, instructor_id, instructor_name, duration_hours,
    total_lessons, total_videos, enrollment_type, price, currency, status,
    is_featured, is_recommended, meta_title, meta_description, meta_keywords,
    published_at, created_at
) VALUES
-- ============================================
-- LISTENING COURSES (10 courses)
-- ============================================
-- Beginner Listening Courses
('c1000001-0000-0000-0000-000000000001'::uuid,
 'IELTS Listening Basics - Complete Guide',
 'ielts-listening-basics-complete-guide',
 'Master IELTS Listening from scratch with this comprehensive, step-by-step course designed specifically for beginners. This course provides a solid foundation in IELTS Listening skills through structured lessons covering all four parts of the test. You''ll learn essential techniques including prediction strategies, key word identification, and effective note-taking methods. Practice with authentic IELTS audio materials featuring British, American, Australian, and Canadian accents. The course includes detailed explanations for common question types such as form completion, multiple choice, matching, and map labeling. Each lesson is carefully designed to build your confidence gradually, starting with Part 1 conversations and progressing to more complex academic lectures. By the end of this course, you''ll have mastered fundamental listening skills, improved your ability to understand native speakers, and be well-prepared to achieve Band 5.5-6.0 in your IELTS Listening test. The course includes 12 comprehensive lessons, 10 video tutorials, 15+ practice exercises, downloadable transcripts, and detailed answer explanations.',
 'Complete beginner-friendly IELTS Listening course covering all parts with real practice materials',
 'listening', 'beginner', 6.0,
 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=6QMu7-3DMi0',
 'b0000002-0000-0000-0000-000000000002'::uuid,
 'James Anderson', 4.0, 12, 10,
 'free', 0, 'VND', 'published',
 false, true,
 'IELTS Listening Basics Course - Complete Guide for Beginners | Band 5.5-6.0',
 'Master IELTS Listening from scratch. Learn fundamental techniques, common question types, and practice with real IELTS audio materials. Perfect for beginners.',
 'IELTS Listening, IELTS Beginner, IELTS Course, Listening Practice, Band 5.5, Band 6.0, IELTS Preparation',
 NOW() - INTERVAL '170 days', NOW() - INTERVAL '190 days'),

-- Intermediate Listening Courses
('c1000003-0000-0000-0000-000000000003'::uuid,
 'IELTS Listening Advanced - Parts 3 & 4',
 'ielts-listening-advanced-parts-3-4',
 'Master the most challenging parts of IELTS Listening with this advanced course focused on Parts 3 and 4. Designed for students already comfortable with basic listening skills and targeting Band 7.0+, this course dives deep into academic conversations and lectures that are notoriously difficult for most test-takers. You''ll develop advanced strategies for handling complex vocabulary, understanding academic discourse, following multi-speaker discussions, and managing the increased difficulty level. The course covers critical skills such as identifying speaker attitudes and opinions, understanding academic terminology, recognizing organizational patterns in lectures, and extracting specific information from dense academic content. Practice with authentic university-level materials including student-tutor discussions, research presentations, and academic seminars. Each module includes targeted exercises focusing on specific challenge areas, detailed analysis of common mistakes, and proven techniques for maximizing your score in these demanding sections. The comprehensive curriculum includes 28 in-depth lessons, 22 video tutorials, 25+ challenging practice exercises, advanced vocabulary lists, and detailed feedback on performance.',
 'Advanced techniques and strategies for mastering Parts 3 & 4 of IELTS Listening',
 'listening', 'intermediate', 7.0,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=RyTdIYMrcKY',
 'b0000003-0000-0000-0000-000000000003'::uuid,
 'Emma Thompson', 10.0, 28, 22,
 'premium', 499000, 'VND', 'published',
 true, false,
 'IELTS Listening Advanced Course - Parts 3 & 4 Mastery | Band 7.0+',
 'Advanced strategies for the most challenging parts of IELTS Listening. Perfect for students aiming for Band 7.0+. Includes academic conversations and lectures.',
 'IELTS Listening Advanced, IELTS Parts 3 & 4, IELTS Listening Practice, Band 7.0, Academic Listening, IELTS Preparation',
 NOW() - INTERVAL '160 days', NOW() - INTERVAL '180 days'),

('c1000004-0000-0000-0000-000000000004'::uuid,
 'IELTS Listening Full Test Practice',
 'ielts-listening-full-test-practice',
 'Perfect your IELTS Listening skills with comprehensive full test practice sessions. This intensive course provides 10 complete IELTS Listening tests from authentic Cambridge IELTS materials, allowing you to experience real exam conditions and build test-taking stamina. Each test includes all four parts with realistic audio quality, authentic British accents, and accurate question formats. After completing each test, you''ll receive detailed performance analysis including score breakdown by part, identification of weak areas, and personalized improvement recommendations. The course teaches advanced time management strategies, stress reduction techniques, and effective test-day preparation methods. Practice under timed conditions to simulate the actual exam experience, and learn to handle the pressure of the 30-minute test format. Detailed answer explanations help you understand not just what the correct answer is, but why it''s correct and how to identify it efficiently. The course includes comprehensive progress tracking, performance analytics, and targeted practice recommendations based on your results. Perfect for students at upper-intermediate level targeting Band 7.5+ who need extensive practice and want to maximize their listening score.',
 'Complete IELTS Listening test practice with 10 full tests and detailed performance analysis',
 'listening', 'upper-intermediate', 7.5,
 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=xpmWhPew5QU',
 'b0000001-0000-0000-0000-000000000001'::uuid,
 'Sarah Mitchell', 12.0, 10, 40,
 'premium', 699000, 'VND', 'published',
 true, true,
 'IELTS Listening Full Test Practice - 10 Complete Tests | Band 7.5',
 'Practice complete IELTS Listening tests with detailed explanations. Includes 10 full tests from Cambridge IELTS books.',
 'IELTS Listening Practice, Full Test Practice, Cambridge IELTS, Listening Tests, Band 7.5, IELTS Preparation',
 NOW() - INTERVAL '150 days', NOW() - INTERVAL '170 days'),

-- ============================================
-- READING COURSES (10 courses)
-- ============================================
-- Beginner Reading Courses
('c2000001-0000-0000-0000-000000000005'::uuid,
 'IELTS Reading Fundamentals',
 'ielts-reading-fundamentals',
 'Build a strong foundation in IELTS Reading with this comprehensive course designed for beginners. Learn essential reading strategies including skimming for main ideas, scanning for specific information, and understanding how to approach different question types effectively. The course covers fundamental skills such as identifying key information, understanding paraphrasing, recognizing synonyms and antonyms, and managing time efficiently. You''ll practice with carefully selected academic passages that gradually increase in difficulty, allowing you to build confidence step by step. Each lesson focuses on specific question types including multiple choice, True/False/Not Given, matching headings, sentence completion, and short answer questions. Detailed explanations help you understand common traps and mistakes, while practical exercises reinforce your learning. The course includes vocabulary building exercises featuring high-frequency IELTS words, reading comprehension practice, and strategies for handling unfamiliar vocabulary. By the end of this course, you''ll have mastered basic reading techniques, improved your reading speed, and developed the confidence to tackle any IELTS Reading passage. Perfect for students targeting Band 6.0 who want to build a solid foundation before moving to more advanced materials.',
 'Master essential IELTS Reading skills including skimming, scanning, and question type strategies',
 'reading', 'beginner', 6.0,
 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
 NULL,
 'b0000002-0000-0000-0000-000000000002'::uuid,
 'James Anderson', 7.0, 20, 8,
 'free', 0, 'VND', 'published',
 true, true,
 'IELTS Reading Fundamentals Course - Complete Guide for Beginners | Band 6.0',
 'Learn essential IELTS Reading skills: skimming, scanning, and understanding question types. Perfect for beginners.',
 'IELTS Reading, IELTS Beginner, Reading Fundamentals, Skimming Scanning, Band 6.0, IELTS Preparation',
 NOW() - INTERVAL '140 days', NOW() - INTERVAL '160 days'),

('c2000002-0000-0000-0000-000000000006'::uuid,
 'True/False/Not Given Mastery',
 'true-false-not-given-mastery',
 'Master the most challenging IELTS Reading question type with this specialized course. True/False/Not Given questions consistently rank as the most difficult for IELTS candidates, and this course provides a systematic approach to conquering them. Learn proven strategies for identifying factual statements, distinguishing between what is stated, implied, or not mentioned in the passage. The course breaks down the subtle differences between True (the statement agrees with the passage), False (the statement contradicts the passage), and Not Given (the statement is not mentioned or cannot be determined from the passage). Practice with 50+ carefully crafted questions covering various topics and difficulty levels. Detailed explanations for each question help you understand the reasoning process and develop pattern recognition skills. The course includes common trap identification, vocabulary strategies for understanding nuanced meanings, and time-saving techniques for quickly identifying the correct answer. You''ll learn to avoid common mistakes such as making assumptions, confusing False with Not Given, and misinterpreting paraphrased information. Advanced students will appreciate the complex passage analysis techniques and strategies for handling high-level academic texts. Perfect for intermediate to advanced students targeting Band 7.0+ who need to master this critical question type.',
 'Become an expert at True/False/Not Given questions with proven strategies and extensive practice',
 'reading', 'intermediate', 7.0,
 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
 NULL,
 'b0000003-0000-0000-0000-000000000003'::uuid,
 'Emma Thompson', 6.0, 16, 6,
 'premium', 399000, 'VND', 'published',
 false, true,
 'True/False/Not Given Mastery - IELTS Reading Question Type | Band 7.0',
 'Master the most challenging IELTS Reading question type: True/False/Not Given. Learn proven strategies and practice with 50+ questions.',
 'True False Not Given, IELTS Reading, Reading Strategies, Band 7.0, IELTS Preparation',
 NOW() - INTERVAL '130 days', NOW() - INTERVAL '150 days'),

-- Advanced Reading Courses
('c2000003-0000-0000-0000-000000000007'::uuid,
 'IELTS Academic Reading Advanced',
 'ielts-academic-reading-advanced',
 'Excel in IELTS Academic Reading with advanced strategies designed for high-achieving students targeting Band 7.5+. This comprehensive course focuses on handling complex academic passages from journals, textbooks, and research papers that appear in the actual IELTS test. Learn advanced techniques for quickly understanding dense academic texts, identifying main arguments, recognizing author perspectives, and extracting specific information efficiently. The course covers sophisticated reading strategies including inferential reading, understanding complex sentence structures, recognizing academic discourse markers, and managing difficult vocabulary. Practice with authentic university-level passages covering diverse academic fields including science, technology, history, psychology, and environmental studies. Each lesson includes detailed passage analysis, vocabulary building with academic terminology, and strategies for maintaining accuracy while increasing reading speed. The course teaches advanced time management techniques to complete all 40 questions within the 60-minute time limit, including prioritization strategies for difficult questions. You''ll learn to identify question types quickly, understand what each question is asking for, and locate answers efficiently in complex passages. Comprehensive practice tests with detailed explanations help you identify weaknesses and improve performance. Perfect for advanced students who have mastered basic reading skills and need to push their scores to the next level.',
 'Advanced strategies for handling complex academic passages and achieving Band 7.5+ in Reading',
 'reading', 'advanced', 7.5,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
 NULL,
 'b0000001-0000-0000-0000-000000000001'::uuid,
 'Sarah Mitchell', 9.0, 24, 10,
 'premium', 599000, 'VND', 'published',
 true, false,
 'IELTS Academic Reading Advanced Course - Band 7.5+',
 'Advanced strategies for Academic Reading. Focus on complex passages, academic vocabulary, and time management.',
 'IELTS Academic Reading, Advanced Reading, Academic Vocabulary, Band 7.5, IELTS Preparation',
 NOW() - INTERVAL '120 days', NOW() - INTERVAL '140 days'),

-- ============================================
-- WRITING COURSES (5 courses)
-- ============================================
('c3000001-0000-0000-0000-000000000008'::uuid,
 'IELTS Writing Task 1 - Complete Guide',
 'ielts-writing-task-1-complete-guide',
 'Master IELTS Writing Task 1 with this comprehensive course covering all question types including line graphs, bar charts, pie charts, tables, maps, diagrams, and process diagrams. Learn step-by-step approaches to analyzing visual data, selecting key information, organizing your response logically, and using appropriate vocabulary and grammar structures. The course teaches proven frameworks for describing trends, making comparisons, highlighting significant features, and writing accurate overviews. Practice with 50+ real IELTS Task 1 questions covering diverse topics and chart types. Each lesson includes model answers with detailed explanations, vocabulary lists for describing data, common grammar structures, and band score breakdowns. You''ll learn to identify main trends, compare data effectively, use varied sentence structures, and write within the 150-word limit while maintaining accuracy. The course covers Academic Task 1 in detail, helping you understand examiner expectations and common mistakes to avoid. Advanced students will appreciate strategies for achieving Band 7.0+ with sophisticated vocabulary and complex sentence structures. Includes downloadable templates, practice exercises with feedback, and comprehensive answer keys.',
 'Complete guide to mastering IELTS Writing Task 1 with step-by-step strategies and extensive practice',
 'writing', 'intermediate', 6.5,
 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
 NULL,
 'b0000002-0000-0000-0000-000000000002'::uuid,
 'James Anderson', 8.0, 22, 15,
 'premium', 549000, 'VND', 'published',
 true, true,
 'IELTS Writing Task 1 Complete Guide - Charts, Graphs, Maps | Band 6.5',
 'Master IELTS Writing Task 1 with step-by-step guidance. Learn to describe charts, graphs, maps, and diagrams effectively.',
 'IELTS Writing Task 1, Writing Charts, Writing Graphs, Band 6.5, IELTS Preparation',
 NOW() - INTERVAL '110 days', NOW() - INTERVAL '130 days'),

('c3000002-0000-0000-0000-000000000009'::uuid,
 'IELTS Writing Task 2 - Essay Mastery',
 'ielts-writing-task-2-essay-mastery',
 'Excel in IELTS Writing Task 2 with this comprehensive course covering all essay types: Opinion Essays, Discussion Essays, Problem-Solution Essays, Advantages/Disadvantages Essays, and Two-Part Questions. Learn proven frameworks for structuring each essay type, developing strong arguments, supporting ideas with relevant examples, and writing cohesive paragraphs. The course teaches advanced vocabulary for expressing opinions, making comparisons, giving examples, and drawing conclusions. Practice with 60+ real IELTS Task 2 questions covering diverse topics including education, technology, environment, health, society, and culture. Each lesson includes model essays at different band levels, detailed analysis of essay structure, vocabulary building exercises, and grammar practice. You''ll learn to generate ideas quickly, organize your thoughts logically, write compelling introductions and conclusions, and develop body paragraphs with clear topic sentences and supporting details. The course covers Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy - the four criteria examiners use to assess your writing. Advanced strategies for Band 7.0+ include using complex sentence structures, varied vocabulary, and sophisticated linking devices. Includes essay planning templates, brainstorming techniques, and comprehensive feedback on practice essays.',
 'Master all IELTS Writing Task 2 essay types with proven frameworks and extensive practice materials',
 'writing', 'intermediate', 7.0,
 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
 NULL,
 'b0000003-0000-0000-0000-000000000003'::uuid,
 'Emma Thompson', 10.0, 26, 18,
 'premium', 649000, 'VND', 'published',
 true, true,
 'IELTS Writing Task 2 Essay Mastery - All Essay Types | Band 7.0',
 'Learn to write high-scoring IELTS essays. Covers all essay types: opinion, discussion, problem-solution, and advantages/disadvantages.',
 'IELTS Writing Task 2, Essay Writing, Opinion Essay, Discussion Essay, Band 7.0, IELTS Preparation',
 NOW() - INTERVAL '100 days', NOW() - INTERVAL '120 days'),

-- ============================================
-- SPEAKING COURSES (5 courses)
-- ============================================
('c4000001-0000-0000-0000-000000000010'::uuid,
 'IELTS Speaking Part 1 - Everyday Topics',
 'ielts-speaking-part-1-everyday-topics',
 'Build confidence in IELTS Speaking Part 1 with this comprehensive course covering all common topics including hometown, family, work, studies, hobbies, music, sports, travel, food, and technology. Learn natural responses to common questions, pronunciation tips for clarity, and strategies for giving detailed answers without hesitation. The course teaches vocabulary for everyday situations, common phrases and expressions, and techniques for extending your answers appropriately. Practice with 100+ real Part 1 questions covering diverse topics, with model answers and pronunciation guides. Each lesson includes audio recordings of native speakers, pronunciation practice exercises, vocabulary building activities, and tips for avoiding common mistakes. You''ll learn to answer questions naturally, use appropriate grammar structures, speak fluently without long pauses, and demonstrate good pronunciation. The course covers essential speaking skills including word stress, sentence stress, intonation patterns, and connected speech. Beginner-friendly approach helps you build confidence gradually, starting with simple topics and progressing to more complex questions. Includes self-assessment checklists, pronunciation guides, and practice exercises with feedback. Perfect for students targeting Band 6.0+ who want to feel confident and natural in Part 1.',
 'Master IELTS Speaking Part 1 with natural responses, pronunciation tips, and extensive practice on everyday topics',
 'speaking', 'elementary', 6.0,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=p-JfuIyV9xQ',
 'b0000001-0000-0000-0000-000000000001'::uuid,
 'Sarah Mitchell', 5.0, 16, 14,
 'free', 0, 'VND', 'published',
 false, true,
 'IELTS Speaking Part 1 - Everyday Topics Course | Band 6.0',
 'Master Part 1 of IELTS Speaking with common topics: hometown, family, hobbies, work, studies. Includes pronunciation tips.',
 'IELTS Speaking Part 1, Speaking Practice, Pronunciation, Band 6.0, IELTS Preparation',
 NOW() - INTERVAL '90 days', NOW() - INTERVAL '110 days'),

('c4000002-0000-0000-0000-000000000011'::uuid,
 'IELTS Speaking Part 2 - Cue Card Mastery',
 'ielts-speaking-part-2-cue-card-mastery',
 'Master the IELTS Speaking Part 2 long turn with this comprehensive course covering 50+ cue card topics. Learn proven frameworks for structuring your 2-minute speech, developing ideas quickly, and speaking fluently without hesitation. The course teaches strategies for using the 1-minute preparation time effectively, organizing your thoughts, and covering all bullet points on the cue card. Practice with authentic cue cards covering diverse topics including people, places, events, objects, experiences, and abstract concepts. Each lesson includes model answers demonstrating different approaches, vocabulary for specific topics, linking phrases for smooth transitions, and techniques for managing time effectively. You''ll learn to give detailed, well-structured responses, use varied vocabulary and grammar, speak naturally and fluently, and maintain coherence throughout your speech. The course covers common cue card types, strategies for handling difficult topics, techniques for extending your answers, and tips for impressive vocabulary use. Advanced students will appreciate sophisticated language structures, idiomatic expressions, and strategies for achieving Band 7.0+. Includes planning templates, idea generation techniques, and practice exercises with time management focus. Perfect for intermediate to advanced students targeting Band 7.0+ who want to excel in Part 2.',
 'Perfect your Part 2 long turn with proven frameworks, 50+ cue card topics, and strategies for fluent delivery',
 'speaking', 'intermediate', 7.0,
 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=nXvcLRAYIXs',
 'b0000002-0000-0000-0000-000000000002'::uuid,
 'James Anderson', 7.0, 20, 16,
 'premium', 499000, 'VND', 'published',
 true, false,
 'IELTS Speaking Part 2 Cue Card Mastery Course | Band 7.0',
 'Learn to structure and deliver 2-minute speeches for Part 2. Includes 50+ cue card topics with model answers.',
 'IELTS Speaking Part 2, Cue Card, Long Turn, Speaking Practice, Band 7.0, IELTS Preparation',
 NOW() - INTERVAL '80 days', NOW() - INTERVAL '100 days'),

-- ============================================
-- GENERAL/COMPREHENSIVE COURSES (5 courses)
-- ============================================
('c5000001-0000-0000-0000-000000000012'::uuid,
 'Complete IELTS Preparation Course',
 'complete-ielts-preparation-course',
 'Comprehensive course covering all four skills: Listening, Reading, Writing, and Speaking. Perfect for students preparing for their first IELTS test.',
 'All-in-one IELTS preparation course',
 'general', 'intermediate', 6.5,
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=6QMu7-3DMi0',
 'b0000001-0000-0000-0000-000000000001'::uuid,
 'Sarah Mitchell', 40.0, 80, 60,
 'premium', 1999000, 'VND', 'published',
 true, true,
 'Complete IELTS Preparation Course - All Skills | Band 6.5',
 'Comprehensive course covering all four skills: Listening, Reading, Writing, and Speaking. Perfect for students preparing for their first IELTS test.',
 'IELTS Complete Course, IELTS Preparation, All Skills, Band 6.5, IELTS Training',
 NOW() - INTERVAL '70 days', NOW() - INTERVAL '90 days'),

('c5000002-0000-0000-0000-000000000013'::uuid,
 'IELTS Band 7.0+ Intensive Course',
 'ielts-band-7-intensive-course',
 'Intensive course for ambitious students targeting Band 7.0+. Advanced strategies, complex topics, and challenging practice materials.',
 'Advanced course for high achievers',
 'general', 'advanced', 7.5,
 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
 'https://www.youtube.com/watch?v=WT0QV_3Y7Fw',
 'b0000003-0000-0000-0000-000000000003'::uuid,
 'Emma Thompson', 35.0, 70, 55,
 'premium', 2499000, 'VND', 'published',
 true, true,
 'IELTS Band 7.0+ Intensive Course - Advanced Strategies | Band 7.5',
 'Intensive course for ambitious students targeting Band 7.0+. Advanced strategies, complex topics, and challenging practice materials.',
 'IELTS Band 7, IELTS Advanced, Intensive Course, Band 7.5, IELTS Preparation',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '80 days');

-- Insert more courses dynamically
INSERT INTO courses (
    id, title, slug, description, short_description, skill_type, level, target_band_score,
    thumbnail_url, preview_video_url, instructor_id, instructor_name, duration_hours,
    total_lessons, total_videos, enrollment_type, price, currency, status,
    is_featured, is_recommended, meta_title, meta_description, meta_keywords,
    published_at, created_at
)
SELECT 
    ('c' || 
        CASE 
            WHEN skill_num = 1 THEN '1' -- listening
            WHEN skill_num = 2 THEN '2' -- reading
            WHEN skill_num = 3 THEN '3' -- writing
            WHEN skill_num = 4 THEN '4' -- speaking
            ELSE '5' -- general
        END ||
        LPAD((course_num + 10)::text, 6, '0') || '-0000-0000-0000-000000000' ||
        LPAD((course_num + 10)::text, 3, '0')
    )::uuid,
    CASE skill_num
        WHEN 1 THEN 'IELTS Listening ' || 
            CASE course_num % 4
                WHEN 0 THEN 'Practice Test ' || (course_num / 4 + 1)::text
                WHEN 1 THEN 'Vocabulary Mastery'
                WHEN 2 THEN 'Note-Taking Techniques'
                ELSE 'Speed Improvement'
            END
        WHEN 2 THEN 'IELTS Reading ' ||
            CASE course_num % 4
                WHEN 0 THEN 'Passage Analysis ' || (course_num / 4 + 1)::text
                WHEN 1 THEN 'Vocabulary Building'
                WHEN 2 THEN 'Time Management'
                ELSE 'Question Type Mastery'
            END
        WHEN 3 THEN 'IELTS Writing ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Grammar & Vocabulary'
                WHEN 1 THEN 'Coherence & Cohesion'
                ELSE 'Task Response'
            END
        WHEN 4 THEN 'IELTS Speaking ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Pronunciation & Fluency'
                WHEN 1 THEN 'Grammar & Vocabulary'
                ELSE 'Part 3 Discussion'
            END
        ELSE 'IELTS ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Grammar Foundation'
                WHEN 1 THEN 'Vocabulary Expansion'
                ELSE 'Test Strategies'
            END
    END,
    'ielts-' ||
        CASE skill_num
            WHEN 1 THEN 'listening'
            WHEN 2 THEN 'reading'
            WHEN 3 THEN 'writing'
            WHEN 4 THEN 'speaking'
            ELSE 'general'
        END || '-' ||
        REPLACE(LOWER(
            CASE skill_num
                WHEN 1 THEN 'IELTS Listening ' || 
                    CASE course_num % 4
                        WHEN 0 THEN 'Practice Test ' || course_num::text
                        WHEN 1 THEN 'Vocabulary Mastery ' || course_num::text
                        WHEN 2 THEN 'Note-Taking Techniques ' || course_num::text
                        ELSE 'Speed Improvement ' || course_num::text
                    END
                WHEN 2 THEN 'IELTS Reading ' ||
                    CASE course_num % 4
                        WHEN 0 THEN 'Passage Analysis ' || course_num::text
                        WHEN 1 THEN 'Vocabulary Building ' || course_num::text
                        WHEN 2 THEN 'Time Management ' || course_num::text
                        ELSE 'Question Type Mastery ' || course_num::text
                    END
                WHEN 3 THEN 'IELTS Writing ' ||
                    CASE course_num % 3
                        WHEN 0 THEN 'Grammar & Vocabulary ' || course_num::text
                        WHEN 1 THEN 'Coherence & Cohesion ' || course_num::text
                        ELSE 'Task Response ' || course_num::text
                    END
                WHEN 4 THEN 'IELTS Speaking ' ||
                    CASE course_num % 3
                        WHEN 0 THEN 'Pronunciation & Fluency ' || course_num::text
                        WHEN 1 THEN 'Grammar & Vocabulary ' || course_num::text
                        ELSE 'Part 3 Discussion ' || course_num::text
                    END
                ELSE 'IELTS ' ||
                    CASE course_num % 3
                        WHEN 0 THEN 'Grammar Foundation ' || course_num::text
                        WHEN 1 THEN 'Vocabulary Expansion ' || course_num::text
                        ELSE 'Test Strategies ' || course_num::text
                    END
            END
        ), ' ', '-'),
    CASE skill_num
        WHEN 1 THEN 'Comprehensive IELTS Listening course covering ' ||
            CASE course_num % 4
                WHEN 0 THEN 'full practice tests with detailed explanations. Perfect for students who want to experience complete IELTS Listening tests under timed conditions. Each test includes all four parts with authentic audio quality, realistic question formats, and comprehensive answer explanations. Practice identifying key information across different contexts, managing time effectively, and building test-taking stamina. Includes performance analysis, score breakdowns by part, and personalized improvement recommendations based on your results. Ideal for intermediate to advanced students targeting Band 6.5-7.5.'
                WHEN 1 THEN 'essential vocabulary for different contexts commonly found in IELTS Listening tests. This course systematically builds your vocabulary through themed lessons covering accommodation, travel, education, work, health, environment, and technology. Learn vocabulary in context with audio examples, practice exercises, and memory techniques. Each lesson includes pronunciation guides, example sentences, and opportunities to use new vocabulary in realistic scenarios. Build confidence recognizing and understanding vocabulary across various accents and speech speeds. Perfect for beginners to intermediate students who want to strengthen their vocabulary foundation.'
                WHEN 2 THEN 'effective note-taking strategies specifically designed for Part 3 and Part 4 of IELTS Listening. Master techniques for capturing key information quickly while listening, organizing notes logically, and using abbreviations effectively. Learn to identify main ideas, supporting details, and specific information in academic conversations and lectures. Practice with authentic university-level materials including student-tutor discussions, research presentations, and academic seminars. Includes templates for different note-taking methods, practice exercises with increasing difficulty, and detailed feedback on your note-taking skills. Essential for intermediate to advanced students targeting Band 7.0+ who struggle with the academic parts of the test.'
                ELSE 'techniques to improve listening speed and accuracy. Develop skills for processing information quickly, maintaining concentration throughout the test, and handling fast speech rates. Learn strategies for predicting answers, recognizing paraphrasing, and identifying distractors. Practice with progressively faster audio materials, develop listening stamina, and improve your ability to understand native speakers at natural speed. Includes speed-building exercises, concentration techniques, and methods for maintaining accuracy while increasing processing speed. Perfect for students who can understand slower speech but struggle with the pace of real IELTS tests.'
            END
        WHEN 2 THEN 'Detailed IELTS Reading course focusing on ' ||
            CASE course_num % 4
                WHEN 0 THEN 'analyzing complex academic passages commonly found in IELTS Reading tests. Learn advanced techniques for quickly understanding dense academic texts, identifying main arguments, recognizing author perspectives, and extracting specific information efficiently. Practice with authentic passages from journals, textbooks, and research papers covering diverse fields including science, technology, history, psychology, and environmental studies. Each lesson includes detailed passage analysis, vocabulary building with academic terminology, and strategies for maintaining accuracy while increasing reading speed. Develop skills for handling complex sentence structures, understanding academic discourse markers, and managing difficult vocabulary. Essential for advanced students targeting Band 7.5+ who need to master complex academic texts.'
                WHEN 1 THEN 'building academic vocabulary systematically through thematic lessons and contextual learning. Expand your vocabulary with high-frequency IELTS words organized by topics including science, technology, environment, health, education, and society. Learn vocabulary in context with example sentences from real IELTS passages, practice exercises, and memory techniques. Each lesson includes word families, collocations, synonyms, and antonyms to help you understand nuanced meanings. Develop ability to recognize vocabulary in different forms and contexts, understand academic terminology, and use sophisticated vocabulary appropriately. Perfect for intermediate to advanced students who want to improve their reading comprehension and vocabulary range.'
                WHEN 2 THEN 'managing time effectively in the IELTS Reading test. Learn proven strategies for completing all 40 questions within the 60-minute time limit without sacrificing accuracy. Develop skills for quickly identifying question types, prioritizing easier questions, and allocating time appropriately across three passages. Practice with timed exercises, learn to scan and skim efficiently, and develop techniques for quickly locating answers. Includes time management templates, practice tests with time tracking, and strategies for handling difficult questions under time pressure. Essential for all IELTS candidates who struggle to complete the reading test within the time limit.'
                ELSE 'mastering all question types with proven strategies and extensive practice. Cover every question type in IELTS Reading including multiple choice, True/False/Not Given, Yes/No/Not Given, matching headings, matching information, sentence completion, summary completion, and short answer questions. Learn specific techniques for each question type, understand common traps and mistakes, and practice with 200+ carefully selected questions. Each lesson includes detailed explanations, example answers, and strategies for quickly identifying correct answers. Build confidence handling any question type regardless of passage difficulty. Perfect for students who want comprehensive coverage of all IELTS Reading question types.'
            END
        WHEN 3 THEN 'Advanced IELTS Writing course emphasizing ' ||
            CASE course_num % 3
                WHEN 0 THEN 'grammar accuracy and vocabulary range essential for achieving high scores in IELTS Writing. Master complex sentence structures, varied grammatical patterns, and sophisticated vocabulary appropriate for academic writing. Learn to use grammar structures accurately, avoid common mistakes, and demonstrate grammatical range and flexibility. Practice with targeted exercises focusing on tenses, passive voice, conditional sentences, relative clauses, and advanced grammar structures. Expand your vocabulary with academic words, synonyms, collocations, and idiomatic expressions suitable for formal writing. Includes grammar explanations, vocabulary lists, practice exercises, and detailed feedback on your writing. Essential for students targeting Band 6.5+ who need to improve their grammatical accuracy and lexical resource.'
                WHEN 1 THEN 'coherence, cohesion, and paragraph structure to create well-organized and logically connected essays. Learn to structure essays effectively with clear introductions, well-developed body paragraphs, and strong conclusions. Master linking devices, transitional phrases, and cohesive devices to connect ideas smoothly. Practice organizing ideas logically, developing paragraphs with clear topic sentences and supporting details, and creating smooth transitions between paragraphs. Includes essay templates, paragraph structure guides, linking word lists, and practice exercises with model answers. Develop skills for creating clear, logical flow throughout your essays that examiners can easily follow. Perfect for students who understand grammar and vocabulary but struggle with essay organization and coherence.'
                ELSE 'task achievement and addressing all requirements comprehensively to maximize your Task Response score. Learn to analyze essay questions effectively, identify all parts of the question, and address each requirement fully. Practice generating relevant ideas quickly, developing arguments with clear examples, and ensuring your response fully answers the question. Master techniques for writing compelling introductions that clearly state your position, developing body paragraphs that fully explore each aspect of the question, and concluding effectively. Includes question analysis frameworks, idea generation techniques, and strategies for ensuring complete task coverage. Essential for students who struggle to fully address all parts of essay questions and need to improve their Task Response scores.'
            END
        WHEN 4 THEN 'Complete IELTS Speaking course covering ' ||
            CASE course_num % 3
                WHEN 0 THEN 'pronunciation, stress, and fluency techniques to help you speak clearly and naturally. Master essential pronunciation skills including word stress, sentence stress, intonation patterns, and connected speech. Learn to pronounce individual sounds accurately, use stress to convey meaning, and speak with natural rhythm and intonation. Practice with audio recordings of native speakers, pronunciation exercises, and techniques for self-correction. Develop fluency through regular practice, reduce hesitation and pauses, and learn to speak at a natural pace. Includes pronunciation guides, audio examples, practice exercises, and strategies for improving your accent. Perfect for students who want to improve their pronunciation and speak more naturally and fluently.'
                WHEN 1 THEN 'grammar accuracy and lexical resource to demonstrate sophisticated language use in your speaking test. Learn to use a wide range of grammatical structures accurately, vary your sentence patterns, and avoid common grammar mistakes. Expand your vocabulary with idiomatic expressions, collocations, and sophisticated words appropriate for spoken English. Practice using grammar structures naturally in conversation, developing vocabulary for diverse topics, and demonstrating lexical flexibility. Includes grammar practice exercises, vocabulary building activities, model answers demonstrating sophisticated language, and techniques for using advanced language naturally. Essential for students targeting Band 7.0+ who need to demonstrate grammatical range and lexical resource in their speaking.'
                ELSE 'advanced discussion topics for Part 3 of the IELTS Speaking test. Master techniques for handling abstract and complex questions, developing extended responses, and expressing sophisticated opinions. Learn to analyze questions deeply, structure your answers logically, and support your ideas with relevant examples and explanations. Practice with 100+ Part 3 questions covering diverse topics including education, technology, environment, society, culture, and global issues. Develop skills for speculating, comparing, evaluating, and expressing nuanced opinions. Includes question analysis techniques, answer frameworks, vocabulary for expressing opinions, and strategies for handling difficult questions. Perfect for advanced students targeting Band 7.5+ who want to excel in the most challenging part of the speaking test.'
            END
        ELSE 'Comprehensive IELTS course covering ' ||
            CASE course_num % 3
                WHEN 0 THEN 'essential grammar rules and structures needed for success in all four IELTS skills. Build a strong grammatical foundation with systematic lessons covering tenses, passive voice, conditional sentences, relative clauses, articles, prepositions, and advanced grammar structures. Learn grammar in context with examples from IELTS materials, practice exercises, and opportunities to use grammar structures in realistic scenarios. Develop understanding of how grammar affects meaning, learn to use grammar structures accurately and appropriately, and avoid common mistakes. Includes grammar explanations, practice exercises, error correction activities, and detailed feedback. Perfect for students who need to strengthen their grammatical foundation before focusing on specific skills.'
                WHEN 1 THEN 'building a strong vocabulary foundation essential for achieving high scores across all IELTS skills. Expand your vocabulary systematically through thematic lessons covering high-frequency IELTS words, academic vocabulary, and topic-specific vocabulary. Learn vocabulary in context with example sentences, practice exercises, and memory techniques. Develop skills for recognizing vocabulary in different forms, understanding nuanced meanings, and using vocabulary appropriately. Includes vocabulary lists organized by topic and frequency, practice exercises, and strategies for vocabulary retention. Essential for students who want to build a comprehensive vocabulary foundation for IELTS success.'
                ELSE 'effective test-taking strategies for all sections of the IELTS test. Learn proven techniques for maximizing your score including time management, answer strategies, common mistakes to avoid, and test-day preparation. Master strategies specific to each skill including prediction techniques for Listening, scanning and skimming for Reading, planning frameworks for Writing, and confidence-building techniques for Speaking. Practice with full test simulations, develop test-taking stamina, and learn to handle pressure effectively. Includes comprehensive test strategies, practice tests, performance analysis, and personalized improvement recommendations. Perfect for students preparing for their first IELTS test or those who want to optimize their test-taking approach.'
            END
    END,
    CASE skill_num
        WHEN 1 THEN 
            CASE course_num % 4
                WHEN 0 THEN 'IELTS Listening full test practice course'
                WHEN 1 THEN 'IELTS Listening vocabulary mastery course'
                WHEN 2 THEN 'IELTS Listening note-taking strategies course'
                ELSE 'IELTS Listening speed and accuracy improvement course'
            END
        WHEN 2 THEN
            CASE course_num % 4
                WHEN 0 THEN 'IELTS Reading passage analysis course'
                WHEN 1 THEN 'IELTS Reading vocabulary building course'
                WHEN 2 THEN 'IELTS Reading time management course'
                ELSE 'IELTS Reading question type mastery course'
            END
        WHEN 3 THEN
            CASE course_num % 3
                WHEN 0 THEN 'IELTS Writing grammar and vocabulary course'
                WHEN 1 THEN 'IELTS Writing coherence and cohesion course'
                ELSE 'IELTS Writing task achievement course'
            END
        WHEN 4 THEN
            CASE course_num % 3
                WHEN 0 THEN 'IELTS Speaking pronunciation and fluency course'
                WHEN 1 THEN 'IELTS Speaking grammar and vocabulary course'
                ELSE 'IELTS Speaking Part 3 advanced discussion course'
            END
        ELSE
            CASE course_num % 3
                WHEN 0 THEN 'IELTS grammar foundation course'
                WHEN 1 THEN 'IELTS vocabulary expansion course'
                ELSE 'IELTS test strategies course'
            END
    END,
    CASE skill_num
        WHEN 1 THEN 'listening'
        WHEN 2 THEN 'reading'
        WHEN 3 THEN 'writing'
        WHEN 4 THEN 'speaking'
        ELSE 'general'
    END,
    CASE course_num % 5
        WHEN 0 THEN 'beginner'
        WHEN 1 THEN 'elementary'
        WHEN 2 THEN 'intermediate'
        WHEN 3 THEN 'upper-intermediate'
        ELSE 'advanced'
    END,
    5.0 + (course_num % 31) * 0.1,
    -- Diverse thumbnail URLs based on skill type
    CASE skill_num
        WHEN 1 THEN -- Listening
            (ARRAY[
                'https://plus.unsplash.com/premium_photo-1681489727671-e4865915197b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
                'https://images.unsplash.com/photo-1563120145-ecb346208872?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://plus.unsplash.com/premium_photo-1661490813116-3b678da41ff4?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://plus.unsplash.com/premium_photo-1664382465450-6dc3c2bae5d0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=764',
                'https://images.unsplash.com/photo-1599139894727-62676829679b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074',
                'https://images.unsplash.com/photo-1590650046871-92c887180603?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1526662092594-e98c1e356d6a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1171',
                'https://plus.unsplash.com/premium_photo-1723924809917-c0b1b5d6f53b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170'
            ])[1 + (course_num % 8)]
        WHEN 2 THEN -- Reading
            (ARRAY[
                'https://images.unsplash.com/photo-1568667256549-094345857637?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2030',
                'https://images.unsplash.com/photo-1683871268982-a19153dbb35d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://plus.unsplash.com/premium_photo-1750360906456-b28d130fa7f8?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://plus.unsplash.com/premium_photo-1750360905827-af6cb76a55bb?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1236',
                'https://images.unsplash.com/photo-1662582631700-676a217d511f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
                'https://images.unsplash.com/photo-1706210880873-87d8a1ebd3af?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1648999528869-5292670c6681?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
                'https://images.unsplash.com/photo-1553729784-e91953dec042?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1620701168009-da332c79c2dc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687'
            ])[1 + (course_num % 9)]
        WHEN 3 THEN -- Writing
            (ARRAY[
                'https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1073',
                'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1172',
                'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1510442650500-93217e634e4c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=691',
                'https://images.unsplash.com/photo-1579017308347-e53e0d2fc5e9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
                'https://images.unsplash.com/photo-1549228581-cdbdb7430548?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1487611459768-bd414656ea10?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170'
            ])[1 + (course_num % 7)]
        WHEN 4 THEN -- Speaking
            (ARRAY[
                'https://plus.unsplash.com/premium_photo-1679079456599-07a3141244c0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=688',
                'https://plus.unsplash.com/premium_photo-1670884442051-263f5ae2d6ed?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1573497491208-6b1acb260507?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHR3byUyMHBlb3BsZSUyMHRhbGtpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600',
                'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
                'https://images.unsplash.com/photo-1713946598691-173f44f13dc9?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1332'
            ])[1 + (course_num % 6)]
        ELSE -- General
            (ARRAY[
                'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=600&fit=crop',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=400&fit=crop'
            ])[1 + (course_num % 3)]
    END,
    CASE WHEN skill_num IN (1, 4) THEN 
        'https://www.youtube.com/watch?v=' || 
        (ARRAY[
            'k72qx-LSKIg', 'RyTdIYMrcKY', 'xpmWhPew5QU', 'p-JfuIyV9xQ', 'nXvcLRAYIXs',
            'WT0QV_3Y7Fw', 'T49sg7i7ZAc', '20j9hYPuCLE', 'WGXGArS8UC8', 'uZNV1o7yLys',
            'gA7XBM5Z-zM', '7rULJclm0Ek', 'a_Q3YAN-Duo', 'nNTipHpP7so', 'MrJ33X0InXA',
            'yBiW708dDLI', 'xf5iUMqHInk', 'fsq-IQgKtTk', 'VGhUo8ezk4M', 'z6nsI5G9RWc',
            'BIn8zm8yymk', 'KD3OKlOXvxE', '4QAV5NiaW7k', 'V9qSdbotEkE', 'bGFDE0uBQEs',
            'NkJO7ceI3mo', '84Pn0s4RN70', '_ggznNb_er4', 'OPjsRxh6AF0', 'zGdCHg7gick',
            'Cc4lAvgLptg', 'OWduuHEpuzg', 'JSgOqBAjcMA', 'gQPO4q-ptUc', 'udPtobGpMSI',
            'tZ_ioUgKXwE', 'f5WH4UnDU7A', 'kugScbTr3gs', 'ZmMszhayj9I', 'ptO6NawNVgQ',
            '7oSQjdLfN5M', 'LjxIzECH7Ys', 'cQPjT9kXYgI', 'BVyP7sWR4Ew', 'R89l1zrgXzs',
            'FNwV3WqV6Sc', 'ECwA6aEvGuw', 'rPRCpfltzio', 'OmwzWAUCSQ8', 'KaJW7j0zey0',
            '2VRuK5QBjTw', '1-aFVhGhtFQ', 'oKZDa00CYU4', 'xoaWIur-YVY', 'g92Fum1z6w8',
            'KPb9VZMkais', '3I7bBIm3-PU', 'KVYx5CgAuao', 'j0qywR59Wv4', 'Aj4i9htNbxM',
            't_EVh8jxDbs', 'h-4V_duEx3w', '_jJi6k3CThM', '38Vx2NjW3T4', 'OBryguHcJXc',
            'a065ioF1jeM', '2Fqo0OoEoSU', 'd_q5o7pDRh0', 'xJlIQCWM1EA', 'KGFGZP3B8ZQ',
            'yi8uDHSuf9E', '0E7ss6etqDU', 'xGTaNjsLmss', '9WO4_N9C0po', 'fgBepZmk5VM',
            'YOSgRy3kqRs', 'QkPVVvPRE2s', 'UkUCO02Adt8', '_-nhtI3hn0Y', 'n-DzRPPXnNY',
            '2qP1JotBMTY', 'z8wZUS_b7k8', 'zaKl0H-YoQw', 'vQ7ZL1wMgCE', 'BCOJqpeqHrM',
            'ZdPZ6dgO44E', 'M0BUE7iMILc', 'fHx9Hnn48G0', 'SdV_3Ct5SNk', 'D8qWDovn5ck',
            'MQ_c-2IrAzk', 'oUOiZhQqBxw', '_aLlKFKEWXY', '1H-bsnpUiak', 'cuRJt35xAdY',
            'T8GB-tPlSY8', 'HEnTJqwewsg', 'rArhIvypfTI', 'F32lFOipk3M', 'dnmElGczPf8',
            'xhd-RZGcfIQ', 'dSW6rSzvbRY', 'K5MFUpEmDvU', 'y6Yv7ukWgy8', 'cGG3ovpSQZc',
            'k-D2p-QQyE8', 'BdBJTjuW_wo', 'OpDlKRhISqE', 'mGXWsxNfwhk', 'UfqugyGe-jk',
            'sYff9BKA-fY', 'X9eHv7iasws', 'IxNWmkDAjoM', 'KDbtZqLohUU', 'jDkOlzOeEHs',
            '7QXZyJ3Rj_Y', 'bYyXN5BPJkU', 'O8-N-vprxTs', 'INRq3QW_VHI', 'CYc-r5AeBcU'
        ])[1 + (course_num % 120)]
    ELSE NULL END,
    ('b' || LPAD((1 + (course_num % 15))::text, 7, '0') || '-0000-0000-0000-000000000' ||
        LPAD((1 + (course_num % 15))::text, 3, '0'))::uuid,
    CASE (course_num % 15)
        WHEN 0 THEN 'Sarah Mitchell'
        WHEN 1 THEN 'James Anderson'
        WHEN 2 THEN 'Emma Thompson'
        WHEN 3 THEN 'Michael Chen'
        WHEN 4 THEN 'David Miller'
        ELSE 'Instructor ' || (course_num % 15 + 1)::text
    END,
    5.0 + (course_num % 20) * 0.5,
    12 + (course_num % 15),
    8 + (course_num % 12),
    CASE WHEN course_num % 3 = 0 THEN 'free' ELSE 'premium' END,
    CASE WHEN course_num % 3 = 0 THEN 0 ELSE (200000 + (course_num % 40) * 50000) END,
    'VND',
    'published',
    CASE WHEN course_num % 5 = 0 THEN true ELSE false END,
    CASE WHEN course_num % 4 = 0 THEN true ELSE false END,
    -- meta_title
    CASE skill_num
        WHEN 1 THEN 'IELTS Listening ' || 
            CASE course_num % 4
                WHEN 0 THEN 'Practice Test ' || (course_num / 4 + 1)::text || ' | IELTS Learning Platform'
                WHEN 1 THEN 'Vocabulary Mastery Course | IELTS Learning Platform'
                WHEN 2 THEN 'Note-Taking Techniques Course | IELTS Learning Platform'
                ELSE 'Speed Improvement Course | IELTS Learning Platform'
            END
        WHEN 2 THEN 'IELTS Reading ' ||
            CASE course_num % 4
                WHEN 0 THEN 'Passage Analysis ' || (course_num / 4 + 1)::text || ' | IELTS Learning Platform'
                WHEN 1 THEN 'Vocabulary Building Course | IELTS Learning Platform'
                WHEN 2 THEN 'Time Management Course | IELTS Learning Platform'
                ELSE 'Question Type Mastery Course | IELTS Learning Platform'
            END
        WHEN 3 THEN 'IELTS Writing ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Grammar & Vocabulary Course | IELTS Learning Platform'
                WHEN 1 THEN 'Coherence & Cohesion Course | IELTS Learning Platform'
                ELSE 'Task Response Course | IELTS Learning Platform'
            END
        WHEN 4 THEN 'IELTS Speaking ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Pronunciation & Fluency Course | IELTS Learning Platform'
                WHEN 1 THEN 'Grammar & Vocabulary Course | IELTS Learning Platform'
                ELSE 'Part 3 Discussion Course | IELTS Learning Platform'
            END
        ELSE 'IELTS ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Grammar Foundation Course | IELTS Learning Platform'
                WHEN 1 THEN 'Vocabulary Expansion Course | IELTS Learning Platform'
                ELSE 'Test Strategies Course | IELTS Learning Platform'
            END
    END,
    -- meta_description
    CASE skill_num
        WHEN 1 THEN 'Comprehensive IELTS Listening course covering ' ||
            CASE course_num % 4
                WHEN 0 THEN 'full practice tests with detailed explanations.'
                WHEN 1 THEN 'essential vocabulary for different contexts.'
                WHEN 2 THEN 'effective note-taking strategies for Part 3 & 4.'
                ELSE 'techniques to improve listening speed and accuracy.'
            END
        WHEN 2 THEN 'Detailed IELTS Reading course focusing on ' ||
            CASE course_num % 4
                WHEN 0 THEN 'analyzing complex academic passages.'
                WHEN 1 THEN 'building academic vocabulary systematically.'
                WHEN 2 THEN 'managing time effectively in the reading test.'
                ELSE 'mastering all question types with proven strategies.'
            END
        WHEN 3 THEN 'Advanced IELTS Writing course emphasizing ' ||
            CASE course_num % 3
                WHEN 0 THEN 'grammar accuracy and vocabulary range.'
                WHEN 1 THEN 'coherence, cohesion, and paragraph structure.'
                ELSE 'task achievement and addressing all requirements.'
            END
        WHEN 4 THEN 'Complete IELTS Speaking course covering ' ||
            CASE course_num % 3
                WHEN 0 THEN 'pronunciation, stress, and fluency techniques.'
                WHEN 1 THEN 'grammar accuracy and lexical resource.'
                ELSE 'advanced discussion topics for Part 3.'
            END
        ELSE 'Comprehensive IELTS course covering ' ||
            CASE course_num % 3
                WHEN 0 THEN 'essential grammar rules and structures.'
                WHEN 1 THEN 'building a strong vocabulary foundation.'
                ELSE 'effective test-taking strategies for all sections.'
            END
    END,
    -- meta_keywords
    CASE skill_num
        WHEN 1 THEN 'IELTS Listening, Listening Practice, ' || 
            CASE course_num % 4
                WHEN 0 THEN 'Practice Test, Full Test'
                WHEN 1 THEN 'Vocabulary, Listening Vocabulary'
                WHEN 2 THEN 'Note Taking, Listening Strategies'
                ELSE 'Speed Improvement, Listening Speed'
            END || ', Band ' || (5.0 + (course_num % 31) * 0.1)::text || ', IELTS Preparation'
        WHEN 2 THEN 'IELTS Reading, Reading Practice, ' ||
            CASE course_num % 4
                WHEN 0 THEN 'Passage Analysis, Reading Comprehension'
                WHEN 1 THEN 'Vocabulary Building, Academic Vocabulary'
                WHEN 2 THEN 'Time Management, Reading Speed'
                ELSE 'Question Types, Reading Strategies'
            END || ', Band ' || (5.0 + (course_num % 31) * 0.1)::text || ', IELTS Preparation'
        WHEN 3 THEN 'IELTS Writing, Writing Practice, ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Grammar, Vocabulary, Writing Skills'
                WHEN 1 THEN 'Coherence, Cohesion, Paragraph Structure'
                ELSE 'Task Response, Essay Writing'
            END || ', Band ' || (5.0 + (course_num % 31) * 0.1)::text || ', IELTS Preparation'
        WHEN 4 THEN 'IELTS Speaking, Speaking Practice, ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Pronunciation, Fluency, Speaking Skills'
                WHEN 1 THEN 'Grammar, Vocabulary, Lexical Resource'
                ELSE 'Part 3, Discussion, Advanced Speaking'
            END || ', Band ' || (5.0 + (course_num % 31) * 0.1)::text || ', IELTS Preparation'
        ELSE 'IELTS, IELTS Preparation, ' ||
            CASE course_num % 3
                WHEN 0 THEN 'Grammar, Grammar Foundation'
                WHEN 1 THEN 'Vocabulary, Vocabulary Expansion'
                ELSE 'Test Strategies, IELTS Tips'
            END || ', Band ' || (5.0 + (course_num % 31) * 0.1)::text || ', IELTS Training'
    END,
    NOW() - (course_num % 60)::INTEGER * INTERVAL '1 day',
    NOW() - (course_num % 70)::INTEGER * INTERVAL '1 day'
FROM generate_series(1, 5) skill_num
CROSS JOIN generate_series(1, 6) course_num
WHERE (skill_num, course_num) NOT IN (
    (1, 1), (1, 2), (1, 3), (1, 4), -- Already seeded above
    (2, 1), (2, 2), (2, 3), -- Already seeded above
    (3, 1), (3, 2), -- Already seeded above
    (4, 1), (4, 2), -- Already seeded above
    (5, 1), (5, 2) -- Already seeded above
)
LIMIT 25;

-- ============================================
-- 2. MODULES
-- ============================================

INSERT INTO modules (
    id, course_id, title, description, display_order, duration_hours, total_lessons, is_published
)
SELECT 
    uuid_generate_v4(),
    c.id,
    -- Diverse module titles based on course skill type and module number
    COALESCE(
    CASE module_num
        WHEN 1 THEN 
            CASE c.skill_type
                WHEN 'listening' THEN (ARRAY['Module 1: Listening Fundamentals', 'Getting Started with IELTS Listening', 'Foundation: Understanding the Test', 'Introduction to Listening Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'reading' THEN (ARRAY['Module 1: Reading Fundamentals', 'Getting Started with IELTS Reading', 'Foundation: Understanding Passages', 'Introduction to Reading Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'writing' THEN (ARRAY['Module 1: Writing Fundamentals', 'Getting Started with IELTS Writing', 'Foundation: Understanding Tasks', 'Introduction to Writing Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'speaking' THEN (ARRAY['Module 1: Speaking Fundamentals', 'Getting Started with IELTS Speaking', 'Foundation: Understanding the Test', 'Introduction to Speaking Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                ELSE 'Module 1: Introduction & Fundamentals'
            END
        WHEN 2 THEN
            CASE c.skill_type
                WHEN 'listening' THEN (ARRAY['Module 2: Core Listening Strategies', 'Essential Techniques & Methods', 'Mastering Question Types', 'Advanced Listening Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'reading' THEN (ARRAY['Module 2: Core Reading Strategies', 'Essential Techniques & Methods', 'Mastering Question Types', 'Advanced Reading Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'writing' THEN (ARRAY['Module 2: Core Writing Strategies', 'Essential Techniques & Methods', 'Mastering Task Requirements', 'Advanced Writing Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'speaking' THEN (ARRAY['Module 2: Core Speaking Strategies', 'Essential Techniques & Methods', 'Mastering All Parts', 'Advanced Speaking Skills'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                ELSE 'Module 2: Core Concepts & Techniques'
            END
        WHEN 3 THEN
            CASE c.skill_type
                WHEN 'listening' THEN (ARRAY['Module 3: Practice & Application', 'Hands-On Listening Practice', 'Real Test Scenarios', 'Interactive Exercises'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'reading' THEN (ARRAY['Module 3: Practice & Application', 'Hands-On Reading Practice', 'Real Test Scenarios', 'Interactive Exercises'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'writing' THEN (ARRAY['Module 3: Practice & Application', 'Hands-On Writing Practice', 'Real Test Scenarios', 'Interactive Exercises'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'speaking' THEN (ARRAY['Module 3: Practice & Application', 'Hands-On Speaking Practice', 'Real Test Scenarios', 'Interactive Exercises'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                ELSE 'Module 3: Practice & Application'
            END
        WHEN 4 THEN
            CASE c.skill_type
                WHEN 'listening' THEN (ARRAY['Module 4: Advanced Strategies', 'Expert Techniques', 'Band 7+ Mastery', 'High-Score Strategies'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'reading' THEN (ARRAY['Module 4: Advanced Strategies', 'Expert Techniques', 'Band 7+ Mastery', 'High-Score Strategies'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'writing' THEN (ARRAY['Module 4: Advanced Strategies', 'Expert Techniques', 'Band 7+ Mastery', 'High-Score Strategies'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'speaking' THEN (ARRAY['Module 4: Advanced Strategies', 'Expert Techniques', 'Band 7+ Mastery', 'High-Score Strategies'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                ELSE 'Module 4: Advanced Strategies'
            END
        WHEN 5 THEN
            CASE c.skill_type
                WHEN 'listening' THEN (ARRAY['Module 5: Review & Mastery', 'Final Preparation', 'Consolidation & Practice', 'Test Day Ready'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'reading' THEN (ARRAY['Module 5: Review & Mastery', 'Final Preparation', 'Consolidation & Practice', 'Test Day Ready'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'writing' THEN (ARRAY['Module 5: Review & Mastery', 'Final Preparation', 'Consolidation & Practice', 'Test Day Ready'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                WHEN 'speaking' THEN (ARRAY['Module 5: Review & Mastery', 'Final Preparation', 'Consolidation & Practice', 'Test Day Ready'])[1 + (hashtext(c.id::text || module_num::text) % 4)]
                ELSE 'Module 5: Review & Mastery'
            END
        ELSE COALESCE('Module ' || module_num || ': Additional Practice', 'Module ' || module_num || ': Learning Module')
    END,
    'Module ' || COALESCE(module_num::text, '0') || ': Learning Module'
    ) as title,
    -- Detailed module descriptions
    CASE module_num
        WHEN 1 THEN 
            CASE c.skill_type
                WHEN 'listening' THEN 'This foundational module introduces you to IELTS Listening test structure, question types, and essential strategies. Learn the basics of effective listening, understand test format, and develop core skills needed for success. Perfect for beginners starting their IELTS Listening journey.'
                WHEN 'reading' THEN 'This foundational module introduces you to IELTS Reading test structure, passage types, and essential strategies. Learn the basics of effective reading, understand test format, and develop core skills needed for success. Perfect for beginners starting their IELTS Reading journey.'
                WHEN 'writing' THEN 'This foundational module introduces you to IELTS Writing test structure, task types, and essential strategies. Learn the basics of effective writing, understand assessment criteria, and develop core skills needed for success. Perfect for beginners starting their IELTS Writing journey.'
                WHEN 'speaking' THEN 'This foundational module introduces you to IELTS Speaking test structure, all three parts, and essential strategies. Learn the basics of effective speaking, understand assessment criteria, and develop core skills needed for success. Perfect for beginners starting their IELTS Speaking journey.'
                ELSE 'This foundational module introduces you to IELTS test structure and essential strategies. Learn the basics and develop core skills needed for success.'
            END
        WHEN 2 THEN
            CASE c.skill_type
                WHEN 'listening' THEN 'Master core listening strategies and techniques in this comprehensive module. Learn effective prediction methods, note-taking skills, keyword recognition, and time management. Practice with various question types and develop advanced listening abilities to improve your accuracy and speed.'
                WHEN 'reading' THEN 'Master core reading strategies and techniques in this comprehensive module. Learn effective skimming and scanning methods, vocabulary building, question analysis, and time management. Practice with various question types and develop advanced reading abilities to improve your comprehension and speed.'
                WHEN 'writing' THEN 'Master core writing strategies and techniques in this comprehensive module. Learn effective planning methods, essay structure, language use, and coherence techniques. Practice with various task types and develop advanced writing abilities to improve your task response and language accuracy.'
                WHEN 'speaking' THEN 'Master core speaking strategies and techniques in this comprehensive module. Learn effective fluency methods, vocabulary building, pronunciation tips, and coherence techniques. Practice with various topics and develop advanced speaking abilities to improve your communication and confidence.'
                ELSE 'Master core strategies and techniques in this comprehensive module. Learn effective methods and develop advanced abilities.'
            END
        WHEN 3 THEN
            CASE c.skill_type
                WHEN 'listening' THEN 'Apply your learning through extensive practice exercises and real test scenarios. Work through authentic IELTS Listening materials, practice with different question types, and receive detailed feedback on your performance. Build confidence and improve your test-taking skills through hands-on practice.'
                WHEN 'reading' THEN 'Apply your learning through extensive practice exercises and real test scenarios. Work through authentic IELTS Reading passages, practice with different question types, and receive detailed feedback on your performance. Build confidence and improve your test-taking skills through hands-on practice.'
                WHEN 'writing' THEN 'Apply your learning through extensive practice exercises and real test scenarios. Write responses to authentic IELTS Writing tasks, practice with different question types, and receive detailed feedback on your performance. Build confidence and improve your writing skills through hands-on practice.'
                WHEN 'speaking' THEN 'Apply your learning through extensive practice exercises and real test scenarios. Practice speaking on authentic IELTS topics, work through all three parts, and receive detailed feedback on your performance. Build confidence and improve your speaking skills through hands-on practice.'
                ELSE 'Apply your learning through extensive practice exercises and real test scenarios. Build confidence and improve your skills through hands-on practice.'
            END
        WHEN 4 THEN
            CASE c.skill_type
                WHEN 'listening' THEN 'Explore advanced techniques and expert strategies for achieving Band 7+ scores. Learn sophisticated listening methods, master complex question types, develop advanced vocabulary recognition, and refine your test-taking approach. Perfect for students aiming for high band scores.'
                WHEN 'reading' THEN 'Explore advanced techniques and expert strategies for achieving Band 7+ scores. Learn sophisticated reading methods, master complex question types, develop advanced vocabulary skills, and refine your test-taking approach. Perfect for students aiming for high band scores.'
                WHEN 'writing' THEN 'Explore advanced techniques and expert strategies for achieving Band 7+ scores. Learn sophisticated writing methods, master complex language use, develop advanced vocabulary, and refine your essay structure. Perfect for students aiming for high band scores.'
                WHEN 'speaking' THEN 'Explore advanced techniques and expert strategies for achieving Band 7+ scores. Learn sophisticated speaking methods, master complex language use, develop advanced vocabulary, and refine your fluency and pronunciation. Perfect for students aiming for high band scores.'
                ELSE 'Explore advanced techniques and expert strategies for achieving Band 7+ scores. Perfect for students aiming for high band scores.'
            END
        WHEN 5 THEN
            CASE c.skill_type
                WHEN 'listening' THEN 'Consolidate your learning and prepare for test day in this final module. Review key strategies, practice with full test simulations, receive final tips and advice, and build confidence for your IELTS Listening test. Ensure you are fully prepared and ready to achieve your target band score.'
                WHEN 'reading' THEN 'Consolidate your learning and prepare for test day in this final module. Review key strategies, practice with full test simulations, receive final tips and advice, and build confidence for your IELTS Reading test. Ensure you are fully prepared and ready to achieve your target band score.'
                WHEN 'writing' THEN 'Consolidate your learning and prepare for test day in this final module. Review key strategies, practice with full test simulations, receive final tips and advice, and build confidence for your IELTS Writing test. Ensure you are fully prepared and ready to achieve your target band score.'
                WHEN 'speaking' THEN 'Consolidate your learning and prepare for test day in this final module. Review key strategies, practice with full test simulations, receive final tips and advice, and build confidence for your IELTS Speaking test. Ensure you are fully prepared and ready to achieve your target band score.'
                ELSE 'Consolidate your learning and prepare for test day. Review key strategies and build confidence for your IELTS test.'
            END
        ELSE 'Additional practice materials and exercises to reinforce your learning and improve your performance.'
    END,
    module_num,
    c.duration_hours / (CASE WHEN c.total_lessons > 20 THEN 5 ELSE 3 END),
    CASE 
        WHEN c.total_lessons >= 20 THEN (c.total_lessons / 4)::INTEGER
        ELSE (c.total_lessons / 3)::INTEGER
    END,
    true
FROM courses c
CROSS JOIN generate_series(1, 
    CASE 
        WHEN c.total_lessons >= 20 THEN 5
        WHEN c.total_lessons >= 12 THEN 4
        ELSE 3
    END
) module_num
WHERE c.status = 'published';

-- ============================================
-- 3. LESSONS
-- ============================================

INSERT INTO lessons (
    id, module_id, course_id, title, description, content_type, duration_minutes,
    display_order, is_free, is_published
)
SELECT 
    uuid_generate_v4(),
    m.id,
    m.course_id,
    -- Diverse lesson titles based on skill type and lesson number
    COALESCE(
    CASE c.skill_type
        WHEN 'listening' THEN
            CASE lesson_num
                WHEN 1 THEN (ARRAY['Introduction to IELTS Listening', 'Getting Started with Listening Skills', 'IELTS Listening Overview', 'Understanding the Listening Test'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 2 THEN (ARRAY['Listening Test Format Explained', 'Understanding Question Types', 'Test Structure & Timing', 'How the Listening Test Works'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 3 THEN (ARRAY['Essential Listening Strategies', 'Key Skills for Success', 'Mastering Listening Techniques', 'Proven Listening Methods'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 4 THEN (ARRAY['Common Question Types', 'All Question Formats', 'Question Type Mastery', 'Understanding Different Questions'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 5 THEN (ARRAY['Practice Exercise 1: Part 1', 'Practice Test: Form Completion', 'Exercise: Basic Information', 'Practice: Introduction Section'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 6 THEN (ARRAY['Practice Exercise 2: Part 2', 'Practice Test: Multiple Choice', 'Exercise: Detailed Understanding', 'Practice: Conversation Section'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 7 THEN (ARRAY['Advanced Listening Techniques', 'Expert Strategies', 'Band 7+ Techniques', 'Advanced Skills Mastery'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 8 THEN (ARRAY['Review & Final Tips', 'Test Day Preparation', 'Summary & Key Points', 'Last-Minute Strategies'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                ELSE 
                    CASE 
                        WHEN lesson_num % 3 = 0 THEN (ARRAY['Advanced Listening Practice', 'Expert Listening Techniques', 'Listening Mastery Session', 'Advanced Listening Skills'])[1 + ((lesson_num - 9) % 4)]
                        WHEN lesson_num % 3 = 1 THEN (ARRAY['Listening Strategy Deep Dive', 'Technique Mastery: Listening', 'Skill Building: Listening', 'Listening Method Enhancement'])[1 + ((lesson_num - 9) % 4)]
                        ELSE (ARRAY['Comprehensive Listening Review', 'Listening Consolidation Practice', 'Integrated Listening Practice', 'Full Listening Test Preparation'])[1 + ((lesson_num - 9) % 4)]
                    END || ': ' || (ARRAY['Note-Taking', 'Predicting Answers', 'Dealing with Distractors', 'Time Management'])[1 + ((lesson_num - 9) % 4)]
            END
        WHEN 'reading' THEN
            CASE lesson_num
                WHEN 1 THEN (ARRAY['Introduction to IELTS Reading', 'Reading Test Overview', 'Understanding Reading Skills', 'Getting Started with Reading'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 2 THEN (ARRAY['Reading Test Format', 'Understanding Passage Types', 'Test Structure Explained', 'Reading Test Components'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 3 THEN (ARRAY['Essential Reading Strategies', 'Key Techniques for Success', 'Mastering Reading Skills', 'Core Reading Methods'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 4 THEN (ARRAY['All Question Types Covered', 'Question Formats Explained', 'Understanding Question Types', 'Mastering Question Formats'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 5 THEN (ARRAY['Practice Exercise 1: Passage 1', 'Practice Test: Matching Headings', 'Exercise: Skimming & Scanning', 'Practice: Basic Comprehension'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 6 THEN (ARRAY['Practice Exercise 2: Passage 2', 'Practice Test: True/False/Not Given', 'Exercise: Detailed Analysis', 'Practice: Inference Skills'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 7 THEN (ARRAY['Advanced Reading Techniques', 'Expert Strategies', 'Band 7+ Methods', 'Advanced Comprehension'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 8 THEN (ARRAY['Review & Test Tips', 'Final Preparation', 'Key Points Summary', 'Last-Minute Advice'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                ELSE 
                    CASE 
                        WHEN lesson_num % 3 = 0 THEN (ARRAY['Advanced Reading Practice', 'Expert Reading Techniques', 'Reading Mastery Session', 'Advanced Reading Skills'])[1 + ((lesson_num - 9) % 4)]
                        WHEN lesson_num % 3 = 1 THEN (ARRAY['Reading Strategy Deep Dive', 'Technique Mastery: Reading', 'Skill Building: Reading', 'Reading Method Enhancement'])[1 + ((lesson_num - 9) % 4)]
                        ELSE (ARRAY['Comprehensive Reading Review', 'Reading Consolidation Practice', 'Integrated Reading Practice', 'Full Reading Test Preparation'])[1 + ((lesson_num - 9) % 4)]
                    END || ': ' || (ARRAY['Vocabulary in Context', 'Complex Sentences', 'Speed Reading', 'Answer Location'])[1 + ((lesson_num - 9) % 4)]
            END
        WHEN 'writing' THEN
            CASE lesson_num
                WHEN 1 THEN (ARRAY['Introduction to IELTS Writing', 'Writing Test Overview', 'Understanding Writing Tasks', 'Getting Started with Writing'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 2 THEN (ARRAY['Writing Test Format', 'Task Types Explained', 'Understanding Assessment Criteria', 'Writing Test Structure'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 3 THEN (ARRAY['Essential Writing Strategies', 'Key Techniques for High Scores', 'Mastering Writing Skills', 'Core Writing Methods'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 4 THEN (ARRAY['Task 1 vs Task 2', 'Understanding Both Tasks', 'Task Requirements', 'Task Differences'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 5 THEN (ARRAY['Practice Exercise 1: Task 1', 'Practice: Describing Data', 'Exercise: Charts & Graphs', 'Practice: Visual Information'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 6 THEN (ARRAY['Practice Exercise 2: Task 2', 'Practice: Essay Writing', 'Exercise: Argument Development', 'Practice: Opinion Essays'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 7 THEN (ARRAY['Advanced Writing Techniques', 'Expert Strategies', 'Band 7+ Writing', 'Advanced Language Use'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 8 THEN (ARRAY['Review & Writing Tips', 'Final Preparation', 'Key Points Summary', 'Last-Minute Strategies'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                ELSE 
                    CASE 
                        WHEN lesson_num % 3 = 0 THEN (ARRAY['Advanced Writing Practice', 'Expert Writing Techniques', 'Writing Mastery Session', 'Advanced Writing Skills'])[1 + ((lesson_num - 9) % 4)]
                        WHEN lesson_num % 3 = 1 THEN (ARRAY['Writing Strategy Deep Dive', 'Technique Mastery: Writing', 'Skill Building: Writing', 'Writing Method Enhancement'])[1 + ((lesson_num - 9) % 4)]
                        ELSE (ARRAY['Comprehensive Writing Review', 'Writing Consolidation Practice', 'Integrated Writing Practice', 'Full Writing Test Preparation'])[1 + ((lesson_num - 9) % 4)]
                    END || ': ' || (ARRAY['Grammar & Accuracy', 'Coherence & Cohesion', 'Lexical Resource', 'Task Achievement'])[1 + ((lesson_num - 9) % 4)]
            END
        WHEN 'speaking' THEN
            CASE lesson_num
                WHEN 1 THEN (ARRAY['Introduction to IELTS Speaking', 'Speaking Test Overview', 'Understanding Speaking Skills', 'Getting Started with Speaking'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 2 THEN (ARRAY['Speaking Test Format', 'All Three Parts Explained', 'Understanding the Test Structure', 'Speaking Test Components'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 3 THEN (ARRAY['Essential Speaking Strategies', 'Key Techniques for Fluency', 'Mastering Speaking Skills', 'Core Communication Methods'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 4 THEN (ARRAY['Common Topics & Questions', 'Popular Speaking Topics', 'Question Types Explained', 'Understanding Topics'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 5 THEN (ARRAY['Practice Exercise 1: Part 1', 'Practice: Personal Questions', 'Exercise: Introduction & Interview', 'Practice: Familiar Topics'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 6 THEN (ARRAY['Practice Exercise 2: Part 2', 'Practice: Long Turn', 'Exercise: Individual Presentation', 'Practice: Cue Card Topics'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 7 THEN (ARRAY['Advanced Speaking Techniques', 'Expert Strategies', 'Band 7+ Speaking', 'Advanced Fluency'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 8 THEN (ARRAY['Review & Speaking Tips', 'Final Preparation', 'Key Points Summary', 'Last-Minute Advice'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                ELSE 
                    CASE 
                        WHEN lesson_num % 3 = 0 THEN (ARRAY['Advanced Speaking Practice', 'Expert Speaking Techniques', 'Speaking Mastery Session', 'Advanced Speaking Skills'])[1 + ((lesson_num - 9) % 4)]
                        WHEN lesson_num % 3 = 1 THEN (ARRAY['Speaking Strategy Deep Dive', 'Technique Mastery: Speaking', 'Skill Building: Speaking', 'Speaking Method Enhancement'])[1 + ((lesson_num - 9) % 4)]
                        ELSE (ARRAY['Comprehensive Speaking Review', 'Speaking Consolidation Practice', 'Integrated Speaking Practice', 'Full Speaking Test Preparation'])[1 + ((lesson_num - 9) % 4)]
                    END || ': ' || (ARRAY['Pronunciation & Intonation', 'Grammar & Vocabulary', 'Fluency & Coherence', 'Lexical Resource'])[1 + ((lesson_num - 9) % 4)]
            END
        WHEN 'general' THEN
            CASE lesson_num
                WHEN 1 THEN (ARRAY['Introduction to IELTS', 'IELTS Overview', 'Getting Started with IELTS', 'Understanding IELTS'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 2 THEN (ARRAY['IELTS Test Format Explained', 'Understanding All Sections', 'Test Structure Overview', 'Complete Test Guide'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 3 THEN (ARRAY['Essential IELTS Strategies', 'Key Techniques for Success', 'Mastering IELTS Skills', 'Core Preparation Methods'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 4 THEN (ARRAY['Question Types Overview', 'All Question Formats', 'Understanding Question Types', 'Question Type Mastery'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 5 THEN (ARRAY['Practice Exercise 1', 'Practice Test: Section 1', 'Exercise: Basic Skills', 'Practice: Introduction'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 6 THEN (ARRAY['Practice Exercise 2', 'Practice Test: Section 2', 'Exercise: Intermediate Skills', 'Practice: Development'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 7 THEN (ARRAY['Advanced IELTS Techniques', 'Expert Strategies', 'Band 7+ Methods', 'Advanced Skills'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                WHEN 8 THEN (ARRAY['Review & Final Tips', 'Test Day Preparation', 'Summary & Key Points', 'Last-Minute Strategies'])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                ELSE 
                    CASE 
                        WHEN lesson_num % 3 = 0 THEN (ARRAY['Advanced Practice Session', 'Expert Techniques Practice', 'Mastery Workshop', 'Advanced Skill Development'])[1 + ((lesson_num - 9) % 4)]
                        WHEN lesson_num % 3 = 1 THEN (ARRAY['Strategy Deep Dive', 'Technique Mastery', 'Skill Building Session', 'Method Enhancement'])[1 + ((lesson_num - 9) % 4)]
                        ELSE (ARRAY['Comprehensive Review', 'Consolidation Practice', 'Integrated Skills Practice', 'Full Test Preparation'])[1 + ((lesson_num - 9) % 4)]
                    END
            END
        ELSE
            CASE lesson_num
                WHEN 1 THEN 'Introduction to IELTS'
                WHEN 2 THEN 'Understanding IELTS Format'
                WHEN 3 THEN 'Key Strategies'
                WHEN 4 THEN 'Question Types'
                WHEN 5 THEN 'Practice Exercise 1'
                WHEN 6 THEN 'Practice Exercise 2'
                WHEN 7 THEN 'Advanced Techniques'
                WHEN 8 THEN 'Review & Tips'
                ELSE 
                    CASE 
                        WHEN lesson_num % 3 = 0 THEN (ARRAY['Advanced Practice Session', 'Expert Techniques Practice', 'Mastery Workshop', 'Advanced Skill Development'])[1 + ((lesson_num - 9) % 4)]
                        WHEN lesson_num % 3 = 1 THEN (ARRAY['Strategy Deep Dive', 'Technique Mastery', 'Skill Building Session', 'Method Enhancement'])[1 + ((lesson_num - 9) % 4)]
                        ELSE (ARRAY['Comprehensive Review', 'Consolidation Practice', 'Integrated Skills Practice', 'Full Test Preparation'])[1 + ((lesson_num - 9) % 4)]
                    END
            END
    END,
    COALESCE(
        CASE c.skill_type
            WHEN 'listening' THEN 'Listening Practice ' || COALESCE(lesson_num::text, '0')
            WHEN 'reading' THEN 'Reading Practice ' || COALESCE(lesson_num::text, '0')
            WHEN 'writing' THEN 'Writing Practice ' || COALESCE(lesson_num::text, '0')
            WHEN 'speaking' THEN 'Speaking Practice ' || COALESCE(lesson_num::text, '0')
            WHEN 'general' THEN 'IELTS Practice ' || COALESCE(lesson_num::text, '0')
            ELSE 'Lesson ' || COALESCE(lesson_num::text, '0') || ': IELTS Practice'
        END,
        'Lesson ' || COALESCE(lesson_num::text, '0') || ': IELTS Practice'
    )
    ) as title,
    -- Diverse lesson descriptions with detailed article content for article/mixed lessons
    CASE 
        WHEN lesson_num % 3 = 2 THEN -- Article lessons
            CASE c.skill_type
                WHEN 'listening' THEN
                    CASE lesson_num
                        WHEN 1 THEN (ARRAY[
                            '<h2>Introduction to IELTS Listening</h2><p>The IELTS Listening test is designed to assess your ability to understand spoken English in various contexts. This comprehensive guide will help you understand what to expect, how the test is structured, and essential strategies for success.</p><h3>Test Overview</h3><p>The listening test consists of four sections, each becoming progressively more difficult. You will hear each recording only once, so it is crucial to develop strong listening skills and effective note-taking techniques. The test lasts approximately 30 minutes, followed by 10 minutes to transfer your answers to the answer sheet.</p><h3>What You Will Learn</h3><ul><li>Understanding the four sections of the listening test</li><li>Common question types and how to approach them</li><li>Effective prediction and note-taking strategies</li><li>Time management techniques</li><li>How to avoid common mistakes</li></ul><h3>Preparing for Success</h3><p>Success in IELTS Listening requires consistent practice with authentic materials, exposure to various accents, and developing the ability to identify key information quickly. This course will guide you through each step of your preparation journey.</p>',
                            '<h2>Getting Started with IELTS Listening Skills</h2><p>Welcome to your IELTS Listening preparation journey! This lesson provides a comprehensive introduction to the listening test format, scoring system, and fundamental skills you need to develop.</p><h3>Test Structure</h3><p>The IELTS Listening test is divided into four parts: Part 1 focuses on everyday social situations, Part 2 involves monologues about general topics, Part 3 features conversations in educational contexts, and Part 4 presents academic lectures or talks. Each part contains 10 questions, totaling 40 questions overall.</p><h3>Scoring System</h3><p>Each correct answer receives one mark. Your raw score out of 40 is converted to a band score ranging from 0 to 9. To achieve Band 6.5, you typically need 26-29 correct answers, while Band 7 requires 30-31 correct answers.</p><h3>Key Skills to Develop</h3><ul><li>Predicting information before listening</li><li>Identifying main ideas and specific details</li><li>Understanding speaker attitudes and opinions</li><li>Following the development of ideas</li><li>Recognizing synonyms and paraphrasing</li></ul><h3>Time Management</h3><p>You have 30 minutes to listen and answer questions, plus 10 minutes to transfer answers. Use the time before each section to read questions carefully and predict possible answers. This preparation time is crucial for your success.</p>',
                            '<h2>IELTS Listening Overview</h2><p>Understanding the IELTS Listening test structure is the first step toward achieving your target band score. This comprehensive overview covers everything you need to know to start your preparation effectively.</p><h3>The Four Sections</h3><p><strong>Section 1:</strong> A conversation between two people in an everyday social context, such as booking accommodation or discussing travel arrangements. This section tests your ability to understand factual information.</p><p><strong>Section 2:</strong> A monologue in a social context, such as a speech about local facilities or a guided tour. You need to identify specific information and follow detailed instructions.</p><p><strong>Section 3:</strong> A conversation between up to four people in an educational context, such as students discussing an assignment or a tutor giving feedback. This section requires understanding of opinions and detailed explanations.</p><p><strong>Section 4:</strong> A monologue on an academic topic, such as a university lecture. This is the most challenging section, testing your ability to follow complex arguments and academic vocabulary.</p><h3>Question Types</h3><p>Throughout the test, you will encounter various question types including multiple choice, matching, plan/map/diagram labeling, form/note/table/flow-chart/summary completion, and sentence completion. Each type requires specific strategies.</p><h3>Test Format</h3><p>The recordings use a variety of accents, including British, Australian, New Zealand, American, and Canadian. You will hear each recording only once, making it essential to develop strong listening skills and concentration abilities.</p>',
                            '<h2>Understanding the Listening Test</h2><p>The IELTS Listening test evaluates your ability to comprehend spoken English across a range of contexts. This lesson provides essential information about test format, timing, and assessment criteria.</p><h3>Test Duration and Format</h3><p>The listening test takes approximately 40 minutes total: 30 minutes for listening and answering questions, plus 10 minutes to transfer your answers to the answer sheet. The test includes four sections with 10 questions each, covering a range of topics from everyday conversations to academic lectures.</p><h3>What Makes This Test Challenging</h3><p>Several factors contribute to the difficulty of the listening test: you hear each recording only once, the topics become progressively more complex, accents vary throughout the test, and question types require different skills. However, with proper preparation and practice, you can overcome these challenges.</p><h3>Assessment Criteria</h3><p>Your listening skills are assessed based on your ability to: understand main ideas and specific factual information, recognize opinions and attitudes, follow the development of an argument, and understand the purpose of utterances and speaker interactions.</p><h3>Common Topics</h3><p>Section 1 and 2 typically cover everyday topics such as accommodation, travel, work, health, and entertainment. Section 3 focuses on educational contexts like course discussions, assignment feedback, and study groups. Section 4 presents academic topics from various fields including science, history, psychology, and environmental studies.</p><h3>Next Steps</h3><p>After understanding the test format, you will learn specific strategies for each section, practice with authentic materials, and develop techniques to improve your listening accuracy and speed. Consistent practice is key to success.</p>'
                        ])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                        WHEN 2 THEN (ARRAY[
                            '<h2>Listening Test Format Explained</h2><p>The IELTS Listening test follows a specific structure that becomes progressively more challenging. Understanding this format is essential for effective preparation and test performance.</p><h3>Section Breakdown</h3><p><strong>Section 1 - Social Conversation:</strong> This section features a conversation between two people in an everyday social context. Topics typically include accommodation booking, travel arrangements, joining a club, or making appointments. The dialogue is usually straightforward, focusing on factual information exchange.</p><p><strong>Section 2 - Social Monologue:</strong> A single speaker provides information about everyday topics such as local facilities, tourist attractions, or event information. This section tests your ability to follow detailed instructions and identify specific information.</p><p><strong>Section 3 - Educational Discussion:</strong> Up to four people discuss academic topics, often involving students and tutors. Common scenarios include assignment discussions, project planning, course feedback, and study group conversations. This section requires understanding opinions, explanations, and reasoning.</p><p><strong>Section 4 - Academic Lecture:</strong> A monologue on an academic subject, similar to a university lecture. Topics range from history and science to psychology and environmental studies. This is the most challenging section, requiring comprehension of complex ideas and academic vocabulary.</p><h3>Question Distribution</h3><p>Each section contains exactly 10 questions, with question types varying throughout the test. Section 1 and 2 typically feature simpler question types like form completion and multiple choice, while Section 3 and 4 include more complex types such as matching and summary completion.</p><h3>Timing Strategy</h3><p>You have 30 minutes to listen and answer questions, plus 10 minutes to transfer answers. Use the time before each section to read questions carefully, underline keywords, and predict possible answers. This preparation significantly improves your chances of success.</p>',
                            '<h2>Understanding Question Types</h2><p>Mastering different question types is crucial for IELTS Listening success. Each question type requires specific strategies and skills. This lesson provides comprehensive coverage of all question formats you will encounter.</p><h3>Form Completion</h3><p>This question type requires you to complete forms, notes, or tables with information from the recording. Common contexts include booking forms, registration forms, and information sheets. Key strategies include: listening for specific details, paying attention to spelling and numbers, and recognizing paraphrasing of question words.</p><h3>Multiple Choice</h3><p>You choose the correct answer from three or four options. These questions test your ability to understand main ideas, specific details, and speaker attitudes. Important techniques include: eliminating obviously wrong answers, listening for paraphrased information, and being aware of distractors.</p><h3>Matching</h3><p>You match items from a list to options or categories. This tests your ability to understand relationships and connections. Strategies include: listening for key words and phrases, understanding context and relationships, and matching based on meaning rather than exact words.</p><h3>Map/Plan/Diagram Labeling</h3><p>You label locations on a map, plan, or diagram based on the recording. This requires spatial understanding and following directions. Key skills include: understanding directional language, following sequences, and visualizing spatial relationships.</p><h3>Summary Completion</h3><p>You complete a summary with words from the recording or from a given list. This tests your ability to understand main ideas and follow the development of ideas. Important strategies include: understanding the overall meaning, identifying key information, and maintaining grammatical accuracy.</p><h3>Sentence Completion</h3><p>You complete sentences with words from the recording. This tests your ability to understand specific information and maintain grammatical accuracy. Focus on: listening for exact words when required, understanding context for word choice, and checking grammar and spelling.</p>',
                            '<h2>Test Structure & Timing</h2><p>Effective time management is essential for IELTS Listening success. Understanding the test structure and timing requirements helps you allocate your attention and effort appropriately throughout the test.</p><h3>Overall Test Structure</h3><p>The IELTS Listening test consists of four sections, each lasting approximately 7-8 minutes. Section 1 is the easiest and most straightforward, while Section 4 is the most challenging. The difficulty increases gradually, allowing you to build confidence before facing more complex material.</p><h3>Time Allocation</h3><p>You have 30 minutes to listen to all four sections and answer 40 questions. Each section includes time before the recording starts to read questions, and time after to check answers. During the 10-minute transfer time, you move your answers to the official answer sheet.</p><h3>Reading Time</h3><p>Before each section, you are given time to read the questions. Use this time effectively by: reading all questions carefully, underlining keywords and important information, predicting possible answers based on question words, and identifying what type of information you need to listen for.</p><h3>During Listening</h3><p>While listening, focus on: following the recording without getting stuck on missed answers, keeping track of where you are in the questions, writing answers directly on the question paper, and moving on if you miss an answer.</p><h3>Transfer Time</h3><p>The final 10 minutes are crucial for transferring answers accurately. Use this time to: transfer all answers carefully, check spelling and grammar, ensure answers fit grammatically, and verify that all questions have been attempted.</p><h3>Common Timing Mistakes</h3><p>Avoid these common errors: spending too much time on difficult questions, trying to understand every word, writing answers in full sentences during listening, and leaving questions blank. Remember, unanswered questions receive zero marks.</p>',
                            '<h2>How the Listening Test Works</h2><p>Understanding how the IELTS Listening test operates helps you prepare effectively and perform confidently on test day. This lesson covers the mechanics of the test, what to expect, and how to use the format to your advantage.</p><h3>Test Mechanics</h3><p>The listening test is played through headphones or speakers in the test center. You hear each recording only once, making it essential to listen actively and take notes effectively. The recordings feature various accents including British, Australian, New Zealand, American, and Canadian English.</p><h3>Question Paper Format</h3><p>Questions appear in order on your question paper. You write answers directly on the question paper during the 30-minute listening period. After the recordings finish, you have 10 minutes to transfer answers to the official answer sheet. This transfer time is crucial - use it wisely.</p><h3>Answer Requirements</h3><p>Most answers require words or numbers from the recording. Some questions specify the maximum number of words (e.g., "Write NO MORE THAN THREE WORDS"). Always follow these instructions carefully. Spelling must be correct for British or American English, depending on the context.</p><h3>Scoring System</h3><p>Each question is worth one mark. There are no half marks. Your raw score out of 40 is converted to a band score from 0 to 9.0. The conversion varies slightly between test versions, but generally: Band 6.0 = 23-25 correct, Band 6.5 = 26-29 correct, Band 7.0 = 30-31 correct, Band 7.5 = 32-34 correct, Band 8.0 = 35-36 correct.</p><h3>Test Environment</h3><p>On test day, arrive early to familiarize yourself with the environment. You will sit in a quiet room with other test takers. The audio quality is clear, but you cannot control the volume or replay any sections. Practice under similar conditions to build familiarity.</p><h3>Preparation Tips</h3><p>Effective preparation involves: listening to a variety of English accents, practicing with authentic IELTS materials, developing note-taking skills, building vocabulary across different topics, and taking practice tests under timed conditions. Regular practice builds confidence and improves performance.</p>'
                        ])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
                        WHEN 3 THEN '<h2>Essential Listening Strategies</h2><p>Mastering effective listening strategies is crucial for achieving high scores in IELTS Listening. This lesson introduces proven techniques that will significantly improve your performance.</p><h3>Prediction Strategies</h3><p>Before listening, use the question context to predict possible answers. Look at question words (who, what, where, when, why, how) and the surrounding context to anticipate the type of information you need. This mental preparation helps you focus on relevant information.</p><h3>Keyword Recognition</h3><p>Identify keywords in questions and listen for synonyms and paraphrased versions in the recording. Speakers often use different words to express the same meaning. Developing this skill helps you locate answers even when exact words are not used.</p><h3>Note-Taking Techniques</h3><p>Develop a personal shorthand system for taking notes quickly. Focus on: key information (names, numbers, dates), main ideas, and important details. Don''t try to write everything - prioritize information that directly answers questions.</p><h3>Dealing with Distractors</h3><p>Be aware that speakers may mention incorrect answers before giving the correct one. Listen carefully for information that contradicts or corrects previous statements. The final answer is often the most accurate.</p><h3>Practice Tips</h3><p>Regular practice with authentic IELTS materials is essential. Focus on: listening to various accents, practicing with different question types, timing yourself during practice, and reviewing your mistakes to identify patterns.</p>'
                        WHEN 4 THEN '<h2>Common Question Types</h2><p>Understanding different question types helps you apply appropriate strategies for each format. This comprehensive guide covers all question types you will encounter in IELTS Listening.</p><h3>Multiple Choice Questions</h3><p>These questions test your ability to understand main ideas, specific details, and speaker attitudes. Strategies include: reading all options carefully before listening, eliminating obviously wrong answers, listening for paraphrased information, and being aware of distractors.</p><h3>Matching Questions</h3><p>You match items from a list to speakers, places, or categories. Key strategies: listen for relationships and connections, understand context, match based on meaning rather than exact words, and pay attention to speakers'' opinions and attitudes.</p><h3>Form/Note/Table Completion</h3><p>Complete forms, notes, or tables with information from the recording. Focus on: listening for specific details, paying attention to spelling and numbers, following the order of information, and recognizing paraphrasing.</p><h3>Map/Plan/Diagram Labeling</h3><p>Label locations on visual materials based on the recording. Skills needed: understanding directional language (left, right, north, south), following sequences, visualizing spatial relationships, and recognizing location vocabulary.</p><h3>Sentence Completion</h3><p>Complete sentences with words from the recording. Important points: maintain grammatical accuracy, listen for exact words when required, understand context for word choice, and check spelling carefully.</p><h3>Summary Completion</h3><p>Complete summaries with words from the recording or a given list. Strategies: understand overall meaning, identify key information, maintain grammatical accuracy, and follow the development of ideas.</p>'
                        WHEN 5 THEN '<h2>Practice Exercise 1: Part 1 Listening</h2><p>This practice exercise focuses on Part 1 of the IELTS Listening test, which typically features conversations in everyday social contexts. Work through this exercise to develop your skills.</p><h3>Exercise Overview</h3><p>Part 1 usually involves a conversation between two people discussing practical matters such as booking accommodation, making travel arrangements, or joining a club. The dialogue is straightforward and focuses on factual information exchange.</p><h3>What to Expect</h3><p>Common topics include: accommodation (booking hotels, renting apartments), travel (booking flights, train tickets), services (joining gyms, libraries), and appointments (making reservations, scheduling meetings).</p><h3>Key Skills to Practice</h3><ul><li>Listening for specific details (names, addresses, phone numbers)</li><li>Understanding numbers and dates</li><li>Recognizing spelling (especially names)</li><li>Following question order</li><li>Identifying key information quickly</li></ul><h3>Common Challenges</h3><p>Part 1 can be challenging because: speakers may spell names or addresses quickly, numbers may be mentioned multiple times, and information may be corrected or changed during the conversation.</p><h3>After Completing the Exercise</h3><p>Review your answers carefully, identify any mistakes, and understand why the correct answers are correct. This reflection helps you learn from practice and improve your performance.</p>'
                        WHEN 6 THEN '<h2>Practice Exercise 2: Part 2 Listening</h2><p>This practice exercise focuses on Part 2, which features a monologue in a social context. Develop your skills in following detailed information and instructions.</p><h3>Exercise Overview</h3><p>Part 2 typically involves a single speaker providing information about everyday topics such as local facilities, tourist attractions, event information, or guided tours. The speaker provides detailed information that you need to identify and understand.</p><h3>Common Scenarios</h3><p>Typical Part 2 scenarios include: tourist information talks, facility introductions (museums, libraries, sports centers), event announcements, and service descriptions.</p><h3>Key Skills to Develop</h3><ul><li>Following detailed instructions</li><li>Identifying specific information</li><li>Understanding descriptions and explanations</li><li>Recognizing organizational patterns</li><li>Following the development of ideas</li></ul><h3>Question Types</h3><p>Part 2 often includes: multiple choice questions, matching questions, and completion tasks. You need to listen carefully for details while maintaining understanding of the overall context.</p><h3>Strategy Tips</h3><p>Before listening, read all questions carefully and predict possible answers. During listening, follow the speaker''s organization and keep track of where you are in the questions. Don''t get stuck on missed answers - keep moving forward.</p>'
                        WHEN 7 THEN '<h2>Advanced Listening Techniques</h2><p>This lesson covers advanced techniques for achieving Band 7+ scores in IELTS Listening. These strategies will help you handle complex questions and improve your accuracy.</p><h3>Advanced Prediction</h3><p>Develop sophisticated prediction skills by analyzing question patterns, understanding context deeply, and anticipating not just answers but also how they might be expressed. This mental preparation significantly improves your focus and accuracy.</p><h3>Dealing with Fast Speech</h3><p>Speakers may speak quickly, especially in Parts 3 and 4. Techniques to handle this include: focusing on content words (nouns, verbs, adjectives), ignoring filler words, maintaining concentration, and not trying to understand every single word.</p><h3>Understanding Complex Ideas</h3><p>Parts 3 and 4 require understanding of complex academic concepts. Develop skills in: following arguments and explanations, understanding cause-and-effect relationships, recognizing speaker attitudes and opinions, and identifying main ideas and supporting details.</p><h3>Vocabulary Building</h3><p>Academic vocabulary is crucial for Parts 3 and 4. Focus on: building vocabulary across academic topics, understanding word families and forms, recognizing synonyms and paraphrasing, and understanding academic discourse markers.</p><h3>Error Avoidance</h3><p>Common mistakes to avoid: writing answers that don''t fit grammatically, misspelling words, exceeding word limits, writing answers in the wrong format, and leaving questions blank. Always check your answers carefully.</p><h3>Time Management</h3><p>Effective time management involves: using reading time effectively, moving on if you miss an answer, checking answers during transfer time, and ensuring all questions are attempted.</p>'
                        WHEN 8 THEN '<h2>Review & Final Tips</h2><p>This final lesson reviews key strategies and provides essential tips for test day success. Consolidate your learning and prepare confidently for your IELTS Listening test.</p><h3>Key Strategies Review</h3><p>Remember the essential strategies: prediction before listening, keyword recognition and synonym awareness, effective note-taking, managing distractors, and maintaining focus throughout the test.</p><h3>Common Mistakes to Avoid</h3><ul><li>Not reading questions before listening</li><li>Trying to understand every word</li><li>Getting stuck on difficult questions</li><li>Writing answers that don''t fit grammatically</li><li>Leaving questions blank</li><li>Poor spelling and grammar</li><li>Not using transfer time effectively</li></ul><h3>Test Day Preparation</h3><p>On test day: arrive early, bring required identification, familiarize yourself with the test environment, listen to sample audio to test equipment, and stay calm and focused. Remember, preparation builds confidence.</p><h3>During the Test</h3><p>Follow these guidelines: use all reading time effectively, predict answers before listening, write answers clearly on question paper, keep track of where you are, move on if you miss an answer, and use transfer time wisely.</p><h3>Final Checklist</h3><p>Before submitting: check spelling and grammar, ensure answers fit grammatically, verify word limits are followed, confirm all questions are attempted, and transfer answers carefully to the answer sheet.</p><h3>Remember</h3><p>Success in IELTS Listening comes from consistent practice, understanding test format, applying effective strategies, and maintaining confidence. Trust your preparation and perform your best!</p>'
                        ELSE '<h2>' || (ARRAY['Listening Practice', 'Advanced Listening Strategies', 'Skill Development', 'Test Preparation'])[1 + ((lesson_num - 1) % 4)] || '</h2><p>This comprehensive article lesson provides detailed information and practical strategies to help you succeed in IELTS Listening. Through carefully structured content, examples, and exercises, you will develop the skills necessary to achieve your target band score.</p><h3>Key Concepts</h3><p>The lesson covers essential listening strategies, common question types, and effective techniques for identifying key information. You will learn how to predict answers, recognize paraphrasing, and manage your time effectively throughout the test.</p><h3>Understanding Question Types</h3><p>Master different question types including multiple choice, matching, form completion, map/plan/diagram labeling, and sentence completion. Each type requires specific strategies and skills that you will develop through practice.</p><h3>Practical Application</h3><p>Practice exercises and examples are included to help you apply the strategies discussed. Work through each section carefully, taking notes and identifying areas where you need additional practice.</p><h3>Next Steps</h3><p>After completing this lesson, continue to the next module to build upon these foundational skills. Regular practice with authentic IELTS materials will reinforce your learning and improve your listening abilities.</p>'
                    END
                WHEN 'reading' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Reading</h2><p>The IELTS Reading test assesses your ability to understand written English across a range of text types and topics. This comprehensive introduction covers everything you need to know to begin your preparation effectively.</p><h3>Test Overview</h3><p>The reading test consists of three passages with increasing difficulty, totaling 40 questions. You have 60 minutes to read all passages and answer all questions. Time management is crucial as you cannot return to previous sections after moving on.</p><h3>What You Will Learn</h3><ul><li>Understanding the three passages and their characteristics</li><li>All question types and specific strategies for each</li><li>Effective reading techniques (skimming, scanning, detailed reading)</li><li>Time management strategies</li><li>Vocabulary building techniques</li></ul><h3>Passage Types</h3><p>Passages cover a wide range of topics including science, technology, history, psychology, environmental studies, and more. Passage 1 is typically the easiest, while Passage 3 is the most challenging, requiring sophisticated reading skills.</p><h3>Question Distribution</h3><p>Questions are distributed across the three passages, with Passage 1 usually containing simpler questions and Passage 3 containing more complex inference and analysis questions. Understanding this distribution helps you allocate time effectively.</p><h3>Scoring System</h3><p>Each correct answer receives one mark. Your raw score out of 40 is converted to a band score. Generally, Band 6.5 requires 27-29 correct answers, while Band 7 requires 30-32 correct answers.</p>'
                        WHEN 2 THEN '<h2>Reading Test Format</h2><p>Understanding the IELTS Reading test format is essential for effective preparation. This lesson provides detailed information about passage types, question formats, and test structure.</p><h3>The Three Passages</h3><p><strong>Passage 1:</strong> Typically contains factual, descriptive, or narrative texts on everyday topics. The language is straightforward, and questions focus on locating specific information.</p><p><strong>Passage 2:</strong> Usually features descriptive or argumentative texts on general interest topics. The language becomes more complex, and questions may require understanding opinions and arguments.</p><p><strong>Passage 3:</strong> Contains complex argumentative or analytical texts on academic topics. The language is sophisticated, and questions often require inference, analysis, and understanding of writer''s attitudes.</p><h3>Question Types</h3><p>You will encounter various question types including: multiple choice, True/False/Not Given, Yes/No/Not Given, matching headings, matching information, sentence completion, summary completion, and short answer questions.</p><h3>Time Allocation</h3><p>Effective time management is crucial. Recommended allocation: Passage 1 (15-17 minutes), Passage 2 (20-22 minutes), Passage 3 (23-25 minutes). Always leave time for checking answers.</p><h3>Answer Format</h3><p>Answers are written directly on the answer sheet. There is no extra time for transferring answers. Write clearly and ensure spelling is correct. Follow word limits carefully (e.g., "NO MORE THAN THREE WORDS").</p>'
                        ELSE '<h2>' || (ARRAY['Reading Strategies', 'Question Types', 'Practice Exercises', 'Advanced Techniques'])[1 + ((lesson_num - 1) % 4)] || '</h2><p>This comprehensive article lesson provides detailed information and practical strategies to help you succeed in IELTS Reading. Develop essential skills through structured content and practice exercises.</p><h3>Key Concepts</h3><p>Learn essential reading strategies, master different question types, and develop techniques for efficient reading and accurate answering. Practice with authentic materials to build confidence.</p><h3>Reading Techniques</h3><p>Master three essential reading techniques: skimming (reading quickly for main ideas), scanning (searching for specific information), and detailed reading (careful reading for comprehension). Each technique serves a different purpose in the test.</p><h3>Question Types</h3><p>Understand and practice with all question types including multiple choice, True/False/Not Given, Yes/No/Not Given, matching headings, matching information, sentence completion, summary completion, and short answer questions.</p><h3>Next Steps</h3><p>Continue practicing with authentic IELTS reading materials and apply the strategies learned in this lesson to improve your reading comprehension and test performance.</p>'
                    END
                WHEN 'writing' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Writing</h2><p>The IELTS Writing test evaluates your ability to produce written English in academic contexts. This comprehensive introduction covers both tasks and essential preparation strategies.</p><h3>Test Overview</h3><p>The writing test consists of two tasks: Task 1 requires describing visual information (150 words minimum), and Task 2 requires writing an essay (250 words minimum). You have 60 minutes total, with 20 minutes recommended for Task 1 and 40 minutes for Task 2.</p><h3>Assessment Criteria</h3><p>Both tasks are assessed on four criteria: Task Achievement/Task Response (how well you address the task), Coherence and Cohesion (organization and linking), Lexical Resource (vocabulary range and accuracy), and Grammatical Range and Accuracy (grammar variety and correctness).</p><h3>What You Will Learn</h3><ul><li>Understanding Task 1 and Task 2 requirements</li><li>Effective planning and organization strategies</li><li>Language use for academic writing</li><li>Structuring essays and reports</li><li>Common mistakes and how to avoid them</li></ul>'
                        WHEN 2 THEN '<h2>Writing Test Format</h2><p>Understanding the format and requirements of both writing tasks is crucial for success. This lesson provides detailed information about each task type.</p><h3>Task 1 Overview</h3><p>Task 1 requires describing visual information such as charts, graphs, tables, diagrams, or maps. You must write at least 150 words in 20 minutes. Focus on: selecting and reporting main features, making comparisons where relevant, and using appropriate language.</p><h3>Task 2 Overview</h3><p>Task 2 requires writing an essay responding to a point of view, argument, or problem. You must write at least 250 words in 40 minutes. Focus on: addressing all parts of the question, developing ideas with examples, organizing ideas logically, and using appropriate academic language.</p><h3>Planning Time</h3><p>Always spend 2-3 minutes planning before writing. For Task 1: identify main trends and features. For Task 2: brainstorm ideas, organize arguments, and plan paragraph structure. This planning significantly improves your writing quality.</p>'
                        ELSE '<h2>' || (ARRAY['Writing Strategies', 'Task 1 Techniques', 'Task 2 Techniques', 'Language Use'])[1 + ((lesson_num - 1) % 4)] || '</h2><p>This comprehensive article lesson provides detailed information and practical strategies to help you succeed in IELTS Writing. Develop essential skills through structured content and practice exercises.</p><h3>Key Concepts</h3><p>Learn essential writing strategies, master task requirements, and develop techniques for effective organization and language use. Practice with sample tasks to build confidence.</p><h3>Assessment Criteria</h3><p>Understand the four assessment criteria: Task Achievement/Task Response (how well you address the task), Coherence and Cohesion (organization and linking), Lexical Resource (vocabulary range and accuracy), and Grammatical Range and Accuracy (grammar variety and correctness).</p><h3>Practice Tips</h3><p>Regular practice with authentic IELTS writing tasks is essential. Focus on: planning before writing, organizing ideas logically, using appropriate academic language, and reviewing your work for errors.</p>'
                    END
                WHEN 'speaking' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Speaking</h2><p>The IELTS Speaking test evaluates your ability to communicate effectively in English through face-to-face conversation with an examiner. This comprehensive introduction covers all three parts and essential preparation strategies.</p><h3>Test Overview</h3><p>The speaking test lasts 11-14 minutes and consists of three parts: Part 1 (4-5 minutes) features questions about familiar topics, Part 2 (3-4 minutes) requires a 2-minute monologue on a given topic, and Part 3 (4-5 minutes) involves abstract discussion related to Part 2.</p><h3>Assessment Criteria</h3><p>You are assessed on four criteria: Fluency and Coherence (speaking smoothly and logically), Lexical Resource (vocabulary range and accuracy), Grammatical Range and Accuracy (grammar variety and correctness), and Pronunciation (clarity and naturalness).</p><h3>What You Will Learn</h3><ul><li>Understanding all three parts of the test</li><li>Strategies for fluent and coherent responses</li><li>Building vocabulary for various topics</li><li>Improving pronunciation and intonation</li><li>Developing ideas and expressing opinions</li></ul>'
                        WHEN 2 THEN '<h2>Speaking Test Format</h2><p>Understanding the format and requirements of all three parts helps you prepare effectively and perform confidently on test day.</p><h3>Part 1: Introduction and Interview</h3><p>Part 1 lasts 4-5 minutes and covers familiar topics such as home, work, studies, hobbies, and daily routines. The examiner asks straightforward questions, and you should provide extended answers (2-3 sentences) rather than single-word responses.</p><h3>Part 2: Long Turn</h3><p>Part 2 lasts 3-4 minutes: you receive a cue card with a topic and have 1 minute to prepare notes. You then speak for 1-2 minutes, followed by 1-2 brief follow-up questions. Focus on: covering all points on the cue card, speaking for the full time, and organizing your response logically.</p><h3>Part 3: Two-Way Discussion</h3><p>Part 3 lasts 4-5 minutes and involves abstract discussion related to Part 2. Questions are more complex, requiring you to: express and justify opinions, analyze and evaluate ideas, speculate about future possibilities, and compare and contrast different views.</p>'
                        ELSE '<h2>' || (ARRAY['Speaking Strategies', 'Fluency Development', 'Vocabulary Building', 'Pronunciation Practice'])[1 + ((lesson_num - 1) % 4)] || '</h2><p>This comprehensive article lesson provides detailed information and practical strategies to help you succeed in IELTS Speaking. Develop essential skills through structured content and practice exercises.</p><h3>Key Concepts</h3><p>Learn essential speaking strategies, develop fluency and coherence, build vocabulary for various topics, and improve pronunciation. Practice regularly to build confidence.</p><h3>Assessment Criteria</h3><p>Understand the four assessment criteria: Fluency and Coherence (speaking smoothly and logically), Lexical Resource (vocabulary range and accuracy), Grammatical Range and Accuracy (grammar variety and correctness), and Pronunciation (clarity and naturalness).</p><h3>Practice Tips</h3><p>Regular practice is essential for improving speaking skills. Focus on: speaking on various topics, recording yourself, building vocabulary, practicing pronunciation, and developing ideas and opinions.</p>'
                    END
                ELSE '<h2>' || (ARRAY['IELTS Preparation', 'Test Strategies', 'Skill Development'])[1 + (lesson_num % 3)] || '</h2><p>This comprehensive lesson provides detailed information and practical strategies to help you succeed in IELTS. Develop essential skills through structured content and practice exercises.</p><h3>Key Concepts</h3><p>Learn essential strategies, master test format, and develop techniques for effective preparation. Practice regularly to build confidence and improve performance.</p>'
            END
        WHEN lesson_num % 3 = 0 THEN -- Mixed lessons
            CASE c.skill_type
                WHEN 'listening' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Listening</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials to help you master IELTS Listening. You will watch an instructional video and then read supplementary materials to reinforce your understanding.</p><h3>What You Will Learn</h3><ul><li>Understanding the four sections of the listening test</li><li>Common question types and how to approach them</li><li>Effective prediction and note-taking strategies</li><li>Time management techniques</li><li>How to avoid common mistakes</li></ul><h3>Learning Approach</h3><p>Start by watching the video lesson to understand key concepts visually. Then read the accompanying article to deepen your understanding and review important points. Practice exercises are included to help you apply what you''ve learned.</p>'
                        WHEN 2 THEN '<h2>Listening Test Format Explained</h2><p>This mixed lesson provides both visual and textual explanations of the IELTS Listening test format. Watch the video for an overview, then read detailed information about each section.</p><h3>Section Breakdown</h3><p><strong>Section 1 - Social Conversation:</strong> Learn about everyday conversations and how to identify key information.</p><p><strong>Section 2 - Social Monologue:</strong> Understand how to follow detailed instructions and identify specific information.</p><p><strong>Section 3 - Educational Discussion:</strong> Master strategies for understanding opinions and explanations.</p><p><strong>Section 4 - Academic Lecture:</strong> Develop skills to comprehend complex ideas and academic vocabulary.</p><h3>Question Distribution</h3><p>Each section contains exactly 10 questions. Section 1 and 2 typically feature simpler question types, while Section 3 and 4 include more complex types.</p>'
                        ELSE '<h2>' || (ARRAY['Listening Practice', 'Advanced Listening Strategies', 'Skill Development', 'Test Preparation'])[1 + ((lesson_num - 3) % 4)] || '</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials. Watch the video to see concepts demonstrated, then read the article to reinforce your learning and practice with included exercises.</p><h3>Key Concepts</h3><p>The lesson covers essential listening strategies, common question types, and effective techniques for identifying key information. You will learn how to predict answers, recognize paraphrasing, and manage your time effectively.</p><h3>Practice Application</h3><p>Practice exercises and examples are included to help you apply the strategies discussed. Work through each section carefully, taking notes and identifying areas where you need additional practice.</p>'
                    END
                WHEN 'reading' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Reading</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials to help you master IELTS Reading. You will watch an instructional video and then read supplementary materials to reinforce your understanding.</p><h3>What You Will Learn</h3><ul><li>Understanding the three passages and their characteristics</li><li>All question types and specific strategies for each</li><li>Effective reading techniques (skimming, scanning, detailed reading)</li><li>Time management strategies</li><li>Vocabulary building techniques</li></ul><h3>Learning Approach</h3><p>Start by watching the video lesson to understand key concepts visually. Then read the accompanying article to deepen your understanding and review important points. Practice exercises are included to help you apply what you''ve learned.</p>'
                        WHEN 2 THEN '<h2>Reading Test Format</h2><p>This mixed lesson provides both visual and textual explanations of the IELTS Reading test format. Watch the video for an overview, then read detailed information about passage types and question formats.</p><h3>The Three Passages</h3><p><strong>Passage 1:</strong> Typically contains factual, descriptive, or narrative texts on everyday topics.</p><p><strong>Passage 2:</strong> Usually features descriptive or argumentative texts on general interest topics.</p><p><strong>Passage 3:</strong> Contains complex argumentative or analytical texts on academic topics.</p><h3>Question Types</h3><p>You will encounter various question types including: multiple choice, True/False/Not Given, Yes/No/Not Given, matching headings, matching information, sentence completion, summary completion, and short answer questions.</p>'
                        ELSE '<h2>' || (ARRAY['Reading Strategies', 'Question Types', 'Practice Exercises', 'Advanced Techniques'])[1 + ((lesson_num - 3) % 4)] || '</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials. Watch the video to see concepts demonstrated, then read the article to reinforce your learning and practice with included exercises.</p><h3>Key Concepts</h3><p>Learn essential reading strategies, master different question types, and develop techniques for efficient reading and accurate answering.</p><h3>Practice Application</h3><p>Practice with authentic IELTS reading materials and apply the strategies learned in this lesson to improve your reading comprehension and test performance.</p>'
                    END
                WHEN 'writing' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Writing</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials to help you master IELTS Writing. You will watch an instructional video and then read supplementary materials to reinforce your understanding.</p><h3>What You Will Learn</h3><ul><li>Understanding Task 1 and Task 2 requirements</li><li>Effective planning and organization strategies</li><li>Language use for academic writing</li><li>Structuring essays and reports</li><li>Common mistakes and how to avoid them</li></ul><h3>Learning Approach</h3><p>Start by watching the video lesson to understand key concepts visually. Then read the accompanying article to deepen your understanding and review important points. Practice exercises are included to help you apply what you''ve learned.</p>'
                        WHEN 2 THEN '<h2>Writing Test Format</h2><p>This mixed lesson provides both visual and textual explanations of the IELTS Writing test format. Watch the video for an overview, then read detailed information about each task type.</p><h3>Task 1 Overview</h3><p>Task 1 requires describing visual information such as charts, graphs, tables, diagrams, or maps. You must write at least 150 words in 20 minutes.</p><h3>Task 2 Overview</h3><p>Task 2 requires writing an essay responding to a point of view, argument, or problem. You must write at least 250 words in 40 minutes.</p><h3>Planning Time</h3><p>Always spend 2-3 minutes planning before writing. For Task 1: identify main trends and features. For Task 2: brainstorm ideas, organize arguments, and plan paragraph structure.</p>'
                        ELSE '<h2>' || (ARRAY['Writing Strategies', 'Task 1 Techniques', 'Task 2 Techniques', 'Language Use'])[1 + ((lesson_num - 3) % 4)] || '</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials. Watch the video to see concepts demonstrated, then read the article to reinforce your learning and practice with included exercises.</p><h3>Key Concepts</h3><p>Learn essential writing strategies, master task requirements, and develop techniques for effective organization and language use.</p>'
                    END
                WHEN 'speaking' THEN
                    CASE lesson_num
                        WHEN 1 THEN '<h2>Introduction to IELTS Speaking</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials to help you master IELTS Speaking. You will watch an instructional video and then read supplementary materials to reinforce your understanding.</p><h3>What You Will Learn</h3><ul><li>Understanding all three parts of the test</li><li>Strategies for fluent and coherent responses</li><li>Building vocabulary for various topics</li><li>Improving pronunciation and intonation</li><li>Developing ideas and expressing opinions</li></ul><h3>Learning Approach</h3><p>Start by watching the video lesson to understand key concepts visually. Then read the accompanying article to deepen your understanding and review important points. Practice exercises are included to help you apply what you''ve learned.</p>'
                        WHEN 2 THEN '<h2>Speaking Test Format</h2><p>This mixed lesson provides both visual and textual explanations of the IELTS Speaking test format. Watch the video for an overview, then read detailed information about all three parts.</p><h3>Part 1: Introduction and Interview</h3><p>Part 1 lasts 4-5 minutes and covers familiar topics such as home, work, studies, hobbies, and daily routines.</p><h3>Part 2: Long Turn</h3><p>Part 2 lasts 3-4 minutes: you receive a cue card with a topic and have 1 minute to prepare notes. You then speak for 1-2 minutes.</p><h3>Part 3: Two-Way Discussion</h3><p>Part 3 lasts 4-5 minutes and involves abstract discussion related to Part 2. Questions are more complex, requiring you to express and justify opinions.</p>'
                        ELSE '<h2>' || (ARRAY['Speaking Strategies', 'Fluency Development', 'Vocabulary Building', 'Pronunciation Practice'])[1 + ((lesson_num - 3) % 4)] || '</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials. Watch the video to see concepts demonstrated, then read the article to reinforce your learning and practice with included exercises.</p><h3>Key Concepts</h3><p>Learn essential speaking strategies, develop fluency and coherence, build vocabulary for various topics, and improve pronunciation.</p>'
                    END
                ELSE '<h2>' || (ARRAY['IELTS Preparation', 'Test Strategies', 'Skill Development'])[1 + (lesson_num % 3)] || '</h2><p>This comprehensive mixed lesson combines video instruction with detailed reading materials. Watch the video to see concepts demonstrated, then read the article to reinforce your learning and practice with included exercises.</p><h3>Key Concepts</h3><p>Learn essential strategies, master test format, and develop techniques for effective preparation.</p>'
            END
        ELSE -- Video lessons
            (ARRAY['Introduction and overview of ' || c.skill_type || ' in IELTS', 'Learn the format and structure of IELTS ' || c.skill_type, 'Essential strategies for success in ' || c.skill_type, 'Explore different question types in ' || c.skill_type])[1 + (hashtext(m.id::text || lesson_num::text) % 4)]
    END,
    CASE 
        WHEN lesson_num % 3 = 1 THEN 'video'
        WHEN lesson_num % 3 = 2 THEN 'article'
        ELSE 'mixed'
    END,
    -- Realistic duration_minutes based on lesson type and number
    -- Short videos: 5-10 minutes, Medium: 8-15 minutes, Long: 12-20 minutes
    CASE 
        WHEN lesson_num % 3 = 1 THEN -- Video lessons
            CASE 
                WHEN lesson_num <= 3 THEN 5 + (lesson_num % 6) -- 5-10 minutes for intro videos
                WHEN lesson_num <= 6 THEN 8 + (lesson_num % 8) -- 8-15 minutes for practice videos
                ELSE 12 + (lesson_num % 9) -- 12-20 minutes for advanced videos
            END
        ELSE -- Article or mixed content
            10 + (lesson_num % 15) -- 10-24 minutes for reading time
    END,
    lesson_num,
    CASE WHEN lesson_num <= 2 THEN true ELSE false END,
    true
FROM modules m
JOIN courses c ON c.id = m.course_id
CROSS JOIN generate_series(1, m.total_lessons) lesson_num;

-- ============================================
-- 4. LESSON_VIDEOS
-- ============================================

INSERT INTO lesson_videos (
    id, lesson_id, title, description, video_url, video_provider, video_id,
    duration_seconds, thumbnail_url, has_subtitles, subtitle_languages, display_order
)
WITH video_assignments AS (
    SELECT 
        l.id as lesson_id,
        l.course_id,
        l.content_type,
        l.title as lesson_title,
        l.id as lesson_uuid,
        -- Assign unique video IDs per course using sequential assignment with course-based offset
        -- This ensures no duplicate videos within the same course
        COALESCE(
            video_ids[1 + (
                -- Calculate a unique index for each lesson within its course
                -- Use course_id hash as base offset, then add lesson row number within course
                (
                    ABS(hashtext(l.course_id::text)::bigint) % array_length(video_ids, 1) + 
                    ROW_NUMBER() OVER (PARTITION BY l.course_id ORDER BY l.id)
                ) % array_length(video_ids, 1) + 1
            )],
            video_ids[1] -- Fallback to first video if calculation fails
        ) as assigned_video_id,
        ROW_NUMBER() OVER (PARTITION BY l.course_id ORDER BY l.id) as lesson_num_in_course
    FROM lessons l
    CROSS JOIN (
        SELECT ARRAY[
        'k72qx-LSKIg', 'RyTdIYMrcKY', 'xpmWhPew5QU', 'p-JfuIyV9xQ', 'nXvcLRAYIXs',
        'WT0QV_3Y7Fw', 'T49sg7i7ZAc', '20j9hYPuCLE', 'WGXGArS8UC8', 'uZNV1o7yLys',
        'gA7XBM5Z-zM', '7rULJclm0Ek', 'a_Q3YAN-Duo', 'nNTipHpP7so', 'MrJ33X0InXA',
        'yBiW708dDLI', 'xf5iUMqHInk', 'fsq-IQgKtTk', 'VGhUo8ezk4M', 'z6nsI5G9RWc',
        'BIn8zm8yymk', 'KD3OKlOXvxE', '4QAV5NiaW7k', 'V9qSdbotEkE', 'bGFDE0uBQEs',
        'NkJO7ceI3mo', '84Pn0s4RN70', '_ggznNb_er4', 'OPjsRxh6AF0', 'zGdCHg7gick',
        'Cc4lAvgLptg', 'OWduuHEpuzg', 'JSgOqBAjcMA', 'gQPO4q-ptUc', 'udPtobGpMSI',
        'tZ_ioUgKXwE', 'f5WH4UnDU7A', 'kugScbTr3gs', 'ZmMszhayj9I', 'ptO6NawNVgQ',
        '7oSQjdLfN5M', 'LjxIzECH7Ys', 'cQPjT9kXYgI', 'BVyP7sWR4Ew', 'R89l1zrgXzs',
        'FNwV3WqV6Sc', 'ECwA6aEvGuw', 'rPRCpfltzio', 'OmwzWAUCSQ8', 'KaJW7j0zey0',
        '2VRuK5QBjTw', '1-aFVhGhtFQ', 'oKZDa00CYU4', 'xoaWIur-YVY', 'g92Fum1z6w8',
        'KPb9VZMkais', '3I7bBIm3-PU', 'KVYx5CgAuao', 'j0qywR59Wv4', 'Aj4i9htNbxM',
        't_EVh8jxDbs', 'h-4V_duEx3w', '_jJi6k3CThM', '38Vx2NjW3T4', 'OBryguHcJXc',
        'a065ioF1jeM', '2Fqo0OoEoSU', 'd_q5o7pDRh0', 'xJlIQCWM1EA', 'KGFGZP3B8ZQ',
        'yi8uDHSuf9E', '0E7ss6etqDU', 'xGTaNjsLmss', '9WO4_N9C0po', 'fgBepZmk5VM',
        'YOSgRy3kqRs', 'QkPVVvPRE2s', 'UkUCO02Adt8', '_-nhtI3hn0Y', 'n-DzRPPXnNY',
        '2qP1JotBMTY', 'z8wZUS_b7k8', 'zaKl0H-YoQw', 'vQ7ZL1wMgCE', 'BCOJqpeqHrM',
        'ZdPZ6dgO44E', 'M0BUE7iMILc', 'fHx9Hnn48G0', 'SdV_3Ct5SNk', 'D8qWDovn5ck',
        'MQ_c-2IrAzk', 'oUOiZhQqBxw', '_aLlKFKEWXY', '1H-bsnpUiak', 'cuRJt35xAdY',
        'T8GB-tPlSY8', 'HEnTJqwewsg', 'rArhIvypfTI', 'F32lFOipk3M', 'dnmElGczPf8',
        'xhd-RZGcfIQ', 'dSW6rSzvbRY', 'K5MFUpEmDvU', 'y6Yv7ukWgy8', 'cGG3ovpSQZc',
        'k-D2p-QQyE8', 'BdBJTjuW_wo', 'OpDlKRhISqE', 'mGXWsxNfwhk', 'UfqugyGe-jk',
        'sYff9BKA-fY', 'X9eHv7iasws', 'IxNWmkDAjoM', 'KDbtZqLohUU', 'jDkOlzOeEHs',
        '7QXZyJ3Rj_Y', 'bYyXN5BPJkU', 'O8-N-vprxTs', 'INRq3QW_VHI', 'CYc-r5AeBcU',
        '6QMu7-3DMi0', 'ys-1LqlUNCk', 'tml3fxV9w7g', 'fX3qI4lQ6P0', 'SeWt7IpZ0CA',
        'oV7qaHKPoK0', '9TH5JGYZB4o', 'vVYONjT2b0Y', 'kop8O3A-UGs', 'btAiWvdIxm4',
        'G5orxWQWafI', 'OZmK0YuSmXU'
    ] as video_ids
    ) vid
    WHERE l.content_type IN ('video', 'mixed')
)
SELECT 
    uuid_generate_v4(),
    va.lesson_id,
    -- Diverse video titles based on lesson content
    CASE 
        WHEN va.content_type IN ('video', 'mixed') THEN
            CASE 
                WHEN va.lesson_title ILIKE '%introduction%' OR va.lesson_title ILIKE '%overview%' THEN
                    (ARRAY[va.lesson_title || ' - Complete Guide', va.lesson_title || ' - Full Tutorial', va.lesson_title || ' - Step by Step', va.lesson_title || ' - Expert Explanation'])[1 + (hashtext(va.lesson_uuid::text) % 4)]
                WHEN va.lesson_title ILIKE '%practice%' OR va.lesson_title ILIKE '%exercise%' THEN
                    (ARRAY[va.lesson_title || ' - Walkthrough', va.lesson_title || ' - Detailed Solution', va.lesson_title || ' - Complete Practice', va.lesson_title || ' - Step-by-Step Guide'])[1 + (hashtext(va.lesson_uuid::text) % 4)]
                WHEN va.lesson_title ILIKE '%advanced%' OR va.lesson_title ILIKE '%technique%' THEN
                    (ARRAY[va.lesson_title || ' - Expert Strategies', va.lesson_title || ' - Advanced Methods', va.lesson_title || ' - Pro Tips', va.lesson_title || ' - Master Class'])[1 + (hashtext(va.lesson_uuid::text) % 4)]
                WHEN va.lesson_title ILIKE '%strategy%' OR va.lesson_title ILIKE '%tip%' THEN
                    (ARRAY[va.lesson_title || ' - Essential Guide', va.lesson_title || ' - Proven Methods', va.lesson_title || ' - Success Strategies', va.lesson_title || ' - Best Practices'])[1 + (hashtext(va.lesson_uuid::text) % 4)]
                ELSE
                    (ARRAY[va.lesson_title || ' - Video Lesson', va.lesson_title || ' - Complete Tutorial', va.lesson_title || ' - Full Explanation', va.lesson_title || ' - Comprehensive Guide'])[1 + (hashtext(va.lesson_uuid::text) % 4)]
            END
        ELSE NULL
    END,
    -- Diverse video descriptions
    CASE 
        WHEN va.content_type IN ('video', 'mixed') THEN
            CASE 
                WHEN va.lesson_title ILIKE '%introduction%' OR va.lesson_title ILIKE '%overview%' THEN
                    'This comprehensive video lesson provides a complete introduction to ' || LOWER(va.lesson_title) || '. Learn essential concepts, understand key strategies, and build a strong foundation for your IELTS preparation. Perfect for beginners starting their learning journey.'
                WHEN va.lesson_title ILIKE '%practice%' OR va.lesson_title ILIKE '%exercise%' THEN
                    'Watch this detailed walkthrough of ' || LOWER(va.lesson_title) || '. Follow along as we work through practice questions step-by-step, explain answer strategies, and demonstrate effective techniques. Includes detailed explanations and tips for improvement.'
                WHEN va.lesson_title ILIKE '%advanced%' OR va.lesson_title ILIKE '%technique%' THEN
                    'Master advanced techniques and strategies in this expert-level video lesson on ' || LOWER(va.lesson_title) || '. Learn sophisticated methods, avoid common mistakes, and develop skills to achieve Band 7+ scores. Includes proven strategies from experienced instructors.'
                WHEN va.lesson_title ILIKE '%strategy%' OR va.lesson_title ILIKE '%tip%' THEN
                    'Discover proven strategies and essential tips in this comprehensive video lesson on ' || LOWER(va.lesson_title) || '. Learn effective methods, understand best practices, and develop skills to maximize your IELTS performance. Includes practical examples and real-world applications.'
                ELSE
                    'This comprehensive video lesson covers ' || LOWER(va.lesson_title) || ' in detail. Learn essential concepts, practice with examples, and develop the skills necessary for IELTS success. Perfect for students at all levels looking to improve their performance.'
            END
        ELSE NULL
    END,
    CASE 
        WHEN va.content_type IN ('video', 'mixed') THEN
            'https://www.youtube.com/watch?v=' || va.assigned_video_id
        ELSE NULL
    END,
    CASE WHEN va.content_type IN ('video', 'mixed') THEN 'youtube' ELSE NULL END,
    CASE WHEN va.content_type IN ('video', 'mixed') THEN va.assigned_video_id ELSE NULL END,
    CASE WHEN va.content_type IN ('video', 'mixed') THEN 
        COALESCE(
            (
                SELECT duration_seconds FROM (
                    SELECT video_id, duration_seconds FROM (VALUES
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ('0E7ss6etqDU', 244),
                        ('1-aFVhGhtFQ', 145),
                        ('1H-bsnpUiak', 126),
                        ('20j9hYPuCLE', 188),
                        ('2Fqo0OoEoSU', 185),
                        ('2VRuK5QBjTw', 174),
                        ('2qP1JotBMTY', 247),
                        ('38Vx2NjW3T4', 208),
                        ('3I7bBIm3-PU', 61),
                        ('4QAV5NiaW7k', 296),
                        ('6QMu7-3DMi0', 60),
                        ('7QXZyJ3Rj_Y', 246),
                        ('7oSQjdLfN5M', 192),
                        ('7rULJclm0Ek', 330),
                        ('84Pn0s4RN70', 247),
                        ('9TH5JGYZB4o', 233),
                        ('9WO4_N9C0po', 199),
                        ('Aj4i9htNbxM', 267),
                        ('BCOJqpeqHrM', 247),
                        ('BIn8zm8yymk', 143),
                        ('BVyP7sWR4Ew', 239),
                        ('BdBJTjuW_wo', 202),
                        ('CYc-r5AeBcU', 362),
                        ('Cc4lAvgLptg', 282),
                        ('D8qWDovn5ck', 202),
                        ('ECwA6aEvGuw', 264),
                        ('F32lFOipk3M', 225),
                        ('FNwV3WqV6Sc', 288),
                        ('G5orxWQWafI', 249),
                        ('HEnTJqwewsg', 291),
                        ('INRq3QW_VHI', 331),
                        ('IxNWmkDAjoM', 79),
                        ('JSgOqBAjcMA', 200),
                        ('K5MFUpEmDvU', 152),
                        ('KD3OKlOXvxE', 249),
                        ('KDbtZqLohUU', 175),
                        ('KGFGZP3B8ZQ', 225),
                        ('KPb9VZMkais', 165),
                        ('KVYx5CgAuao', 95),
                        ('KaJW7j0zey0', 203),
                        ('LjxIzECH7Ys', 248),
                        ('M0BUE7iMILc', 216),
                        ('MQ_c-2IrAzk', 184),
                        ('MrJ33X0InXA', 223),
                        ('NkJO7ceI3mo', 151),
                        ('O8-N-vprxTs', 156),
                        ('OBryguHcJXc', 169),
                        ('OPjsRxh6AF0', 590),
                        ('OWduuHEpuzg', 280),
                        ('OZmK0YuSmXU', 279),
                        ('OmwzWAUCSQ8', 229),
                        ('OpDlKRhISqE', 205),
                        ('QkPVVvPRE2s', 195),
                        ('R89l1zrgXzs', 261),
                        ('RyTdIYMrcKY', 181),
                        ('SdV_3Ct5SNk', 294),
                        ('SeWt7IpZ0CA', 310),
                        ('T49sg7i7ZAc', 250),
                        ('T8GB-tPlSY8', 207),
                        ('UfqugyGe-jk', 179),
                        ('UkUCO02Adt8', 249),
                        ('V9qSdbotEkE', 198),
                        ('VGhUo8ezk4M', 263),
                        ('WGXGArS8UC8', 279),
                        ('WT0QV_3Y7Fw', 187),
                        ('X9eHv7iasws', 242),
                        ('YOSgRy3kqRs', 263),
                        ('ZdPZ6dgO44E', 218),
                        ('ZmMszhayj9I', 178),
                        ('_-nhtI3hn0Y', 164),
                        ('_aLlKFKEWXY', 225),
                        ('_ggznNb_er4', 249),
                        ('_jJi6k3CThM', 226),
                        ('a065ioF1jeM', 231),
                        ('a_Q3YAN-Duo', 188),
                        ('bGFDE0uBQEs', 192),
                        ('bYyXN5BPJkU', 232),
                        ('btAiWvdIxm4', 37),
                        ('cGG3ovpSQZc', 196),
                        ('cQPjT9kXYgI', 255),
                        ('cuRJt35xAdY', 181),
                        ('dSW6rSzvbRY', 233),
                        ('d_q5o7pDRh0', 184),
                        ('dnmElGczPf8', 204),
                        ('f5WH4UnDU7A', 260),
                        ('fHx9Hnn48G0', 204),
                        ('fX3qI4lQ6P0', 176),
                        ('fgBepZmk5VM', 186),
                        ('fsq-IQgKtTk', 169),
                        ('g92Fum1z6w8', 161),
                        ('gA7XBM5Z-zM', 291),
                        ('gQPO4q-ptUc', 273),
                        ('h-4V_duEx3w', 223),
                        ('j0qywR59Wv4', 232),
                        ('jDkOlzOeEHs', 228),
                        ('k-D2p-QQyE8', 179),
                        ('k72qx-LSKIg', 236),
                        ('kop8O3A-UGs', 136),
                        ('kugScbTr3gs', 153),
                        ('mGXWsxNfwhk', 218),
                        ('n-DzRPPXnNY', 199),
                        ('nNTipHpP7so', 365),
                        ('nXvcLRAYIXs', 290),
                        ('oKZDa00CYU4', 201),
                        ('oUOiZhQqBxw', 191),
                        ('oV7qaHKPoK0', 257),
                        ('p-JfuIyV9xQ', 217),
                        ('ptO6NawNVgQ', 190),
                        ('rArhIvypfTI', 265),
                        ('rPRCpfltzio', 190),
                        ('sYff9BKA-fY', 232),
                        ('tZ_ioUgKXwE', 224),
                        ('t_EVh8jxDbs', 162),
                        ('tml3fxV9w7g', 226),
                        ('uZNV1o7yLys', 311),
                        ('udPtobGpMSI', 193),
                        ('vQ7ZL1wMgCE', 197),
                        ('vVYONjT2b0Y', 226),
                        ('xGTaNjsLmss', 195),
                        ('xJlIQCWM1EA', 221),
                        ('xf5iUMqHInk', 243),
                        ('xhd-RZGcfIQ', 124),
                        ('xoaWIur-YVY', 298),
                        ('xpmWhPew5QU', 205),
                        ('y6Yv7ukWgy8', 273),
                        ('yBiW708dDLI', 324),
                        ('yi8uDHSuf9E', 201),
                        ('ys-1LqlUNCk', 226),
                        ('z6nsI5G9RWc', 253),
                        ('z8wZUS_b7k8', 248),
                        ('zGdCHg7gick', 189),
                        ('zaKl0H-YoQw', 265)
                    ) AS duration_map(video_id, duration_seconds)
                ) AS d
                WHERE d.video_id = va.assigned_video_id
                LIMIT 1
            ),
            (SELECT duration_minutes FROM lessons WHERE id = va.lesson_id) * 60 -- Fallback: use calculated duration
        )
    ELSE NULL END,
    CASE WHEN va.content_type IN ('video', 'mixed') THEN
        CASE (va.lesson_num_in_course % 12)
            WHEN 0 THEN 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&h=600&fit=crop'
            WHEN 1 THEN 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=600&fit=crop'
            WHEN 2 THEN 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop'
            WHEN 3 THEN 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=600&fit=crop'
            WHEN 4 THEN 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop'
            WHEN 5 THEN 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop'
            WHEN 6 THEN 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'
            WHEN 7 THEN 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop'
            WHEN 8 THEN 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop'
            WHEN 9 THEN 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&h=600&fit=crop'
            WHEN 10 THEN 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop'
            ELSE 'https://images.unsplash.com/photo-1508921340878-bad53cfe2816?w=800&h=600&fit=crop'
        END
    ELSE NULL END,
    CASE WHEN va.content_type IN ('video', 'mixed') THEN true ELSE false END,
    CASE WHEN va.content_type IN ('video', 'mixed') THEN ARRAY['en', 'vi'] ELSE NULL END,
    1
FROM video_assignments va;

-- ============================================
-- 5. LESSON_MATERIALS (Detailed & Diverse)
-- ============================================
-- Additional learning materials: PDFs, documents, worksheets, etc.

WITH lesson_material_data AS (
    SELECT 
        l.id as lesson_id,
        l.content_type,
        l.title as lesson_title,
        mat_num,
        -- Diverse material titles based on lesson content and skill type
        CASE 
            WHEN l.content_type = 'video' THEN
                CASE mat_num
                    WHEN 1 THEN (ARRAY['Video Transcript', 'Complete Transcript PDF', 'Full Transcript Document', 'Lesson Transcript'])[1 + (hashtext(l.id::text || '1') % 4)]
                    WHEN 2 THEN (ARRAY['Practice Exercises', 'Supplementary Exercises', 'Additional Practice PDF', 'Extra Exercises'])[1 + (hashtext(l.id::text || '2') % 4)]
                    WHEN 3 THEN (ARRAY['Key Points Summary', 'Lesson Summary PDF', 'Important Points Document', 'Summary Notes'])[1 + (hashtext(l.id::text || '3') % 4)]
                    WHEN 4 THEN (ARRAY['Vocabulary List', 'Word List PDF', 'Key Vocabulary Document', 'Vocabulary Sheet'])[1 + (hashtext(l.id::text || '4') % 4)]
                    ELSE (ARRAY['Study Guide', 'Reference Guide PDF', 'Learning Guide Document', 'Guide Material'])[1 + (hashtext(l.id::text || '5') % 4)]
                END
            WHEN l.content_type = 'article' THEN
                CASE mat_num
                    WHEN 1 THEN (ARRAY['Reading Comprehension Questions', 'Practice Questions PDF', 'Question Set Document', 'Comprehension Exercises'])[1 + (hashtext(l.id::text || '1') % 4)]
                    WHEN 2 THEN (ARRAY['Vocabulary Worksheet', 'Vocabulary Practice PDF', 'Word Worksheet Document', 'Vocab Practice Sheet'])[1 + (hashtext(l.id::text || '2') % 4)]
                    WHEN 3 THEN (ARRAY['Key Concepts Summary', 'Concept Summary PDF', 'Main Ideas Document', 'Concepts Summary'])[1 + (hashtext(l.id::text || '3') % 4)]
                    ELSE (ARRAY['Additional Reading', 'Extended Reading PDF', 'Further Reading Document', 'Reading Extension'])[1 + (hashtext(l.id::text || '4') % 4)]
                END
            ELSE -- Mixed lessons
                CASE mat_num
                    WHEN 1 THEN (ARRAY['Complete Lesson Package', 'Full Lesson Materials', 'All Resources ZIP', 'Complete Package'])[1 + (hashtext(l.id::text || '1') % 4)]
                    WHEN 2 THEN (ARRAY['Practice Materials', 'Practice Pack PDF', 'Practice Documents ZIP', 'Practice Resources'])[1 + (hashtext(l.id::text || '2') % 4)]
                    WHEN 3 THEN (ARRAY['Study Notes', 'Notes PDF', 'Study Notes Document', 'Learning Notes'])[1 + (hashtext(l.id::text || '3') % 4)]
                    WHEN 4 THEN (ARRAY['Assessment Quiz', 'Quiz PDF', 'Assessment Document', 'Quiz Material'])[1 + (hashtext(l.id::text || '4') % 4)]
                    ELSE (ARRAY['Supplementary Resources', 'Extra Resources ZIP', 'Additional Materials', 'More Resources'])[1 + (hashtext(l.id::text || '5') % 4)]
                END
        END as material_title,
        -- Detailed descriptions for materials
        CASE 
            WHEN l.content_type = 'video' THEN
                CASE mat_num
                    WHEN 1 THEN 'Complete transcript of the video lesson with timestamps. Perfect for reviewing key points, practicing pronunciation, and understanding the content in detail. Includes all dialogue and important information.'
                    WHEN 2 THEN 'Supplementary practice exercises related to the video lesson. These exercises reinforce the concepts covered in the video and provide additional opportunities to practice and improve your skills.'
                    WHEN 3 THEN 'Comprehensive summary of key points and important information from the video lesson. Use this document to review main concepts, strategies, and tips without rewatching the entire video.'
                    WHEN 4 THEN 'Essential vocabulary list extracted from the video lesson. Includes definitions, example sentences, and usage notes. Perfect for building your vocabulary and understanding key terms.'
                    ELSE 'Complete study guide covering all aspects of the video lesson. Includes summaries, exercises, vocabulary, and additional resources to maximize your learning experience.'
                END
            WHEN l.content_type = 'article' THEN
                CASE mat_num
                    WHEN 1 THEN 'Comprehensive reading comprehension questions designed to test your understanding of the article. Includes multiple question types, answer keys, and detailed explanations for each answer.'
                    WHEN 2 THEN 'Vocabulary worksheet focusing on key words and phrases from the article. Includes matching exercises, fill-in-the-blank activities, and context-based questions to reinforce vocabulary learning.'
                    WHEN 3 THEN 'Detailed summary of key concepts, main ideas, and important points from the article. Helps you consolidate your understanding and remember essential information for future reference.'
                    ELSE 'Additional reading materials and resources related to the article topic. Expand your knowledge and explore related topics with these carefully selected supplementary materials.'
                END
            ELSE
                CASE mat_num
                    WHEN 1 THEN 'Complete package containing all lesson materials including transcripts, exercises, summaries, and additional resources. Everything you need for comprehensive study in one convenient download.'
                    WHEN 2 THEN 'Practice materials pack with various exercises, worksheets, and activities related to the lesson content. Perfect for hands-on practice and skill reinforcement.'
                    WHEN 3 THEN 'Comprehensive study notes covering all aspects of the lesson. Includes key points, strategies, examples, and tips to help you master the content effectively.'
                    WHEN 4 THEN 'Assessment quiz to test your understanding of the lesson content. Includes various question types and provides immediate feedback on your performance.'
                    ELSE 'Supplementary resources including additional reading, exercises, and reference materials. Perfect for students who want to go beyond the basic lesson content.'
                END
        END as material_description,
        -- Diverse file types
        CASE (hashtext(l.id::text || mat_num::text) % 6)
            WHEN 0 THEN 'pdf'
            WHEN 1 THEN 'doc'
            WHEN 2 THEN 'docx'
            WHEN 3 THEN 'ppt'
            WHEN 4 THEN 'zip'
            ELSE 'xlsx'
        END as file_type
    FROM lessons l
    CROSS JOIN generate_series(1, 
        CASE l.content_type
            WHEN 'video' THEN (CASE WHEN random() > 0.3 THEN 2 ELSE 3 END)::INTEGER  -- 2-3 materials for video lessons
            WHEN 'article' THEN (CASE WHEN random() > 0.2 THEN 2 ELSE 3 END)::INTEGER  -- 2-3 materials for article lessons
            ELSE (CASE WHEN random() > 0.25 THEN 3 ELSE 4 END)::INTEGER  -- 3-4 materials for mixed lessons
        END
    ) mat_num
    WHERE l.content_type IN ('video', 'article', 'mixed')
        AND random() > 
            CASE l.content_type
                WHEN 'video' THEN 0.3  -- 70% of video lessons have materials
                WHEN 'article' THEN 0.2 -- 80% of article lessons have materials
                ELSE 0.25               -- 75% of mixed lessons have materials
            END
)
INSERT INTO lesson_materials (
    id, lesson_id, title, description, file_type, file_url, file_size_bytes,
    display_order, total_downloads
)
SELECT 
    uuid_generate_v4(),
    lmd.lesson_id,
    COALESCE(lmd.material_title, 'Lesson Material ' || lmd.mat_num::text) as title,
    lmd.material_description,
    lmd.file_type,
    -- Realistic file URLs
    'https://ielts-learning-platform.s3.amazonaws.com/materials/' || lmd.lesson_id::text || '_' || 
    CASE lmd.file_type
        WHEN 'pdf' THEN 'material_' || lmd.mat_num::text || '.pdf'
        WHEN 'doc' THEN 'material_' || lmd.mat_num::text || '.doc'
        WHEN 'docx' THEN 'material_' || lmd.mat_num::text || '.docx'
        WHEN 'ppt' THEN 'presentation_' || lmd.mat_num::text || '.ppt'
        WHEN 'zip' THEN 'package_' || lmd.mat_num::text || '.zip'
        ELSE 'worksheet_' || lmd.mat_num::text || '.xlsx'
    END,
    -- Realistic file sizes (in bytes)
    CASE lmd.file_type
        WHEN 'pdf' THEN (random() * 2000000 + 500000)::BIGINT  -- 500KB to 2.5MB
        WHEN 'doc' THEN (random() * 1500000 + 300000)::BIGINT   -- 300KB to 1.8MB
        WHEN 'docx' THEN (random() * 2000000 + 400000)::BIGINT   -- 400KB to 2.4MB
        WHEN 'ppt' THEN (random() * 5000000 + 1000000)::BIGINT  -- 1MB to 6MB
        WHEN 'zip' THEN (random() * 10000000 + 2000000)::BIGINT -- 2MB to 12MB
        ELSE (random() * 1000000 + 200000)::BIGINT          -- 200KB to 1.2MB
    END,
    lmd.mat_num,
    (random() * 500 + 10)::INTEGER -- 10 to 510 downloads
FROM lesson_material_data lmd;

-- ============================================
-- 6. VIDEO_SUBTITLES (Detailed & Diverse)
-- ============================================
-- Subtitle files for lesson videos in multiple languages

INSERT INTO video_subtitles (
    id, video_id, language, subtitle_url, format, is_default
)
WITH video_langs AS (
    SELECT 
        lv.id as video_id,
        lang.lang,
        row_number() OVER (PARTITION BY lv.id ORDER BY lang.priority) as lang_order
    FROM lesson_videos lv
    CROSS JOIN (
        VALUES 
            ('vi', 1),  -- Vietnamese - highest priority
            ('en', 2),  -- English
            ('zh', 3),  -- Chinese
            ('ko', 4)   -- Korean
    ) AS lang(lang, priority)
    WHERE 
        (lang.lang = 'vi' AND random() > 0.0) OR  -- Vietnamese for all videos
        (lang.lang = 'en' AND random() > 0.1) OR  -- English for 90% of videos
        (lang.lang = 'zh' AND random() > 0.7) OR  -- Chinese for 30% of videos
        (lang.lang = 'ko' AND random() > 0.8)    -- Korean for 20% of videos
)
SELECT 
    uuid_generate_v4(),
    vl.video_id,
    vl.lang,
    -- Realistic subtitle URLs
    'https://ielts-learning-platform.s3.amazonaws.com/subtitles/' || vl.video_id::text || '_' || vl.lang || 
    CASE (random() * 2)::INTEGER
        WHEN 0 THEN '.vtt'
        WHEN 1 THEN '.srt'
        ELSE '.vtt'
    END,
    CASE (random() * 2)::INTEGER
        WHEN 0 THEN 'vtt'
        WHEN 1 THEN 'srt'
        ELSE 'vtt'
    END,
    CASE WHEN vl.lang_order = 1 THEN true ELSE false END -- First language is default
FROM video_langs vl;

-- ============================================
-- 7. COURSE_CATEGORY_MAPPING
-- ============================================

INSERT INTO course_category_mapping (course_id, category_id)
SELECT 
    c.id,
    CASE c.skill_type
        WHEN 'listening' THEN 1
        WHEN 'reading' THEN 2
        WHEN 'writing' THEN 3
        WHEN 'speaking' THEN 4
        ELSE 7 -- Test Preparation
    END
FROM courses c
WHERE c.status = 'published'
ON CONFLICT DO NOTHING;

-- Also add some courses to multiple categories
INSERT INTO course_category_mapping (course_id, category_id)
SELECT 
    c.id,
    CASE 
        WHEN random() > 0.7 THEN 5 -- Grammar
        WHEN random() > 0.5 THEN 6 -- Vocabulary
        ELSE 8 -- Academic IELTS
    END
FROM courses c
WHERE c.status = 'published' AND random() > 0.6
ON CONFLICT DO NOTHING;

-- Update course statistics and add meta fields if missing
UPDATE courses c
SET 
    total_lessons = (
        SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id
    ),
    total_videos = (
        SELECT COUNT(*) FROM lessons l 
        JOIN lesson_videos lv ON lv.lesson_id = l.id
        WHERE l.course_id = c.id
    ),
    -- Calculate duration_hours from ALL lesson durations (video + article + mixed)
    -- This represents the TOTAL study time, not just video watching time
    -- Add variation based on course characteristics to avoid identical durations
    duration_hours = ROUND(
        (
            SELECT COALESCE(SUM(l.duration_minutes), 0) / 60.0
            FROM lessons l
            WHERE l.course_id = c.id AND l.duration_minutes IS NOT NULL
        ) * 
        -- Add variation: ±5% based on course hash to create diversity
        (1.0 + (ABS(hashtext(c.id::text)::bigint % 11) - 5) * 0.01),
        2
    ),
    -- Add meta fields if missing
    meta_title = COALESCE(NULLIF(meta_title, ''), title || ' | IELTS Learning Platform'),
    meta_description = COALESCE(NULLIF(meta_description, ''), LEFT(COALESCE(short_description, description), 160)),
    meta_keywords = COALESCE(NULLIF(meta_keywords, ''), skill_type || ', IELTS, ' || level || ', Band ' || target_band_score::text || ', ' || 
                    CASE WHEN skill_type = 'listening' THEN 'Listening Practice, IELTS Audio'
                         WHEN skill_type = 'reading' THEN 'Reading Practice, IELTS Reading'
                         WHEN skill_type = 'writing' THEN 'Writing Practice, IELTS Writing'
                         WHEN skill_type = 'speaking' THEN 'Speaking Practice, IELTS Speaking'
                         ELSE 'IELTS Preparation'
                    END);

-- Summary
SELECT 
    '✅ Courses, Modules, and Lessons Created' as status,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM modules) as total_modules,
    (SELECT COUNT(*) FROM lessons) as total_lessons,
    (SELECT COUNT(*) FROM lesson_videos) as total_videos,
    (SELECT COUNT(*) FROM lesson_materials) as total_materials,
    (SELECT COUNT(*) FROM video_subtitles) as total_subtitles,
    (SELECT COUNT(*) FROM course_category_mapping) as total_category_mappings;

