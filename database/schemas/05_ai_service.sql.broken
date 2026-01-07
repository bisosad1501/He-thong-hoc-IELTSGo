-- ============================================
-- AI Service Database Schema
-- ============================================
-- Database: ai_db
-- Purpose: AI-powered evaluation for Writing and Speaking

-- CREATE DATABASE ai_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- WRITING_SUBMISSIONS TABLE
-- ============================================
-- Writing essays submitted by users for AI evaluation
CREATE TABLE writing_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Task information
    task_type VARCHAR(20) NOT NULL, -- task1, task2
    task_prompt_id UUID, -- Reference to the writing prompt/question
    task_prompt_text TEXT NOT NULL,
    
    -- Submission content
    essay_text TEXT NOT NULL,
    word_count INT NOT NULL,
    
    -- Metadata
    time_spent_seconds INT,
    submitted_from VARCHAR(20), -- web, android, ios
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    
    -- Related exercise/course
    exercise_id UUID,
    course_id UUID,
    lesson_id UUID,
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_writing_submissions_user_id ON writing_submissions(user_id);
CREATE INDEX idx_writing_submissions_status ON writing_submissions(status);
CREATE INDEX idx_writing_submissions_submitted_at ON writing_submissions(submitted_at);
CREATE INDEX idx_writing_submissions_task_type ON writing_submissions(task_type);

-- ============================================
-- WRITING_EVALUATIONS TABLE
-- ============================================
-- AI evaluation results for writing submissions
CREATE TABLE writing_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE NOT NULL REFERENCES writing_submissions(id) ON DELETE CASCADE,
    
    -- Overall score
    overall_band_score DECIMAL(2,1) NOT NULL,
    
    -- IELTS criteria scores (0-9.0)
    task_achievement_score DECIMAL(2,1) NOT NULL,
    coherence_cohesion_score DECIMAL(2,1) NOT NULL,
    lexical_resource_score DECIMAL(2,1) NOT NULL,
    grammar_accuracy_score DECIMAL(2,1) NOT NULL,
    
    -- Detailed analysis
    strengths TEXT[], -- Array of strength points
    weaknesses TEXT[], -- Array of weakness points
    
    -- Grammar analysis
    grammar_errors JSONB, -- [{type: "subject-verb agreement", example: "...", correction: "..."}]
    grammar_error_count INT DEFAULT 0,
    
    -- Vocabulary analysis
    vocabulary_level VARCHAR(20), -- basic, intermediate, advanced
    vocabulary_range_score DECIMAL(3,2), -- 0-1 score
    vocabulary_suggestions JSONB, -- [{word: "good", suggestion: "excellent/outstanding"}]
    
    -- Structure analysis
    paragraph_count INT,
    has_introduction BOOLEAN DEFAULT false,
    has_conclusion BOOLEAN DEFAULT false,
    structure_feedback TEXT,
    
    -- Coherence analysis
    linking_words_used TEXT[],
    coherence_feedback TEXT,
    
    -- Task-specific analysis
    addresses_all_parts BOOLEAN DEFAULT false,
    task_response_feedback TEXT,
    
    -- Overall feedback
    detailed_feedback TEXT NOT NULL,
    detailed_feedback_json JSONB, -- Structured bilingual feedback: {"task_achievement": {"vi": "...", "en": "..."}, ...}
    improvement_suggestions TEXT[],
    
    -- AI model info
    ai_model_name VARCHAR(100),
    ai_model_version VARCHAR(50),
    confidence_score DECIMAL(3,2), -- 0-1 confidence in evaluation
    
    -- Processing time
    processing_time_ms INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_writing_evaluations_submission_id ON writing_evaluations(submission_id);
CREATE INDEX idx_writing_evaluations_overall_band_score ON writing_evaluations(overall_band_score);

-- ============================================
-- SPEAKING_SUBMISSIONS TABLE
-- ============================================
-- Speaking recordings submitted for AI evaluation
CREATE TABLE speaking_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Task information
    part_number INT NOT NULL, -- 1, 2, or 3
    task_prompt_id UUID,
    task_prompt_text TEXT NOT NULL,
    
    -- Audio submission
    audio_url TEXT NOT NULL,
    audio_duration_seconds INT NOT NULL,
    audio_format VARCHAR(20), -- mp3, wav, m4a
    audio_file_size_bytes BIGINT,
    
    -- Transcription
    transcript_text TEXT,
    transcript_word_count INT,
    
    -- Metadata
    recorded_from VARCHAR(20), -- web, android, ios
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, transcribing, processing, completed, failed
    
    -- Related exercise/course
    exercise_id UUID,
    course_id UUID,
    lesson_id UUID,
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transcribed_at TIMESTAMP,
    evaluated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_speaking_submissions_user_id ON speaking_submissions(user_id);
CREATE INDEX idx_speaking_submissions_status ON speaking_submissions(status);
CREATE INDEX idx_speaking_submissions_submitted_at ON speaking_submissions(submitted_at);
CREATE INDEX idx_speaking_submissions_part_number ON speaking_submissions(part_number);

-- ============================================
-- SPEAKING_EVALUATIONS TABLE
-- ============================================
-- AI evaluation results for speaking submissions
CREATE TABLE speaking_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID UNIQUE NOT NULL REFERENCES speaking_submissions(id) ON DELETE CASCADE,
    
    -- Overall score
    overall_band_score DECIMAL(2,1) NOT NULL,
    
    -- IELTS criteria scores (0-9.0)
    fluency_coherence_score DECIMAL(2,1) NOT NULL,
    lexical_resource_score DECIMAL(2,1) NOT NULL,
    grammar_accuracy_score DECIMAL(2,1) NOT NULL,
    pronunciation_score DECIMAL(2,1) NOT NULL,
    
    -- Pronunciation analysis
    pronunciation_accuracy DECIMAL(5,2), -- 0-100%
    problematic_sounds JSONB, -- [{phoneme: "θ", word: "think", issue: "..."}]
    intonation_score DECIMAL(3,2), -- 0-1
    stress_accuracy DECIMAL(3,2), -- 0-1
    
    -- Fluency analysis
    speech_rate_wpm INT, -- Words per minute
    pause_frequency DECIMAL(5,2), -- Pauses per minute
    filler_words_count INT, -- "um", "uh", "like"
    filler_words_used TEXT[],
    hesitation_count INT,
    
    -- Vocabulary analysis
    vocabulary_level VARCHAR(20), -- basic, intermediate, advanced
    unique_words_count INT,
    advanced_words_used TEXT[],
    vocabulary_suggestions JSONB,
    
    -- Grammar analysis
    grammar_errors JSONB,
    grammar_error_count INT DEFAULT 0,
    sentence_complexity VARCHAR(20), -- simple, compound, complex
    
    -- Coherence analysis
    answers_question_directly BOOLEAN DEFAULT false,
    uses_linking_devices BOOLEAN DEFAULT false,
    coherence_feedback TEXT,
    
    -- Content analysis
    content_relevance_score DECIMAL(3,2), -- 0-1
    idea_development_score DECIMAL(3,2), -- 0-1
    content_feedback TEXT,
    
    -- Detailed feedback
    strengths TEXT[],
    weaknesses TEXT[],
    detailed_feedback TEXT NOT NULL,
    improvement_suggestions TEXT[],
    
    -- AI model info
    transcription_model VARCHAR(100),
    evaluation_model VARCHAR(100),
    model_version VARCHAR(50),
    confidence_score DECIMAL(3,2),
    
    -- Processing time
    transcription_time_ms INT,
    evaluation_time_ms INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_speaking_evaluations_submission_id ON speaking_evaluations(submission_id);
CREATE INDEX idx_speaking_evaluations_overall_band_score ON speaking_evaluations(overall_band_score);

-- ============================================
-- WRITING_PROMPTS TABLE
-- ============================================
-- Collection of IELTS writing prompts
CREATE TABLE writing_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Task information
    task_type VARCHAR(20) NOT NULL, -- task1, task2
    prompt_text TEXT NOT NULL,
    
    -- For Task 1 (charts, graphs, diagrams)
    visual_type VARCHAR(50), -- bar_chart, line_graph, pie_chart, table, diagram, map, process
    visual_url TEXT,
    
    -- Metadata
    topic VARCHAR(100), -- education, technology, environment, health, etc.
    difficulty VARCHAR(20), -- easy, medium, hard
    
    -- Sample answer
    has_sample_answer BOOLEAN DEFAULT false,
    sample_answer_text TEXT,
    sample_answer_band_score DECIMAL(2,1),
    
    -- Usage tracking
    times_used INT DEFAULT 0,
    average_score DECIMAL(2,1),
    
    -- Status
    is_published BOOLEAN DEFAULT true,
    created_by UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_writing_prompts_task_type ON writing_prompts(task_type);
CREATE INDEX idx_writing_prompts_topic ON writing_prompts(topic);
CREATE INDEX idx_writing_prompts_difficulty ON writing_prompts(difficulty);

-- ============================================
-- SPEAKING_PROMPTS TABLE
-- ============================================
-- Collection of IELTS speaking prompts
CREATE TABLE speaking_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Part information
    part_number INT NOT NULL, -- 1, 2, 3
    prompt_text TEXT NOT NULL,
    
    -- For Part 2 (cue cards)
    cue_card_topic VARCHAR(200),
    cue_card_points TEXT[], -- Points to cover
    preparation_time_seconds INT DEFAULT 60, -- Usually 1 minute
    speaking_time_seconds INT DEFAULT 120, -- Usually 2 minutes
    
    -- For Part 1 & 3 (follow-up questions)
    follow_up_questions TEXT[],
    
    -- Metadata
    topic_category VARCHAR(100), -- family, hobbies, work, travel, etc.
    difficulty VARCHAR(20),
    
    -- Sample answer
    has_sample_answer BOOLEAN DEFAULT false,
    sample_answer_text TEXT,
    sample_answer_audio_url TEXT,
    sample_answer_band_score DECIMAL(2,1),
    
    -- Usage tracking
    times_used INT DEFAULT 0,
    average_score DECIMAL(2,1),
    
    -- Status
    is_published BOOLEAN DEFAULT true,
    created_by UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_speaking_prompts_part_number ON speaking_prompts(part_number);
CREATE INDEX idx_speaking_prompts_topic_category ON speaking_prompts(topic_category);
CREATE INDEX idx_speaking_prompts_difficulty ON speaking_prompts(difficulty);

-- ============================================
-- GRADING_CRITERIA TABLE
-- ============================================
-- Detailed IELTS grading criteria for reference
CREATE TABLE grading_criteria (
    id SERIAL PRIMARY KEY,
    
    skill_type VARCHAR(20) NOT NULL, -- writing, speaking
    criterion_name VARCHAR(100) NOT NULL, -- task_achievement, coherence_cohesion, etc.
    band_score DECIMAL(2,1) NOT NULL,
    
    description TEXT NOT NULL,
    key_features TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert IELTS Writing criteria
INSERT INTO grading_criteria (skill_type, criterion_name, band_score, description, key_features) VALUES
('writing', 'task_achievement', 9.0, 'Band 9 Task Achievement', ARRAY['Fully addresses all parts', 'Presents fully developed position', 'Ideas are relevant, extended and supported']),
('writing', 'task_achievement', 7.0, 'Band 7 Task Achievement', ARRAY['Addresses all parts', 'Presents clear position', 'Main ideas are extended and supported']),
('writing', 'coherence_cohesion', 9.0, 'Band 9 Coherence and Cohesion', ARRAY['Uses cohesion seamlessly', 'Skillful paragraph management', 'No errors in cohesive devices']),
('writing', 'lexical_resource', 9.0, 'Band 9 Lexical Resource', ARRAY['Wide range of vocabulary', 'Natural and sophisticated usage', 'Rare minor errors']),
('writing', 'grammar_accuracy', 9.0, 'Band 9 Grammatical Range and Accuracy', ARRAY['Wide range of structures', 'Full flexibility and accuracy', 'Rare minor errors']);

-- ============================================
-- AI_MODEL_VERSIONS TABLE
-- ============================================
-- Track different AI model versions used
CREATE TABLE ai_model_versions (
    id SERIAL PRIMARY KEY,
    
    model_type VARCHAR(50) NOT NULL, -- transcription, writing_evaluation, speaking_evaluation
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    description TEXT,
    
    -- Performance metrics
    average_accuracy DECIMAL(5,2),
    average_processing_time_ms INT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    deployed_at TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(model_type, model_name, version)
);

-- ============================================
-- EVALUATION_FEEDBACK_RATINGS TABLE
-- ============================================
-- User feedback on AI evaluations
CREATE TABLE evaluation_feedback_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    evaluation_type VARCHAR(20) NOT NULL, -- writing, speaking
    evaluation_id UUID NOT NULL, -- Can reference either writing or speaking evaluation
    
    -- Rating
    is_helpful BOOLEAN,
    accuracy_rating INT CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    
    -- Feedback
    feedback_text TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_evaluation_feedback_user_id ON evaluation_feedback_ratings(user_id);
CREATE INDEX idx_evaluation_feedback_evaluation_id ON evaluation_feedback_ratings(evaluation_id);

-- ============================================
-- AI_PROCESSING_QUEUE TABLE
-- ============================================
-- Queue for AI processing tasks
CREATE TABLE ai_processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    task_type VARCHAR(50) NOT NULL, -- transcribe_audio, evaluate_writing, evaluate_speaking
    submission_id UUID NOT NULL,
    submission_type VARCHAR(20) NOT NULL, -- writing, speaking
    
    priority INT DEFAULT 5, -- 1-10, higher is more urgent
    
    status VARCHAR(20) DEFAULT 'queued', -- queued, processing, completed, failed
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    
    error_message TEXT,
    
    -- Processing info
    worker_id VARCHAR(100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ai_processing_queue_status ON ai_processing_queue(status);
CREATE INDEX idx_ai_processing_queue_priority ON ai_processing_queue(priority DESC, created_at ASC);
CREATE INDEX idx_ai_processing_queue_submission ON ai_processing_queue(submission_id, submission_type);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_writing_submissions_updated_at BEFORE UPDATE ON writing_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_speaking_submissions_updated_at BEFORE UPDATE ON speaking_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_ai_processing_queue_updated_at BEFORE UPDATE ON ai_processing_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create AI processing task when submission is created
CREATE OR REPLACE FUNCTION create_ai_processing_task()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'writing_submissions' THEN
        INSERT INTO ai_processing_queue (task_type, submission_id, submission_type)
        VALUES ('evaluate_writing', NEW.id, 'writing');
    ELSIF TG_TABLE_NAME = 'speaking_submissions' THEN
        -- First transcribe, then evaluate
        INSERT INTO ai_processing_queue (task_type, submission_id, submission_type, priority)
        VALUES ('transcribe_audio', NEW.id, 'speaking', 8);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_writing_task
    AFTER INSERT ON writing_submissions
    FOR EACH ROW
    EXECUTE FUNCTION create_ai_processing_task();
    
CREATE TRIGGER trigger_create_speaking_task
    AFTER INSERT ON speaking_submissions
    FOR EACH ROW
    EXECUTE FUNCTION create_ai_processing_task();

-- Function to calculate overall writing band score
CREATE OR REPLACE FUNCTION calculate_writing_band_score(
    task_achievement DECIMAL,
    coherence_cohesion DECIMAL,
    lexical_resource DECIMAL,
    grammar_accuracy DECIMAL
)
RETURNS DECIMAL(2,1) AS $$
BEGIN
    RETURN ROUND((task_achievement + coherence_cohesion + lexical_resource + grammar_accuracy) / 4, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall speaking band score
CREATE OR REPLACE FUNCTION calculate_speaking_band_score(
    fluency_coherence DECIMAL,
    lexical_resource DECIMAL,
    grammar_accuracy DECIMAL,
    pronunciation DECIMAL
)
RETURNS DECIMAL(2,1) AS $$
BEGIN
    RETURN ROUND((fluency_coherence + lexical_resource + grammar_accuracy + pronunciation) / 4, 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE writing_submissions IS 'Bài viết Writing được nộp để AI chấm điểm';
COMMENT ON TABLE writing_evaluations IS 'Kết quả đánh giá Writing từ AI';
COMMENT ON TABLE speaking_submissions IS 'Bài nói Speaking được ghi âm để AI chấm điểm';
COMMENT ON TABLE speaking_evaluations IS 'Kết quả đánh giá Speaking từ AI';
COMMENT ON TABLE writing_prompts IS 'Ngân hàng đề bài Writing';
COMMENT ON TABLE speaking_prompts IS 'Ngân hàng đề bài Speaking';
COMMENT ON TABLE ai_processing_queue IS 'Hàng đợi xử lý AI';
