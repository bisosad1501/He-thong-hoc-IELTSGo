package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bisosad1501/ielts-platform/exercise-service/internal/models"
	"github.com/bisosad1501/ielts-platform/exercise-service/internal/utils"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type ExerciseRepository struct {
	db *sql.DB
}

func NewExerciseRepository(db *sql.DB) *ExerciseRepository {
	return &ExerciseRepository{db: db}
}

// GetExercises returns paginated list with filters
func (r *ExerciseRepository) GetExercises(query *models.ExerciseListQuery) ([]models.Exercise, int, error) {
	where := []string{}
	args := []interface{}{}
	argCount := 0

	// Filter by is_published if specified, otherwise default to published only
	if query.IsPublished != nil {
		argCount++
		where = append(where, fmt.Sprintf("is_published = $%d", argCount))
		args = append(args, *query.IsPublished)
	} else {
		where = append(where, "is_published = true")
	}

	// Always filter out soft-deleted records
	where = append(where, "deleted_at IS NULL")

	// Parse comma-separated values for OR logic within same category
	// Example: skill_type=listening,reading -> skill_type IN ('listening', 'reading')
	if query.SkillType != "" {
		skillTypes := strings.Split(strings.TrimSpace(query.SkillType), ",")
		if len(skillTypes) == 1 {
			// Single value
			argCount++
			where = append(where, fmt.Sprintf("skill_type = $%d", argCount))
			args = append(args, strings.TrimSpace(skillTypes[0]))
		} else {
			// Multiple values - use IN clause for OR logic
			placeholders := []string{}
			for _, skillType := range skillTypes {
				argCount++
				placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
				args = append(args, strings.TrimSpace(skillType))
			}
			where = append(where, fmt.Sprintf("skill_type IN (%s)", strings.Join(placeholders, ", ")))
		}
	}

	if query.Difficulty != "" {
		difficulties := strings.Split(strings.TrimSpace(query.Difficulty), ",")
		if len(difficulties) == 1 {
			argCount++
			where = append(where, fmt.Sprintf("difficulty = $%d", argCount))
			args = append(args, strings.TrimSpace(difficulties[0]))
		} else {
			placeholders := []string{}
			for _, difficulty := range difficulties {
				argCount++
				placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
				args = append(args, strings.TrimSpace(difficulty))
			}
			where = append(where, fmt.Sprintf("difficulty IN (%s)", strings.Join(placeholders, ", ")))
		}
	}

	if query.ExerciseType != "" {
		exerciseTypes := strings.Split(strings.TrimSpace(query.ExerciseType), ",")
		if len(exerciseTypes) == 1 {
			argCount++
			where = append(where, fmt.Sprintf("exercise_type = $%d", argCount))
			args = append(args, strings.TrimSpace(exerciseTypes[0]))
		} else {
			placeholders := []string{}
			for _, exerciseType := range exerciseTypes {
				argCount++
				placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
				args = append(args, strings.TrimSpace(exerciseType))
			}
			where = append(where, fmt.Sprintf("exercise_type IN (%s)", strings.Join(placeholders, ", ")))
		}
	}

	if query.IsFree != nil {
		argCount++
		where = append(where, fmt.Sprintf("is_free = $%d", argCount))
		args = append(args, *query.IsFree)
	}

	if query.CourseID != nil {
		argCount++
		if query.CourseLevelOnly {
			// Only return exercises with course_id but module_id = NULL
			where = append(where, fmt.Sprintf("course_id = $%d AND module_id IS NULL", argCount))
		} else {
			where = append(where, fmt.Sprintf("course_id = $%d", argCount))
		}
		args = append(args, *query.CourseID)
	}

	if query.ModuleID != nil {
		argCount++
		// Get course_id for this module (we need to join with course_db, but that's cross-database)
		// Instead, we'll use a subquery or handle this in Course Service
		// For now, query exercises that belong to this module OR are course-level (module_id = NULL)
		// Note: Course Service should pass course_id as well for proper filtering
		where = append(where, fmt.Sprintf("module_id = $%d", argCount))
		args = append(args, *query.ModuleID)
	}

	// Filter by creator/instructor
	if query.CreatedBy != nil {
		argCount++
		where = append(where, fmt.Sprintf("created_by = $%d", argCount))
		args = append(args, *query.CreatedBy)
	}

	if query.Search != "" {
		argCount++
		where = append(where, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argCount, argCount))
		args = append(args, "%"+query.Search+"%")
	}

	whereClause := strings.Join(where, " AND ")

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM exercises WHERE %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Build ORDER BY clause based on sort_by and sort_order
	orderBy := "e.display_order ASC, e.created_at DESC" // Default fallback
	if query.SortBy != "" {
		sortOrder := "DESC"
		if query.SortOrder == "asc" {
			sortOrder = "ASC"
		}

		switch query.SortBy {
		case "newest":
			orderBy = fmt.Sprintf("e.created_at %s", sortOrder)
		case "popular":
			orderBy = fmt.Sprintf("e.total_attempts %s, e.created_at DESC", sortOrder)
		case "difficulty":
			// Map difficulty to numeric value for proper sorting
			orderBy = fmt.Sprintf(`
				CASE e.difficulty 
					WHEN 'easy' THEN 1 
					WHEN 'medium' THEN 2 
					WHEN 'hard' THEN 3 
					ELSE 0 
				END %s, e.created_at DESC
			`, sortOrder)
		case "title":
			orderBy = fmt.Sprintf("e.title %s", sortOrder)
		default:
			// Keep default fallback
		}
	}

	// Get paginated results
	offset := (query.Page - 1) * query.Limit
	argCount++
	limitArg := argCount
	argCount++
	offsetArg := argCount

	selectQuery := fmt.Sprintf(`
		SELECT 
			e.id, e.title, e.slug, e.description, e.exercise_type, e.skill_type, e.ielts_test_type, e.difficulty,
			e.ielts_level, 
			COALESCE((
				SELECT COUNT(*) FROM questions q 
				INNER JOIN exercise_sections es ON q.section_id = es.id 
				WHERE es.exercise_id = e.id
			), 0) as total_questions,
			e.total_sections, e.time_limit_minutes,
			e.thumbnail_url, e.audio_url, e.audio_duration_seconds, e.audio_transcript,
			e.passage_count, e.course_id, e.module_id, e.passing_score, e.total_points,
			e.is_free, e.is_published, e.total_attempts, e.average_score,
			e.average_completion_time, e.display_order, e.created_by, e.published_at,
			e.created_at, e.updated_at
		FROM exercises e
		WHERE %s 
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, limitArg, offsetArg)

	args = append(args, query.Limit, offset)

	rows, err := r.db.Query(selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	exercises := []models.Exercise{}
	for rows.Next() {
		var e models.Exercise
		err := rows.Scan(
			&e.ID, &e.Title, &e.Slug, &e.Description, &e.ExerciseType, &e.SkillType, &e.IELTSTestType,
			&e.Difficulty, &e.IELTSLevel, &e.TotalQuestions, &e.TotalSections,
			&e.TimeLimitMinutes, &e.ThumbnailURL, &e.AudioURL, &e.AudioDurationSeconds,
			&e.AudioTranscript, &e.PassageCount, &e.CourseID, &e.ModuleID,
			&e.PassingScore, &e.TotalPoints, &e.IsFree, &e.IsPublished,
			&e.TotalAttempts, &e.AverageScore, &e.AverageCompletionTime,
			&e.DisplayOrder, &e.CreatedBy, &e.PublishedAt, &e.CreatedAt, &e.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		exercises = append(exercises, e)
	}

	return exercises, total, nil
}

// GetExerciseByID returns exercise with sections and questions
func (r *ExerciseRepository) GetExerciseByID(id uuid.UUID) (*models.ExerciseDetailResponse, error) {
	// Get exercise
	var exercise models.Exercise
	err := r.db.QueryRow(`
		SELECT 
			e.id, e.title, e.slug, e.description, e.exercise_type, e.skill_type, e.ielts_test_type, e.difficulty,
			e.ielts_level, 
			COALESCE((
				SELECT COUNT(*) FROM questions q 
				INNER JOIN exercise_sections es ON q.section_id = es.id 
				WHERE es.exercise_id = e.id
			), 0) as total_questions,
			e.total_sections, e.time_limit_minutes,
			e.thumbnail_url, e.audio_url, e.audio_duration_seconds, e.audio_transcript,
			e.passage_count, e.course_id, e.module_id, e.passing_score, e.total_points,
			e.is_free, e.is_published, e.total_attempts, e.average_score,
			e.average_completion_time, e.display_order, e.created_by, e.published_at,
			e.created_at, e.updated_at,
			e.writing_task_type, e.writing_prompt_text, e.writing_visual_type, e.writing_visual_url, e.writing_word_requirement,
			e.speaking_part_number, e.speaking_prompt_text, e.speaking_cue_card_topic, e.speaking_cue_card_points,
			e.speaking_preparation_time_seconds, e.speaking_response_time_seconds, e.speaking_follow_up_questions
		FROM exercises e
		WHERE e.id = $1 AND e.is_published = true AND e.deleted_at IS NULL
	`, id).Scan(
		&exercise.ID, &exercise.Title, &exercise.Slug, &exercise.Description,
		&exercise.ExerciseType, &exercise.SkillType, &exercise.IELTSTestType, &exercise.Difficulty,
		&exercise.IELTSLevel, &exercise.TotalQuestions, &exercise.TotalSections,
		&exercise.TimeLimitMinutes, &exercise.ThumbnailURL, &exercise.AudioURL,
		&exercise.AudioDurationSeconds, &exercise.AudioTranscript, &exercise.PassageCount,
		&exercise.CourseID, &exercise.ModuleID, &exercise.PassingScore,
		&exercise.TotalPoints, &exercise.IsFree, &exercise.IsPublished,
		&exercise.TotalAttempts, &exercise.AverageScore, &exercise.AverageCompletionTime,
		&exercise.DisplayOrder, &exercise.CreatedBy, &exercise.PublishedAt,
		&exercise.CreatedAt, &exercise.UpdatedAt,
		&exercise.WritingTaskType, &exercise.WritingPromptText, &exercise.WritingVisualType, &exercise.WritingVisualURL, &exercise.WritingWordRequirement,
		&exercise.SpeakingPartNumber, &exercise.SpeakingPromptText, &exercise.SpeakingCueCardTopic, pq.Array(&exercise.SpeakingCueCardPoints),
		&exercise.SpeakingPreparationTime, &exercise.SpeakingResponseTime, pq.Array(&exercise.SpeakingFollowUpQuestions),
	)
	if err != nil {
		return nil, err
	}

	// Get sections with questions
	sections, err := r.GetSectionsWithQuestions(id)
	if err != nil {
		return nil, err
	}

	return &models.ExerciseDetailResponse{
		Exercise: &exercise,
		Sections: sections,
	}, nil
}

// GetExerciseByIDAdmin returns exercise with sections and questions (including unpublished)
func (r *ExerciseRepository) GetExerciseByIDAdmin(id uuid.UUID) (*models.ExerciseDetailResponse, error) {
	// Get exercise (without is_published filter for admin)
	var exercise models.Exercise
	err := r.db.QueryRow(`
		SELECT 
			e.id, e.title, e.slug, e.description, e.exercise_type, e.skill_type, e.ielts_test_type, e.difficulty,
			e.ielts_level, 
			COALESCE((
				SELECT COUNT(*) FROM questions q 
				INNER JOIN exercise_sections es ON q.section_id = es.id 
				WHERE es.exercise_id = e.id
			), 0) as total_questions,
			e.total_sections, e.time_limit_minutes,
			e.thumbnail_url, e.audio_url, e.audio_duration_seconds, e.audio_transcript,
			e.passage_count, e.course_id, e.module_id, e.passing_score, e.total_points,
			e.is_free, e.is_published, e.total_attempts, e.average_score,
			e.average_completion_time, e.display_order, e.created_by, e.published_at,
			e.created_at, e.updated_at,
			e.writing_task_type, e.writing_prompt_text, e.writing_visual_type, e.writing_visual_url, e.writing_word_requirement,
			e.speaking_part_number, e.speaking_prompt_text, e.speaking_cue_card_topic, e.speaking_cue_card_points,
			e.speaking_preparation_time_seconds, e.speaking_response_time_seconds, e.speaking_follow_up_questions
		FROM exercises e
		WHERE e.id = $1 AND e.deleted_at IS NULL
	`, id).Scan(
		&exercise.ID, &exercise.Title, &exercise.Slug, &exercise.Description,
		&exercise.ExerciseType, &exercise.SkillType, &exercise.IELTSTestType, &exercise.Difficulty,
		&exercise.IELTSLevel, &exercise.TotalQuestions, &exercise.TotalSections,
		&exercise.TimeLimitMinutes, &exercise.ThumbnailURL, &exercise.AudioURL,
		&exercise.AudioDurationSeconds, &exercise.AudioTranscript, &exercise.PassageCount,
		&exercise.CourseID, &exercise.ModuleID, &exercise.PassingScore,
		&exercise.TotalPoints, &exercise.IsFree, &exercise.IsPublished,
		&exercise.TotalAttempts, &exercise.AverageScore, &exercise.AverageCompletionTime,
		&exercise.DisplayOrder, &exercise.CreatedBy, &exercise.PublishedAt,
		&exercise.CreatedAt, &exercise.UpdatedAt,
		&exercise.WritingTaskType, &exercise.WritingPromptText, &exercise.WritingVisualType,
		&exercise.WritingVisualURL, &exercise.WritingWordRequirement, &exercise.SpeakingPartNumber,
		&exercise.SpeakingPromptText, &exercise.SpeakingCueCardTopic, pq.Array(&exercise.SpeakingCueCardPoints),
		&exercise.SpeakingPreparationTime, &exercise.SpeakingResponseTime,
		pq.Array(&exercise.SpeakingFollowUpQuestions),
	)

	if err != nil {
		return nil, err
	}

	// Get sections with questions
	sections, err := r.GetSectionsWithQuestions(id)
	if err != nil {
		return nil, err
	}

	return &models.ExerciseDetailResponse{
		Exercise: &exercise,
		Sections: sections,
	}, nil
}

// GetSectionsWithQuestions returns sections with their questions
func (r *ExerciseRepository) GetSectionsWithQuestions(exerciseID uuid.UUID) ([]models.SectionWithQuestions, error) {
	// Get sections
	sectionRows, err := r.db.Query(`
		SELECT id, exercise_id, title, description, section_number, audio_url,
			audio_start_time, audio_end_time, transcript, passage_title,
			passage_content, passage_word_count, instructions, total_questions,
			time_limit_minutes, display_order, created_at, updated_at
		FROM exercise_sections 
		WHERE exercise_id = $1 
		ORDER BY section_number
	`, exerciseID)
	if err != nil {
		return nil, err
	}
	defer sectionRows.Close()

	sections := []models.SectionWithQuestions{}
	for sectionRows.Next() {
		var section models.ExerciseSection
		err := sectionRows.Scan(
			&section.ID, &section.ExerciseID, &section.Title, &section.Description,
			&section.SectionNumber, &section.AudioURL, &section.AudioStartTime,
			&section.AudioEndTime, &section.Transcript, &section.PassageTitle,
			&section.PassageContent, &section.PassageWordCount, &section.Instructions,
			&section.TotalQuestions, &section.TimeLimitMinutes, &section.DisplayOrder,
			&section.CreatedAt, &section.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Get questions for this section
		questions, err := r.GetQuestionsWithOptions(section.ID)
		if err != nil {
			return nil, err
		}

		sections = append(sections, models.SectionWithQuestions{
			Section:   &section,
			Questions: questions,
		})
	}

	return sections, nil
}

// GetQuestionsWithOptions returns questions with their options
func (r *ExerciseRepository) GetQuestionsWithOptions(sectionID uuid.UUID) ([]models.QuestionWithOptions, error) {
	questionRows, err := r.db.Query(`
		SELECT id, exercise_id, section_id, question_number, question_text,
			question_type, audio_url, image_url, context_text, points,
			difficulty, explanation, tips, display_order, created_at, updated_at
		FROM questions 
		WHERE section_id = $1 
		ORDER BY question_number
	`, sectionID)
	if err != nil {
		return nil, err
	}
	defer questionRows.Close()

	questions := []models.QuestionWithOptions{}
	for questionRows.Next() {
		var question models.Question
		err := questionRows.Scan(
			&question.ID, &question.ExerciseID, &question.SectionID,
			&question.QuestionNumber, &question.QuestionText, &question.QuestionType,
			&question.AudioURL, &question.ImageURL, &question.ContextText,
			&question.Points, &question.Difficulty, &question.Explanation,
			&question.Tips, &question.DisplayOrder, &question.CreatedAt,
			&question.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Get options based on question type
		var options []models.QuestionOption

		if question.QuestionType == "multiple_choice" || question.QuestionType == "matching" {
			optionRows, err := r.db.Query(`
				SELECT id, question_id, option_label, option_text, option_image_url,
					is_correct, display_order, created_at
				FROM question_options 
				WHERE question_id = $1 
				ORDER BY display_order
			`, question.ID)
			if err != nil {
				return nil, err
			}
			defer optionRows.Close()

			for optionRows.Next() {
				var option models.QuestionOption
				err := optionRows.Scan(
					&option.ID, &option.QuestionID, &option.OptionLabel,
					&option.OptionText, &option.OptionImageURL, &option.IsCorrect,
					&option.DisplayOrder, &option.CreatedAt,
				)
				if err != nil {
					return nil, err
				}
				options = append(options, option)
			}
		}

		// Get answers for admin view
		var answers []models.QuestionAnswer
		answerRows, err := r.db.Query(`
			SELECT id, question_id, answer_text, answer_variations,
				created_at
			FROM question_answers
			WHERE question_id = $1
			ORDER BY created_at
		`, question.ID)
		if err != nil {
			return nil, err
		}
		defer answerRows.Close()

		for answerRows.Next() {
			var answer models.QuestionAnswer
			var answerVariations pq.StringArray
			err := answerRows.Scan(
				&answer.ID, &answer.QuestionID, &answer.AnswerText,
				&answerVariations, &answer.CreatedAt,
			)
			if err != nil {
				return nil, err
			}
			// Convert array to JSON string for frontend compatibility
			if len(answerVariations) > 0 {
				altJSON, _ := json.Marshal(answerVariations)
				altJSONStr := string(altJSON)
				answer.AlternativeAnswers = &altJSONStr
			}
			answers = append(answers, answer)
		}

		questions = append(questions, models.QuestionWithOptions{
			Question: &question,
			Options:  options,
			Answers:  answers,
		})
	}

	return questions, nil
}

// CreateSubmission starts a new submission (uses user_exercise_attempts table)
func (r *ExerciseRepository) CreateSubmission(userID, exerciseID uuid.UUID, deviceType *string) (*models.UserExerciseAttempt, error) {
	// Get exercise details
	var totalQuestions int
	var timeLimitMinutes *int
	err := r.db.QueryRow(`
		SELECT total_questions, time_limit_minutes 
		FROM exercises 
		WHERE id = $1
	`, exerciseID).Scan(&totalQuestions, &timeLimitMinutes)
	if err != nil {
		return nil, err
	}

	// FIX #13: Use database calculation in INSERT to avoid race condition
	// Instead of SELECT + INSERT, do INSERT with subquery for attempt_number
	submissionID := uuid.New()
	now := time.Now()
	status := "in_progress"
	questionsAnswered := 0
	correctAnswers := 0
	timeSpent := 0

	var attemptNumber int
	err = r.db.QueryRow(`
		INSERT INTO user_exercise_attempts (
			id, user_id, exercise_id, attempt_number, status, 
			total_questions, questions_answered, correct_answers, 
			time_limit_minutes, time_spent_seconds, started_at, device_type,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, 
			(SELECT COALESCE(MAX(attempt_number), 0) + 1 
			 FROM user_exercise_attempts 
			 WHERE user_id = $2 AND exercise_id = $3),
			$4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
		RETURNING attempt_number
	`, submissionID, userID, exerciseID, status, totalQuestions, questionsAnswered,
		correctAnswers, timeLimitMinutes, timeSpent, now, deviceType, now, now).Scan(&attemptNumber)

	if err != nil {
		return nil, err
	}

	submission := &models.UserExerciseAttempt{
		ID:                submissionID,
		UserID:            userID,
		ExerciseID:        exerciseID,
		AttemptNumber:     attemptNumber,
		Status:            status,
		TotalQuestions:    totalQuestions,
		QuestionsAnswered: questionsAnswered,
		CorrectAnswers:    correctAnswers,
		TimeSpentSeconds:  timeSpent,
		TimeLimitMinutes:  timeLimitMinutes,
		StartedAt:         now,
		DeviceType:        deviceType,
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	return submission, nil
}

// SaveSubmissionAnswers saves all answers and grades submission
func (r *ExerciseRepository) SaveSubmissionAnswers(submissionID uuid.UUID, answers []models.SubmitAnswerItem) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Get user_id once before loop
	var userID uuid.UUID
	err = tx.QueryRow(`
		SELECT user_id FROM user_exercise_attempts WHERE id = $1
	`, submissionID).Scan(&userID)
	if err != nil {
		return fmt.Errorf("submission not found: %s: %w", submissionID, err)
	}

	log.Printf("[Exercise-Repo] Saving %d answers for submission %s (user: %s)", len(answers), submissionID, userID)

	// If no answers provided, just return (will be graded as 0 points)
	if len(answers) == 0 {
		log.Printf("[Exercise-Repo] No answers provided for submission %s, will be graded as 0 points", submissionID)
		return tx.Commit()
	}

	// Get exercise_id from submission to validate questions belong to this exercise
	var exerciseID uuid.UUID
	err = tx.QueryRow(`
		SELECT exercise_id FROM user_exercise_attempts WHERE id = $1
	`, submissionID).Scan(&exerciseID)
	if err != nil {
		return fmt.Errorf("failed to get exercise_id from submission: %w", err)
	}

	for _, answer := range answers {
		// Get question details for grading and validate it belongs to the exercise
		var questionType string
		var points float64
		var questionExerciseID uuid.UUID
		err := tx.QueryRow(`
			SELECT question_type, points, exercise_id FROM questions WHERE id = $1
		`, answer.QuestionID).Scan(&questionType, &points, &questionExerciseID)
		if err != nil {
			log.Printf("[Exercise-Repo] Error fetching question %s: %v", answer.QuestionID, err)
			return fmt.Errorf("question not found: %s: %w", answer.QuestionID, err)
		}

		// Validate question belongs to the exercise
		if questionExerciseID != exerciseID {
			log.Printf("[Exercise-Repo] Question %s does not belong to exercise %s (belongs to %s)",
				answer.QuestionID, exerciseID, questionExerciseID)
			return fmt.Errorf("question %s does not belong to exercise %s", answer.QuestionID, exerciseID)
		}

		isCorrect := false
		pointsEarned := 0.0

		// Grade based on question type
		if questionType == "multiple_choice" || questionType == "matching" {
			if answer.SelectedOptionID != nil {
				var optionIsCorrect bool
				err = tx.QueryRow(`
					SELECT is_correct FROM question_options 
					WHERE id = $1
				`, *answer.SelectedOptionID).Scan(&optionIsCorrect)
				if err == nil && optionIsCorrect {
					isCorrect = true
					pointsEarned = points
				}
			}
		} else {
			// Text-based questions (fill-in-blank, short_answer)
			if answer.TextAnswer != nil && *answer.TextAnswer != "" {
				var answerText string
				var answerVariations pq.StringArray
				err = tx.QueryRow(`
					SELECT answer_text, COALESCE(answer_variations, '{}')
					FROM question_answers 
					WHERE question_id = $1
				`, answer.QuestionID).Scan(&answerText, &answerVariations)

				if err == nil {
					// Case-insensitive comparison by default
					userAnswer := strings.ToLower(strings.TrimSpace(*answer.TextAnswer))
					answerText = strings.ToLower(strings.TrimSpace(answerText))

					// Check main answer
					if userAnswer == answerText {
						isCorrect = true
						pointsEarned = points
					} else {
						// Check alternative answer variations
						for _, alt := range answerVariations {
							if strings.ToLower(strings.TrimSpace(alt)) == userAnswer {
								isCorrect = true
								pointsEarned = points
								break
							}
						}
					}
				} else {
					// Log warning when correct answer not found in database
					log.Printf("[Exercise-Repo] ⚠️  WARNING: No correct answer found for question %s (question_id: %s). User answer: '%s'. Error: %v",
						answer.QuestionID, answer.QuestionID, *answer.TextAnswer, err)
					// Answer will be marked as incorrect (isCorrect = false, pointsEarned = 0)
				}
			}
		}

		// UPSERT: Insert or update answer (atomic operation with unique constraint)
		_, err = tx.Exec(`
			INSERT INTO user_answers (
				id, attempt_id, question_id, user_id, answer_text, selected_option_id,
				is_correct, points_earned, time_spent_seconds, answered_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (attempt_id, question_id) DO UPDATE SET
				answer_text = EXCLUDED.answer_text,
				selected_option_id = EXCLUDED.selected_option_id,
				is_correct = EXCLUDED.is_correct,
				points_earned = EXCLUDED.points_earned,
				time_spent_seconds = COALESCE(EXCLUDED.time_spent_seconds, user_answers.time_spent_seconds),
				answered_at = EXCLUDED.answered_at,
				updated_at = CURRENT_TIMESTAMP
		`, uuid.New(), submissionID, answer.QuestionID, userID, answer.TextAnswer,
			answer.SelectedOptionID, isCorrect, pointsEarned, answer.TimeSpentSeconds,
			time.Now())
		if err != nil {
			log.Printf("[Exercise-Repo] Error upserting answer for question %s: %v", answer.QuestionID, err)
			return fmt.Errorf("failed to upsert answer: %w", err)
		}
	}

	return tx.Commit()
}

// CompleteSubmission finalizes submission (backward compatibility)
func (r *ExerciseRepository) CompleteSubmission(submissionID uuid.UUID) error {
	return r.CompleteSubmissionWithTime(submissionID, nil)
}

// CompleteSubmissionWithTime finalizes submission and calculates final score with optional frontend time
func (r *ExerciseRepository) CompleteSubmissionWithTime(submissionID uuid.UUID, frontendTimeSpent *int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// FIX #18: Check if already completed to prevent duplicate completion
	var currentStatus string
	var startedAt time.Time
	var totalQuestions int
	var exerciseID uuid.UUID
	var timeLimitMinutes *int
	err = tx.QueryRow(`
		SELECT status, started_at, total_questions, exercise_id, time_limit_minutes
		FROM user_exercise_attempts 
		WHERE id = $1
	`, submissionID).Scan(&currentStatus, &startedAt, &totalQuestions, &exerciseID, &timeLimitMinutes)
	if err != nil {
		return err
	}

	// If already completed, skip to avoid duplicate statistics
	if currentStatus == "completed" {
		log.Printf("[Exercise-Repo] Submission %s already completed, skipping duplicate completion", submissionID)
		return nil
	}

	// Calculate statistics from user_answers
	var correctCount int
	var totalPointsEarned float64
	var totalTimeSpent int
	var questionsAnswered int

	err = tx.QueryRow(`
		SELECT 
			COUNT(*) as answered,
			COUNT(CASE WHEN is_correct = true THEN 1 END) as correct,
			COALESCE(SUM(points_earned), 0) as points,
			COALESCE(SUM(time_spent_seconds), 0) as time_spent
		FROM user_answers
		WHERE attempt_id = $1
	`, submissionID).Scan(&questionsAnswered, &correctCount, &totalPointsEarned, &totalTimeSpent)
	if err != nil {
		return err
	}

	// Get total points and passing score from exercise
	var totalPoints float64
	var passingScore float64
	err = tx.QueryRow(`
		SELECT COALESCE(total_points, 0), COALESCE(passing_score, 0)
		FROM exercises 
		WHERE id = $1
	`, exerciseID).Scan(&totalPoints, &passingScore)
	if err != nil {
		return err
	}

	// Calculate score - use percentage if totalPoints not available or is 0
	// Score should represent percentage (0-100) for consistency
	var score float64
	if totalPoints > 0 && totalPointsEarned > 0 {
		// Calculate percentage from points earned
		score = (totalPointsEarned / totalPoints) * 100
	} else if totalQuestions > 0 {
		// Fallback: calculate percentage from correct answers
		score = (float64(correctCount) / float64(totalQuestions)) * 100
	} else {
		score = 0.0
	}

	// Calculate IELTS band score (0-9 scale) using official conversion table
	// Get skill type and test type (Academic vs General Training) from exercise
	// Priority: Use ielts_test_type field if available, otherwise detect from title/slug
	var skillType string
	var ieltsTestType *string
	var exerciseTitle string
	var exerciseSlug string
	err = tx.QueryRow(`
		SELECT skill_type, ielts_test_type, title, slug 
		FROM exercises 
		WHERE id = $1
	`, exerciseID).Scan(&skillType, &ieltsTestType, &exerciseTitle, &exerciseSlug)
	if err != nil {
		// Fallback to "listening" if cannot determine
		skillType = "listening"
	}

	// Determine test type for Reading exercises
	// Priority 1: Use ielts_test_type field if available (from database, most accurate)
	// Priority 2: Detect from title/slug (fallback for exercises created before migration)
	var testType string
	if skillType == "reading" {
		if ieltsTestType != nil && *ieltsTestType == "general_training" {
			// Use database field (most accurate)
			testType = "general_training"
			log.Printf("[Exercise-Repo] Using General Training for Reading exercise %s (from ielts_test_type field)", exerciseID)
		} else {
			// Fallback: Detect from title/slug (for backward compatibility)
			titleLower := strings.ToLower(exerciseTitle)
			slugLower := strings.ToLower(exerciseSlug)

			// Check for explicit "general training" patterns
			generalPatterns := []string{
				"general training",
				"general-training",
				" general ",
				" gt ",
				"-gt",
				"gt-",
			}

			isGeneralTraining := false
			for _, pattern := range generalPatterns {
				if strings.Contains(titleLower, pattern) || strings.Contains(slugLower, pattern) {
					isGeneralTraining = true
					break
				}
			}

			// Also check for standalone "gt" (not part of another word)
			if !isGeneralTraining {
				// Check for " gt" (space before) or "gt " (space after) or at start/end
				if strings.HasPrefix(titleLower, "gt ") || strings.HasSuffix(titleLower, " gt") ||
					strings.HasPrefix(slugLower, "gt-") || strings.HasSuffix(slugLower, "-gt") ||
					strings.Contains(titleLower, " gt ") || strings.Contains(slugLower, "-gt-") {
					isGeneralTraining = true
				}
			}

			if isGeneralTraining {
				testType = "general_training"
				log.Printf("[Exercise-Repo] Detected General Training for Reading exercise %s (from title/slug: '%s', '%s')",
					exerciseID, exerciseTitle, exerciseSlug)
			} else {
				testType = "academic" // Default to Academic
				log.Printf("[Exercise-Repo] Using Academic for Reading exercise %s (from title/slug: '%s', '%s')",
					exerciseID, exerciseTitle, exerciseSlug)
			}
		}
	}

	// Use official IELTS conversion table (raw score → band score)
	// Pass testType for Reading exercises to use correct conversion table
	var bandScore float64
	if testType != "" {
		bandScore = utils.ConvertRawScoreToBandScore(skillType, correctCount, totalQuestions, testType)
	} else {
		bandScore = utils.ConvertRawScoreToBandScore(skillType, correctCount, totalQuestions)
	}

	// Calculate time spent - prioritize frontend tracked time for accuracy
	// This ensures time represents ACTIVE study time, not just elapsed wall-clock time
	completedAt := time.Now()
	var timeSpent int

	if frontendTimeSpent != nil && *frontendTimeSpent > 0 {
		// PRIMARY: Use frontend-tracked time (most accurate - only counts active time)
		// Frontend timer runs only when user is actively working on exercise
		timeSpent = *frontendTimeSpent
		log.Printf("[Exercise-Repo] ✅ Using frontend-tracked time: %d seconds (~%.1f minutes)",
			timeSpent, float64(timeSpent)/60)
	} else {
		// FALLBACK: Calculate elapsed time from started_at to now
		// This is less accurate as it includes time when user might be inactive
		elapsedSeconds := int(completedAt.Sub(startedAt).Seconds())
		log.Printf("[Exercise-Repo] ⚠️  No frontend time, calculating elapsed: %d seconds", elapsedSeconds)

		// Use totalTimeSpent from answers if available and reasonable
		if totalTimeSpent > 0 && totalTimeSpent <= elapsedSeconds {
			timeSpent = totalTimeSpent
			log.Printf("[Exercise-Repo] Using sum of answer times: %d seconds", timeSpent)
		} else {
			timeSpent = elapsedSeconds
			log.Printf("[Exercise-Repo] Using elapsed time: %d seconds", timeSpent)
		}
	}

	// VALIDATION: Cap at time limit if exceeded (soft limit, with warning)
	// This ensures data integrity without rejecting legitimate submissions
	if timeLimitMinutes != nil && *timeLimitMinutes > 0 {
		maxSeconds := *timeLimitMinutes * 60
		if timeSpent > maxSeconds {
			exceededBy := timeSpent - maxSeconds
			log.Printf("[Exercise-Repo] ⚠️  WARNING: Submission %s exceeded time limit by %d seconds (spent: %d, limit: %d). Capping at limit.",
				submissionID, exceededBy, timeSpent, maxSeconds)
			timeSpent = maxSeconds
		}
	}

	log.Printf("[Exercise-Repo] 📊 Final time_spent_seconds: %d (~%.1f minutes)", timeSpent, float64(timeSpent)/60)

	// Update attempt
	_, err = tx.Exec(`
		UPDATE user_exercise_attempts SET
			completed_at = $1,
			time_spent_seconds = $2,
			questions_answered = $3,
			correct_answers = $4,
			score = $5,
			band_score = $6,
			status = 'completed',
			updated_at = $7
		WHERE id = $8
	`, completedAt, timeSpent, questionsAnswered, correctCount,
		score, bandScore, completedAt, submissionID)
	if err != nil {
		return err
	}

	// Update exercise statistics
	_, err = tx.Exec(`
		UPDATE exercises SET
			total_attempts = total_attempts + 1,
			average_score = (
				SELECT AVG(score)
				FROM user_exercise_attempts
				WHERE exercise_id = $1 AND status = 'completed'
			),
			average_completion_time = (
				SELECT AVG(time_spent_seconds)
				FROM user_exercise_attempts
				WHERE exercise_id = $1 AND status = 'completed'
			),
			updated_at = $2
		WHERE id = $1
	`, exerciseID, time.Now())
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetSubmissionResult returns detailed submission result (uses user_exercise_attempts)
func (r *ExerciseRepository) GetSubmissionResult(submissionID uuid.UUID) (*models.SubmissionResultResponse, error) {
	// Get attempt
	var submission models.UserExerciseAttempt
	var audioURL sql.NullString
	var transcriptText sql.NullString
	err := r.db.QueryRow(`
		SELECT id, user_id, exercise_id, attempt_number, status, total_questions,
			questions_answered, correct_answers, score, band_score, 
			time_limit_minutes, time_spent_seconds, started_at, completed_at,
			device_type, created_at, updated_at,
			essay_text, audio_url, transcript_text, evaluation_status, ai_feedback, detailed_scores
		FROM user_exercise_attempts WHERE id = $1
	`, submissionID).Scan(
		&submission.ID, &submission.UserID, &submission.ExerciseID,
		&submission.AttemptNumber, &submission.Status, &submission.TotalQuestions,
		&submission.QuestionsAnswered, &submission.CorrectAnswers, &submission.Score,
		&submission.BandScore, &submission.TimeLimitMinutes, &submission.TimeSpentSeconds,
		&submission.StartedAt, &submission.CompletedAt, &submission.DeviceType,
		&submission.CreatedAt, &submission.UpdatedAt,
		&submission.EssayText, &audioURL, &transcriptText,
		&submission.EvaluationStatus, &submission.AIFeedback, &submission.DetailedScores,
	)
	if err != nil {
		return nil, err
	}

	// Handle NULL values for audio_url and transcript_text
	if audioURL.Valid && audioURL.String != "" {
		submission.AudioURL = &audioURL.String
		log.Printf("📎 [GetSubmissionResult] Audio URL from DB: %s", audioURL.String)
	} else {
		log.Printf("⚠️ [GetSubmissionResult] Audio URL is NULL or empty")
	}

	if transcriptText.Valid && transcriptText.String != "" {
		submission.TranscriptText = &transcriptText.String
	}

	// Get exercise
	var exercise models.Exercise
	err = r.db.QueryRow(`
		SELECT id, title, slug, description, exercise_type, skill_type, difficulty,
			ielts_level, total_questions, total_sections, time_limit_minutes,
			thumbnail_url, audio_url, audio_duration_seconds, audio_transcript,
			passage_count, course_id, module_id, passing_score, total_points,
			is_free, is_published, total_attempts, average_score,
			average_completion_time, display_order, created_by, published_at,
			created_at, updated_at
		FROM exercises WHERE id = $1
	`, submission.ExerciseID).Scan(
		&exercise.ID, &exercise.Title, &exercise.Slug, &exercise.Description,
		&exercise.ExerciseType, &exercise.SkillType, &exercise.Difficulty,
		&exercise.IELTSLevel, &exercise.TotalQuestions, &exercise.TotalSections,
		&exercise.TimeLimitMinutes, &exercise.ThumbnailURL, &exercise.AudioURL,
		&exercise.AudioDurationSeconds, &exercise.AudioTranscript, &exercise.PassageCount,
		&exercise.CourseID, &exercise.ModuleID, &exercise.PassingScore,
		&exercise.TotalPoints, &exercise.IsFree, &exercise.IsPublished,
		&exercise.TotalAttempts, &exercise.AverageScore, &exercise.AverageCompletionTime,
		&exercise.DisplayOrder, &exercise.CreatedBy, &exercise.PublishedAt,
		&exercise.CreatedAt, &exercise.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Get answers with questions (from user_answers table)
	rows, err := r.db.Query(`
		SELECT ua.id, ua.attempt_id, ua.question_id, ua.user_id, ua.answer_text,
			ua.selected_option_id, ua.is_correct, ua.points_earned, ua.time_spent_seconds,
			ua.answered_at,
			q.id, q.exercise_id, q.section_id, q.question_number, q.question_text,
			q.question_type, q.audio_url, q.image_url, q.context_text, q.points,
			q.difficulty, q.explanation, q.tips, q.display_order, q.created_at, q.updated_at
		FROM user_answers ua
		JOIN questions q ON q.id = ua.question_id
		WHERE ua.attempt_id = $1
		ORDER BY q.display_order, q.question_number
	`, submissionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	answers := []models.SubmissionAnswerWithQuestion{}
	for rows.Next() {
		var submissionAnswer models.SubmissionAnswer
		var question models.Question
		err := rows.Scan(
			&submissionAnswer.ID, &submissionAnswer.AttemptID, &submissionAnswer.QuestionID,
			&submissionAnswer.UserID, &submissionAnswer.AnswerText, &submissionAnswer.SelectedOptionID,
			&submissionAnswer.IsCorrect, &submissionAnswer.PointsEarned, &submissionAnswer.TimeSpentSeconds,
			&submissionAnswer.AnsweredAt,
			&question.ID, &question.ExerciseID, &question.SectionID, &question.QuestionNumber,
			&question.QuestionText, &question.QuestionType, &question.AudioURL, &question.ImageURL,
			&question.ContextText, &question.Points, &question.Difficulty, &question.Explanation,
			&question.Tips, &question.DisplayOrder, &question.CreatedAt, &question.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Get correct answer
		var correctAnswer interface{}
		if question.QuestionType == "multiple_choice" {
			var correctLabel string
			var correctText string
			err := r.db.QueryRow(`
				SELECT option_label, option_text FROM question_options 
				WHERE question_id = $1 AND is_correct = true
			`, question.ID).Scan(&correctLabel, &correctText)
			if err == nil {
				// Format as "Option A: text" for better display
				correctAnswer = fmt.Sprintf("Option %s: %s", correctLabel, correctText)
			}
		} else {
			var correctText string
			err := r.db.QueryRow(`
				SELECT answer_text FROM question_answers 
				WHERE question_id = $1
			`, question.ID).Scan(&correctText)
			if err == nil {
				correctAnswer = correctText
			}
		}

		// Get selected option text if user selected an option
		if submissionAnswer.SelectedOptionID != nil && question.QuestionType == "multiple_choice" {
			var selectedLabel string
			var selectedText string
			err := r.db.QueryRow(`
				SELECT option_label, option_text FROM question_options 
				WHERE id = $1
			`, submissionAnswer.SelectedOptionID).Scan(&selectedLabel, &selectedText)
			if err == nil {
				// Update answer_text with formatted option text
				if submissionAnswer.AnswerText == nil || *submissionAnswer.AnswerText == "" {
					formattedText := fmt.Sprintf("Option %s: %s", selectedLabel, selectedText)
					submissionAnswer.AnswerText = &formattedText
				}
			}
		}

		answers = append(answers, models.SubmissionAnswerWithQuestion{
			Answer:        &submissionAnswer,
			Question:      &question,
			CorrectAnswer: correctAnswer,
		})
	}

	// Calculate performance stats
	correctCount := submission.CorrectAnswers
	incorrectCount := submission.QuestionsAnswered - submission.CorrectAnswers
	skippedCount := submission.TotalQuestions - submission.QuestionsAnswered

	accuracy := 0.0
	if submission.TotalQuestions > 0 {
		accuracy = float64(correctCount) / float64(submission.TotalQuestions) * 100
	}

	avgTimePerQuestion := 0
	if submission.TotalQuestions > 0 {
		avgTimePerQuestion = submission.TimeSpentSeconds / submission.TotalQuestions
	}

	score := 0.0
	if submission.Score != nil {
		score = *submission.Score
	}

	// Score is already percentage (0-100), no need to recalculate
	percentage := score

	// Check if passed (using percentage or band_score depending on passing_score type)
	isPassed := false
	if exercise.PassingScore != nil && *exercise.PassingScore > 0 {
		// If passing_score is < 10, it's likely a band score threshold
		// Otherwise, it's a percentage threshold
		if *exercise.PassingScore < 10 {
			// Use band_score for comparison
			if submission.BandScore != nil {
				isPassed = *submission.BandScore >= *exercise.PassingScore
			}
		} else {
			// Use percentage for comparison
			isPassed = percentage >= *exercise.PassingScore
		}
	}

	stats := &models.PerformanceStats{
		TotalQuestions:   submission.TotalQuestions,
		CorrectAnswers:   correctCount,
		IncorrectAnswers: incorrectCount,
		SkippedAnswers:   skippedCount,
		Accuracy:         accuracy,
		Score:            score,
		Percentage:       percentage,
		BandScore:        submission.BandScore,
		IsPassed:         isPassed,
		TimeSpentSeconds: submission.TimeSpentSeconds,
		AverageTimePerQ:  float64(avgTimePerQuestion),
	}

	return &models.SubmissionResultResponse{
		Submission:  &submission,
		Exercise:    &exercise,
		Answers:     answers,
		Performance: stats,
	}, nil
}

// GetUserSubmissions returns user's submission history with filters (uses user_exercise_attempts)
func (r *ExerciseRepository) GetUserSubmissions(userID uuid.UUID, query *models.MySubmissionsQuery) (*models.MySubmissionsResponse, error) {
	where := []string{"a.user_id = $1", "e.is_published = true"}
	args := []interface{}{userID}
	argCount := 1

	// Filter by skill_type
	if query.SkillType != "" {
		skillTypes := strings.Split(strings.TrimSpace(query.SkillType), ",")
		if len(skillTypes) == 1 {
			argCount++
			where = append(where, fmt.Sprintf("e.skill_type = $%d", argCount))
			args = append(args, strings.TrimSpace(skillTypes[0]))
		} else {
			placeholders := []string{}
			for _, skillType := range skillTypes {
				argCount++
				placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
				args = append(args, strings.TrimSpace(skillType))
			}
			where = append(where, fmt.Sprintf("e.skill_type IN (%s)", strings.Join(placeholders, ", ")))
		}
	}

	// Filter by status
	if query.Status != "" {
		statuses := strings.Split(strings.TrimSpace(query.Status), ",")
		if len(statuses) == 1 {
			argCount++
			where = append(where, fmt.Sprintf("a.status = $%d", argCount))
			args = append(args, strings.TrimSpace(statuses[0]))
		} else {
			placeholders := []string{}
			for _, status := range statuses {
				argCount++
				placeholders = append(placeholders, fmt.Sprintf("$%d", argCount))
				args = append(args, strings.TrimSpace(status))
			}
			where = append(where, fmt.Sprintf("a.status IN (%s)", strings.Join(placeholders, ", ")))
		}
	}

	// Filter by date range
	if query.DateFrom != "" {
		argCount++
		where = append(where, fmt.Sprintf("DATE(a.created_at) >= $%d", argCount))
		args = append(args, query.DateFrom)
	}
	if query.DateTo != "" {
		argCount++
		where = append(where, fmt.Sprintf("DATE(a.created_at) <= $%d", argCount))
		args = append(args, query.DateTo)
	}

	// Filter by search (exercise title)
	if query.Search != "" {
		argCount++
		where = append(where, fmt.Sprintf("LOWER(e.title) LIKE LOWER($%d)", argCount))
		args = append(args, "%"+query.Search+"%")
	}

	whereClause := strings.Join(where, " AND ")

	// Get total count
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) 
		FROM user_exercise_attempts a
		JOIN exercises e ON e.id = a.exercise_id
		WHERE %s
	`, whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, err
	}

	// Build ORDER BY clause
	orderBy := "a.created_at DESC" // Default
	if query.SortBy != "" {
		sortOrder := "DESC"
		if query.SortOrder == "asc" {
			sortOrder = "ASC"
		}

		switch query.SortBy {
		case "score":
			orderBy = fmt.Sprintf("a.score %s NULLS LAST, a.created_at DESC", sortOrder)
		case "band_score":
			orderBy = fmt.Sprintf("a.band_score %s NULLS LAST, a.created_at DESC", sortOrder)
		case "date":
			fallthrough
		default:
			orderBy = fmt.Sprintf("a.created_at %s", sortOrder)
		}
	}

	// Pagination
	offset := (query.Page - 1) * query.Limit
	argCount++
	limitArg := argCount
	argCount++
	offsetArg := argCount

	// Get attempts with exercise info
	selectQuery := fmt.Sprintf(`
		SELECT a.id, a.user_id, a.exercise_id, a.attempt_number, a.status,
			a.total_questions, a.questions_answered, a.correct_answers, a.score, a.band_score,
			a.time_limit_minutes, a.time_spent_seconds, a.started_at, a.completed_at,
			a.device_type, a.created_at, a.updated_at,
			e.id, e.title, e.slug, e.description, e.exercise_type, e.skill_type, e.difficulty,
			e.ielts_level, e.total_questions, e.total_sections, e.time_limit_minutes,
			e.thumbnail_url, e.audio_url, e.audio_duration_seconds, e.audio_transcript,
			e.passage_count, e.course_id, e.module_id, e.passing_score, e.total_points,
			e.is_free, e.is_published, e.total_attempts, e.average_score,
			e.average_completion_time, e.display_order, e.created_by, e.published_at,
			e.created_at, e.updated_at
		FROM user_exercise_attempts a
		JOIN exercises e ON e.id = a.exercise_id
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, limitArg, offsetArg)

	args = append(args, query.Limit, offset)

	rows, err := r.db.Query(selectQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	submissions := []models.UserExerciseAttemptWithExercise{}
	for rows.Next() {
		var submission models.UserExerciseAttempt
		var exercise models.Exercise
		err := rows.Scan(
			&submission.ID, &submission.UserID, &submission.ExerciseID, &submission.AttemptNumber,
			&submission.Status, &submission.TotalQuestions, &submission.QuestionsAnswered,
			&submission.CorrectAnswers, &submission.Score, &submission.BandScore,
			&submission.TimeLimitMinutes, &submission.TimeSpentSeconds, &submission.StartedAt,
			&submission.CompletedAt, &submission.DeviceType, &submission.CreatedAt, &submission.UpdatedAt,
			&exercise.ID, &exercise.Title, &exercise.Slug, &exercise.Description,
			&exercise.ExerciseType, &exercise.SkillType, &exercise.Difficulty,
			&exercise.IELTSLevel, &exercise.TotalQuestions, &exercise.TotalSections,
			&exercise.TimeLimitMinutes, &exercise.ThumbnailURL, &exercise.AudioURL,
			&exercise.AudioDurationSeconds, &exercise.AudioTranscript, &exercise.PassageCount,
			&exercise.CourseID, &exercise.ModuleID, &exercise.PassingScore,
			&exercise.TotalPoints, &exercise.IsFree, &exercise.IsPublished,
			&exercise.TotalAttempts, &exercise.AverageScore, &exercise.AverageCompletionTime,
			&exercise.DisplayOrder, &exercise.CreatedBy, &exercise.PublishedAt,
			&exercise.CreatedAt, &exercise.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		submissions = append(submissions, models.UserExerciseAttemptWithExercise{
			Submission: &submission,
			Exercise:   &exercise,
		})
	}

	return &models.MySubmissionsResponse{
		Submissions: submissions,
		Total:       total,
	}, nil
}

// CreateExercise creates a new exercise (admin only)
func (r *ExerciseRepository) CreateExercise(req *models.CreateExerciseRequest, createdBy uuid.UUID) (*models.Exercise, error) {
	isFree := false
	if req.IsFree != nil {
		isFree = *req.IsFree
	}

	exercise := &models.Exercise{
		ID:                   uuid.New(),
		Title:                req.Title,
		Slug:                 req.Slug,
		Description:          req.Description,
		ExerciseType:         req.ExerciseType,
		SkillType:            req.SkillType,
		Difficulty:           req.Difficulty,
		IELTSLevel:           req.IELTSLevel,
		TotalQuestions:       0, // Will be calculated
		TotalSections:        0, // Will be calculated
		TimeLimitMinutes:     req.TimeLimitMinutes,
		ThumbnailURL:         req.ThumbnailURL,
		AudioURL:             req.AudioURL,
		AudioDurationSeconds: req.AudioDurationSeconds,
		PassageCount:         req.PassageCount,
		CourseID:             req.CourseID,
		ModuleID:             req.ModuleID,
		PassingScore:         req.PassingScore,
		IsFree:               isFree,
		IsPublished:          false, // Default unpublished
		DisplayOrder:         0,
		CreatedBy:            createdBy,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	// Set default values for speaking exercises to satisfy constraints
	if req.SkillType == "speaking" {
		// Use provided values or set defaults
		if req.SpeakingPartNumber != nil {
			exercise.SpeakingPartNumber = req.SpeakingPartNumber
		} else {
			defaultPartNumber := 1
			exercise.SpeakingPartNumber = &defaultPartNumber
		}

		if req.SpeakingPromptText != nil {
			exercise.SpeakingPromptText = req.SpeakingPromptText
		} else {
			defaultPrompt := ""
			exercise.SpeakingPromptText = &defaultPrompt
		}

		// Optional fields
		exercise.SpeakingCueCardTopic = req.SpeakingCueCardTopic
		exercise.SpeakingCueCardPoints = req.SpeakingCueCardPoints
		exercise.SpeakingPreparationTime = req.SpeakingPreparationTimeSeconds
		exercise.SpeakingResponseTime = req.SpeakingResponseTimeSeconds
		exercise.SpeakingFollowUpQuestions = req.SpeakingFollowUpQuestions
	}

	// Set default values for writing exercises to satisfy constraints
	if req.SkillType == "writing" {
		// Convert task type from int to string and use provided values or set defaults
		var writingTaskTypeStr string
		if req.WritingTaskType != nil {
			if *req.WritingTaskType == 1 {
				writingTaskTypeStr = "task1"
			} else {
				writingTaskTypeStr = "task2"
			}
		} else {
			writingTaskTypeStr = "task2" // Default to Task 2
		}
		exercise.WritingTaskType = &writingTaskTypeStr

		if req.WritingPromptText != nil && *req.WritingPromptText != "" {
			exercise.WritingPromptText = req.WritingPromptText
		} else {
			defaultPrompt := ""
			exercise.WritingPromptText = &defaultPrompt
		}

		// Optional fields
		exercise.WritingVisualURL = req.WritingVisualURL
		exercise.WritingVisualType = req.WritingVisualType
		exercise.WritingWordRequirement = req.WritingWordRequirement
	}

	// Set IELTS test type for reading exercises
	if req.SkillType == "reading" {
		if req.IELTSTestType != nil {
			exercise.IELTSTestType = req.IELTSTestType
		} else {
			defaultTestType := "academic"
			exercise.IELTSTestType = &defaultTestType
		}
	}

	_, err := r.db.Exec(`
		INSERT INTO exercises (
			id, title, slug, description, exercise_type, skill_type, difficulty,
			ielts_level, total_questions, total_sections, time_limit_minutes,
			thumbnail_url, audio_url, audio_duration_seconds, audio_transcript,
			passage_count, course_id, module_id, passing_score, total_points,
			is_free, is_published, display_order, created_by, created_at, updated_at,
			speaking_part_number, speaking_prompt_text, speaking_cue_card_topic,
			speaking_cue_card_points, speaking_preparation_time_seconds,
			speaking_response_time_seconds, speaking_follow_up_questions,
			writing_task_type, writing_prompt_text, writing_visual_url,
			writing_visual_type, writing_word_requirement, ielts_test_type
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39)
	`, exercise.ID, exercise.Title, exercise.Slug, exercise.Description,
		exercise.ExerciseType, exercise.SkillType, exercise.Difficulty,
		exercise.IELTSLevel, exercise.TotalQuestions, exercise.TotalSections,
		exercise.TimeLimitMinutes, exercise.ThumbnailURL, exercise.AudioURL,
		exercise.AudioDurationSeconds, exercise.AudioTranscript, exercise.PassageCount,
		exercise.CourseID, exercise.ModuleID, exercise.PassingScore,
		exercise.TotalPoints, exercise.IsFree, exercise.IsPublished,
		exercise.DisplayOrder, exercise.CreatedBy, exercise.CreatedAt, exercise.UpdatedAt,
		exercise.SpeakingPartNumber, exercise.SpeakingPromptText, exercise.SpeakingCueCardTopic,
		pq.Array(exercise.SpeakingCueCardPoints), exercise.SpeakingPreparationTime,
		exercise.SpeakingResponseTime, pq.Array(exercise.SpeakingFollowUpQuestions),
		exercise.WritingTaskType, exercise.WritingPromptText, exercise.WritingVisualURL,
		exercise.WritingVisualType, exercise.WritingWordRequirement, exercise.IELTSTestType)

	if err != nil {
		return nil, err
	}

	return exercise, nil
}

// UpdateExercise updates exercise details (admin only)
func (r *ExerciseRepository) UpdateExercise(id uuid.UUID, req *models.UpdateExerciseRequest) error {
	updates := []string{"updated_at = $1"}
	args := []interface{}{time.Now()}
	argCount := 1

	if req.Title != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("title = $%d", argCount))
		args = append(args, *req.Title)
	}
	if req.Description != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("description = $%d", argCount))
		args = append(args, *req.Description)
	}
	if req.Difficulty != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("difficulty = $%d", argCount))
		args = append(args, *req.Difficulty)
	}
	if req.ExerciseType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("exercise_type = $%d", argCount))
		args = append(args, *req.ExerciseType)
	}
	if req.SkillType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("skill_type = $%d", argCount))
		args = append(args, *req.SkillType)
	}
	if req.CourseID != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("course_id = $%d", argCount))
		args = append(args, *req.CourseID)
	}
	if req.ModuleID != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("module_id = $%d", argCount))
		args = append(args, *req.ModuleID)
	}
	if req.IELTSLevel != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("ielts_level = $%d", argCount))
		args = append(args, *req.IELTSLevel)
	}
	if req.TimeLimitMinutes != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("time_limit_minutes = $%d", argCount))
		args = append(args, *req.TimeLimitMinutes)
	}
	if req.PassingScore != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("passing_score = $%d", argCount))
		args = append(args, *req.PassingScore)
	}
	if req.ThumbnailURL != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("thumbnail_url = $%d", argCount))
		args = append(args, *req.ThumbnailURL)
	}
	if req.AudioURL != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("audio_url = $%d", argCount))
		args = append(args, *req.AudioURL)
	}
	if req.IsPublished != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("is_published = $%d", argCount))
		args = append(args, *req.IsPublished)
		if *req.IsPublished {
			argCount++
			updates = append(updates, fmt.Sprintf("published_at = $%d", argCount))
			args = append(args, time.Now())
		}
	}

	// Writing fields
	if req.WritingPromptText != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("writing_prompt_text = $%d", argCount))
		args = append(args, *req.WritingPromptText)
	}
	if req.WritingTaskType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("writing_task_type = $%d", argCount))
		args = append(args, *req.WritingTaskType)
	}
	if req.WritingVisualURL != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("writing_visual_url = $%d", argCount))
		args = append(args, *req.WritingVisualURL)
	}
	if req.WritingVisualType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("writing_visual_type = $%d", argCount))
		args = append(args, *req.WritingVisualType)
	}
	if req.WritingWordRequirement != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("writing_word_requirement = $%d", argCount))
		args = append(args, *req.WritingWordRequirement)
	}

	// Speaking fields
	if req.SpeakingPromptText != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_prompt_text = $%d", argCount))
		args = append(args, *req.SpeakingPromptText)
	}
	if req.SpeakingPartNumber != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_part_number = $%d", argCount))
		args = append(args, *req.SpeakingPartNumber)
	}
	if req.SpeakingCueCardTopic != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_cue_card_topic = $%d", argCount))
		args = append(args, *req.SpeakingCueCardTopic)
	}
	if req.SpeakingCueCardPoints != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_cue_card_points = $%d", argCount))
		args = append(args, pq.Array(req.SpeakingCueCardPoints))
	}
	if req.SpeakingPreparationTimeSeconds != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_preparation_time_seconds = $%d", argCount))
		args = append(args, *req.SpeakingPreparationTimeSeconds)
	}
	if req.SpeakingResponseTimeSeconds != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_response_time_seconds = $%d", argCount))
		args = append(args, *req.SpeakingResponseTimeSeconds)
	}
	if req.SpeakingFollowUpQuestions != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("speaking_follow_up_questions = $%d", argCount))
		args = append(args, pq.Array(req.SpeakingFollowUpQuestions))
	}

	argCount++
	args = append(args, id)

	query := fmt.Sprintf("UPDATE exercises SET %s WHERE id = $%d", strings.Join(updates, ", "), argCount)
	log.Printf("[UpdateExercise] Executing query: %s", query)
	log.Printf("[UpdateExercise] With args: %+v", args)
	_, err := r.db.Exec(query, args...)
	if err != nil {
		log.Printf("[UpdateExercise] Database error: %v", err)
	}
	return err
}

// DeleteExercise soft deletes an exercise
func (r *ExerciseRepository) DeleteExercise(id uuid.UUID) error {
	_, err := r.db.Exec("UPDATE exercises SET is_published = false, deleted_at = $1, updated_at = $1 WHERE id = $2", time.Now(), id)
	return err
}

// CheckExerciseOwnership verifies if user owns the exercise
func (r *ExerciseRepository) CheckExerciseOwnership(exerciseID, userID uuid.UUID) error {
	var createdBy uuid.UUID
	err := r.db.QueryRow("SELECT created_by FROM exercises WHERE id = $1", exerciseID).Scan(&createdBy)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("exercise not found")
		}
		return err
	}
	if createdBy != userID {
		return fmt.Errorf("unauthorized: you don't own this exercise")
	}
	return nil
}

// GetExerciseIDBySectionID returns the exercise ID that the section belongs to
func (r *ExerciseRepository) GetExerciseIDBySectionID(sectionID uuid.UUID) (uuid.UUID, error) {
	var exerciseID uuid.UUID
	err := r.db.QueryRow("SELECT exercise_id FROM exercise_sections WHERE id = $1", sectionID).Scan(&exerciseID)
	if err != nil {
		if err == sql.ErrNoRows {
			return uuid.Nil, fmt.Errorf("section not found")
		}
		return uuid.Nil, err
	}
	return exerciseID, nil
}

// GetExerciseIDByQuestionID returns the exercise ID that the question belongs to
func (r *ExerciseRepository) GetExerciseIDByQuestionID(questionID uuid.UUID) (uuid.UUID, error) {
	var exerciseID uuid.UUID
	err := r.db.QueryRow(`
		SELECT s.exercise_id 
		FROM exercise_sections s 
		JOIN questions q ON q.section_id = s.id 
		WHERE q.id = $1
	`, questionID).Scan(&exerciseID)
	if err != nil {
		if err == sql.ErrNoRows {
			return uuid.Nil, fmt.Errorf("question not found")
		}
		return uuid.Nil, err
	}
	return exerciseID, nil
}

// CreateSection creates a new section for an exercise
func (r *ExerciseRepository) CreateSection(exerciseID uuid.UUID, req *models.CreateSectionRequest) (*models.ExerciseSection, error) {
	section := &models.ExerciseSection{
		ID:               uuid.New(),
		ExerciseID:       exerciseID,
		Title:            req.Title,
		Description:      req.Description,
		SectionNumber:    req.SectionNumber,
		AudioURL:         req.AudioURL,
		AudioStartTime:   req.AudioStartTime,
		AudioEndTime:     req.AudioEndTime,
		Transcript:       req.Transcript,
		PassageTitle:     req.PassageTitle,
		PassageContent:   req.PassageContent,
		PassageWordCount: req.PassageWordCount,
		Instructions:     req.Instructions,
		TotalQuestions:   0, // Will be calculated
		TimeLimitMinutes: req.TimeLimitMinutes,
		DisplayOrder:     req.DisplayOrder,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	_, err := r.db.Exec(`
		INSERT INTO exercise_sections (
			id, exercise_id, title, description, section_number, audio_url,
			audio_start_time, audio_end_time, transcript, passage_title,
			passage_content, passage_word_count, instructions, total_questions,
			time_limit_minutes, display_order, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`, section.ID, section.ExerciseID, section.Title, section.Description,
		section.SectionNumber, section.AudioURL, section.AudioStartTime,
		section.AudioEndTime, section.Transcript, section.PassageTitle,
		section.PassageContent, section.PassageWordCount, section.Instructions,
		section.TotalQuestions, section.TimeLimitMinutes, section.DisplayOrder,
		section.CreatedAt, section.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// Update exercise total_sections count
	_, err = r.db.Exec(`
		UPDATE exercises SET 
			total_sections = (SELECT COUNT(*) FROM exercise_sections WHERE exercise_id = $1),
			updated_at = $2
		WHERE id = $1
	`, exerciseID, time.Now())

	return section, err
}

// CreateQuestion creates a new question
func (r *ExerciseRepository) CreateQuestion(req *models.CreateQuestionRequest) (*models.Question, error) {
	points := 1.0
	if req.Points != nil {
		points = *req.Points
	}

	question := &models.Question{
		ID:             uuid.New(),
		ExerciseID:     req.ExerciseID,
		SectionID:      req.SectionID,
		QuestionNumber: req.QuestionNumber,
		QuestionText:   req.QuestionText,
		QuestionType:   req.QuestionType,
		AudioURL:       req.AudioURL,
		ImageURL:       req.ImageURL,
		ContextText:    req.ContextText,
		Points:         points,
		Difficulty:     req.Difficulty,
		Explanation:    req.Explanation,
		Tips:           req.Tips,
		DisplayOrder:   req.DisplayOrder,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, err := r.db.Exec(`
		INSERT INTO questions (
			id, exercise_id, section_id, question_number, question_text, question_type,
			audio_url, image_url, context_text, points, difficulty, explanation,
			tips, display_order, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
	`, question.ID, question.ExerciseID, question.SectionID, question.QuestionNumber,
		question.QuestionText, question.QuestionType, question.AudioURL, question.ImageURL,
		question.ContextText, question.Points, question.Difficulty, question.Explanation,
		question.Tips, question.DisplayOrder, question.CreatedAt, question.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// Update section and exercise total_questions count
	if req.SectionID != nil {
		_, err = r.db.Exec(`
			UPDATE exercise_sections SET 
				total_questions = (SELECT COUNT(*) FROM questions WHERE section_id = $1),
				updated_at = $2
			WHERE id = $1
		`, *req.SectionID, time.Now())
	}

	_, err = r.db.Exec(`
		UPDATE exercises SET 
			total_questions = (SELECT COUNT(*) FROM questions WHERE exercise_id = $1),
			total_points = (SELECT COALESCE(SUM(points), 0) FROM questions WHERE exercise_id = $1),
			updated_at = $2
		WHERE id = $1
	`, req.ExerciseID, time.Now())

	return question, err
}

// CreateQuestionOption creates an option for multiple choice question
func (r *ExerciseRepository) CreateQuestionOption(questionID uuid.UUID, req *models.CreateQuestionOptionRequest) (*models.QuestionOption, error) {
	option := &models.QuestionOption{
		ID:             uuid.New(),
		QuestionID:     questionID,
		OptionLabel:    req.OptionLabel,
		OptionText:     req.OptionText,
		OptionImageURL: req.OptionImageURL,
		IsCorrect:      req.IsCorrect,
		DisplayOrder:   req.DisplayOrder,
		CreatedAt:      time.Now(),
	}

	_, err := r.db.Exec(`
		INSERT INTO question_options (
			id, question_id, option_label, option_text, option_image_url,
			is_correct, display_order, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, option.ID, option.QuestionID, option.OptionLabel, option.OptionText,
		option.OptionImageURL, option.IsCorrect, option.DisplayOrder, option.CreatedAt)

	return option, err
}

// CreateQuestionAnswer creates answer for text-based question
func (r *ExerciseRepository) CreateQuestionAnswer(questionID uuid.UUID, req *models.CreateQuestionAnswerRequest) (*models.QuestionAnswer, error) {
	answer := &models.QuestionAnswer{
		ID:         uuid.New(),
		QuestionID: questionID,
		AnswerText: req.AnswerText,
		CreatedAt:  time.Now(),
	}

	// Convert alternative answers to JSON string for model
	if req.AlternativeAnswers != nil && len(req.AlternativeAnswers) > 0 {
		jsonBytes, _ := json.Marshal(req.AlternativeAnswers)
		jsonStr := string(jsonBytes)
		answer.AlternativeAnswers = &jsonStr
	}

	// Store in database using pq.Array for answer_variations
	var answerVariations interface{}
	if req.AlternativeAnswers != nil && len(req.AlternativeAnswers) > 0 {
		answerVariations = pq.Array(req.AlternativeAnswers)
	}

	_, err := r.db.Exec(`
		INSERT INTO question_answers (
			id, question_id, answer_text, answer_variations,
			is_primary_answer, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`, answer.ID, answer.QuestionID, answer.AnswerText, answerVariations,
		true, answer.CreatedAt)

	return answer, err
}

// UpdateQuestion updates question details
func (r *ExerciseRepository) UpdateQuestion(questionID uuid.UUID, req *models.UpdateQuestionRequest) error {
	updates := []string{}
	args := []interface{}{}
	argCount := 0

	if req.QuestionText != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("question_text = $%d", argCount))
		args = append(args, *req.QuestionText)
	}

	if req.QuestionType != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("question_type = $%d", argCount))
		args = append(args, *req.QuestionType)
	}

	if req.Points != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("points = $%d", argCount))
		args = append(args, *req.Points)
	}

	if req.Difficulty != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("difficulty = $%d", argCount))
		args = append(args, *req.Difficulty)
	}

	if req.Explanation != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("explanation = $%d", argCount))
		args = append(args, *req.Explanation)
	}

	if req.Tips != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("tips = $%d", argCount))
		args = append(args, *req.Tips)
	}

	if len(updates) == 0 {
		return nil // Nothing to update
	}

	argCount++
	updates = append(updates, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())

	argCount++
	args = append(args, questionID)

	query := fmt.Sprintf(`
		UPDATE questions 
		SET %s 
		WHERE id = $%d
	`, strings.Join(updates, ", "), argCount)

	_, err := r.db.Exec(query, args...)
	return err
}

// DeleteQuestion deletes a question and all related data
func (r *ExerciseRepository) DeleteQuestion(questionID uuid.UUID) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get the question number and section before deleting
	var questionNumber int
	var sectionID uuid.UUID
	err = tx.QueryRow("SELECT question_number, section_id FROM questions WHERE id = $1", questionID).Scan(&questionNumber, &sectionID)
	if err != nil {
		return err
	}

	// Delete question options
	_, err = tx.Exec("DELETE FROM question_options WHERE question_id = $1", questionID)
	if err != nil {
		return err
	}

	// Delete question answers
	_, err = tx.Exec("DELETE FROM question_answers WHERE question_id = $1", questionID)
	if err != nil {
		return err
	}

	// Delete the question
	_, err = tx.Exec("DELETE FROM questions WHERE id = $1", questionID)
	if err != nil {
		return err
	}

	// Renumber subsequent questions in the same section
	_, err = tx.Exec(`
		UPDATE questions 
		SET question_number = question_number - 1 
		WHERE section_id = $1 AND question_number > $2
	`, sectionID, questionNumber)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// DeleteQuestionOption deletes a specific question option
func (r *ExerciseRepository) DeleteQuestionOption(questionID, optionID uuid.UUID) error {
	_, err := r.db.Exec(`
		DELETE FROM question_options 
		WHERE id = $1 AND question_id = $2
	`, optionID, questionID)
	return err
}

// UpdateQuestionAnswer updates answer details
func (r *ExerciseRepository) UpdateQuestionAnswer(questionID, answerID uuid.UUID, req *models.UpdateQuestionAnswerRequest) error {
	updates := []string{}
	args := []interface{}{}
	argCount := 0

	if req.AnswerText != nil {
		argCount++
		updates = append(updates, fmt.Sprintf("answer_text = $%d", argCount))
		args = append(args, *req.AnswerText)
	}

	if req.AlternativeAnswers != nil {
		argCount++
		// Store as pq.Array for answer_variations column
		updates = append(updates, fmt.Sprintf("answer_variations = $%d", argCount))
		args = append(args, pq.Array(*req.AlternativeAnswers))
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	argCount++
	args = append(args, answerID)
	argCount++
	args = append(args, questionID)

	query := fmt.Sprintf(`
		UPDATE question_answers
		SET %s
		WHERE id = $%d AND question_id = $%d
	`, strings.Join(updates, ", "), argCount-1, argCount)

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update answer: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("answer not found")
	}

	return nil
}

// DeleteQuestionAnswer deletes a question answer
func (r *ExerciseRepository) DeleteQuestionAnswer(questionID, answerID uuid.UUID) error {
	result, err := r.db.Exec(`
		DELETE FROM question_answers
		WHERE id = $1 AND question_id = $2
	`, answerID, questionID)

	if err != nil {
		return fmt.Errorf("failed to delete answer: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("answer not found")
	}

	return nil
}

// PublishExercise publishes an exercise (sets is_published to true)
func (r *ExerciseRepository) PublishExercise(id uuid.UUID) error {
	now := time.Now()
	_, err := r.db.Exec(`
		UPDATE exercises 
		SET is_published = true, published_at = $1, updated_at = $1 
		WHERE id = $2
	`, now, id)
	return err
}

// UnpublishExercise unpublishes an exercise (sets is_published to false)
func (r *ExerciseRepository) UnpublishExercise(id uuid.UUID) error {
	_, err := r.db.Exec(`
		UPDATE exercises 
		SET is_published = false, updated_at = $1 
		WHERE id = $2
	`, time.Now(), id)
	return err
}

// GetAllTags returns all available exercise tags
func (r *ExerciseRepository) GetAllTags() ([]models.ExerciseTag, error) {
	rows, err := r.db.Query(`
		SELECT id, name, slug, created_at 
		FROM exercise_tags 
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.ExerciseTag
	for rows.Next() {
		var tag models.ExerciseTag
		if err := rows.Scan(&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

// GetExerciseTags returns tags for a specific exercise
func (r *ExerciseRepository) GetExerciseTags(exerciseID uuid.UUID) ([]models.ExerciseTag, error) {
	rows, err := r.db.Query(`
		SELECT t.id, t.name, t.slug, t.created_at
		FROM exercise_tags t
		JOIN exercise_tag_mapping m ON t.id = m.tag_id
		WHERE m.exercise_id = $1
		ORDER BY t.name
	`, exerciseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []models.ExerciseTag
	for rows.Next() {
		var tag models.ExerciseTag
		if err := rows.Scan(&tag.ID, &tag.Name, &tag.Slug, &tag.CreatedAt); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}

// AddTagToExercise adds a tag to an exercise
func (r *ExerciseRepository) AddTagToExercise(exerciseID uuid.UUID, tagID int) error {
	_, err := r.db.Exec(`
		INSERT INTO exercise_tag_mapping (exercise_id, tag_id)
		VALUES ($1, $2)
		ON CONFLICT (exercise_id, tag_id) DO NOTHING
	`, exerciseID, tagID)
	return err
}

// RemoveTagFromExercise removes a tag from an exercise
func (r *ExerciseRepository) RemoveTagFromExercise(exerciseID uuid.UUID, tagID int) error {
	_, err := r.db.Exec(`
		DELETE FROM exercise_tag_mapping 
		WHERE exercise_id = $1 AND tag_id = $2
	`, exerciseID, tagID)
	return err
}

// CreateTag creates a new tag
func (r *ExerciseRepository) CreateTag(name, slug string) (*models.ExerciseTag, error) {
	tag := &models.ExerciseTag{
		Name:      name,
		Slug:      slug,
		CreatedAt: time.Now(),
	}
	err := r.db.QueryRow(`
		INSERT INTO exercise_tags (name, slug, created_at)
		VALUES ($1, $2, $3)
		RETURNING id
	`, tag.Name, tag.Slug, tag.CreatedAt).Scan(&tag.ID)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

// GetBankQuestions returns all questions from question bank with filters
func (r *ExerciseRepository) GetBankQuestions(skillType, questionType string, limit, offset int) ([]models.QuestionBank, int, error) {
	where := []string{}
	args := []interface{}{}
	argCount := 0

	if skillType != "" {
		argCount++
		where = append(where, fmt.Sprintf("skill_type = $%d", argCount))
		args = append(args, skillType)
	}

	if questionType != "" {
		argCount++
		where = append(where, fmt.Sprintf("question_type = $%d", argCount))
		args = append(args, questionType)
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	// Get total count
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM question_bank %s", whereClause)
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Get questions
	selectQuery := fmt.Sprintf(`
		SELECT id, title, skill_type, question_type, difficulty, topic,
			question_text, context_text, audio_url, image_url, answer_data,
			tags, times_used, created_by, is_verified, is_published,
			created_at, updated_at
		FROM question_bank %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount+1, argCount+2)

	args = append(args, limit, offset)
	rows, err := r.db.Query(selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var questions []models.QuestionBank
	for rows.Next() {
		var q models.QuestionBank
		var answerDataJSON []byte
		var tagsArray pq.StringArray
		err := rows.Scan(
			&q.ID, &q.Title, &q.SkillType, &q.QuestionType, &q.Difficulty,
			&q.Topic, &q.QuestionText, &q.ContextText, &q.AudioURL, &q.ImageURL,
			&answerDataJSON, &tagsArray, &q.TimesUsed, &q.CreatedBy,
			&q.IsVerified, &q.IsPublished, &q.CreatedAt, &q.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		q.AnswerData = string(answerDataJSON)
		q.Tags = []string(tagsArray)
		questions = append(questions, q)
	}

	return questions, total, nil
}

// CreateBankQuestion creates a new question in the question bank
func (r *ExerciseRepository) CreateBankQuestion(req *models.CreateBankQuestionRequest, userID uuid.UUID) (*models.QuestionBank, error) {
	answerDataJSON, err := json.Marshal(req.AnswerData)
	if err != nil {
		return nil, err
	}

	question := &models.QuestionBank{
		ID:           uuid.New(),
		Title:        req.Title,
		QuestionText: req.QuestionText,
		QuestionType: req.QuestionType,
		SkillType:    req.SkillType,
		Difficulty:   req.Difficulty,
		Topic:        req.Topic,
		ContextText:  req.ContextText,
		AudioURL:     req.AudioURL,
		ImageURL:     req.ImageURL,
		AnswerData:   string(answerDataJSON),
		Tags:         req.Tags,
		TimesUsed:    0,
		CreatedBy:    userID,
		IsVerified:   false,
		IsPublished:  true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	_, err = r.db.Exec(`
		INSERT INTO question_bank (
			id, title, skill_type, question_type, difficulty, topic,
			question_text, context_text, audio_url, image_url, answer_data,
			tags, times_used, created_by, is_verified, is_published,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`, question.ID, question.Title, question.SkillType, question.QuestionType,
		question.Difficulty, question.Topic, question.QuestionText, question.ContextText,
		question.AudioURL, question.ImageURL, answerDataJSON, pq.Array(question.Tags),
		question.TimesUsed, question.CreatedBy, question.IsVerified, question.IsPublished,
		question.CreatedAt, question.UpdatedAt)

	if err != nil {
		return nil, err
	}
	return question, nil
}

// UpdateBankQuestion updates a question in the question bank
func (r *ExerciseRepository) UpdateBankQuestion(id uuid.UUID, req *models.UpdateBankQuestionRequest) error {
	answerDataJSON, err := json.Marshal(req.AnswerData)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(`
		UPDATE question_bank
		SET title = $1, skill_type = $2, question_text = $3, question_type = $4, 
			difficulty = $5, topic = $6, context_text = $7, audio_url = $8, 
			image_url = $9, answer_data = $10, tags = $11, updated_at = $12
		WHERE id = $13
	`, req.Title, req.SkillType, req.QuestionText, req.QuestionType,
		req.Difficulty, req.Topic, req.ContextText, req.AudioURL,
		req.ImageURL, answerDataJSON, pq.Array(req.Tags), time.Now(), id)

	return err
}

// DeleteBankQuestion deletes a question from the question bank
func (r *ExerciseRepository) DeleteBankQuestion(id uuid.UUID) error {
	_, err := r.db.Exec("DELETE FROM question_bank WHERE id = $1", id)
	return err
}

// GetExerciseAnalytics returns analytics for a specific exercise
func (r *ExerciseRepository) GetExerciseAnalytics(exerciseID uuid.UUID) (*models.ExerciseAnalytics, error) {
	var analytics models.ExerciseAnalytics
	var questionStatsJSON []byte

	err := r.db.QueryRow(`
		SELECT exercise_id, total_attempts, completed_attempts, abandoned_attempts,
			average_score, median_score, highest_score, lowest_score,
			average_completion_time, median_completion_time, actual_difficulty,
			question_statistics, updated_at
		FROM exercise_analytics
		WHERE exercise_id = $1
	`, exerciseID).Scan(
		&analytics.ExerciseID, &analytics.TotalAttempts, &analytics.CompletedAttempts,
		&analytics.AbandonedAttempts, &analytics.AverageScore, &analytics.MedianScore,
		&analytics.HighestScore, &analytics.LowestScore, &analytics.AverageCompletionTime,
		&analytics.MedianCompletionTime, &analytics.ActualDifficulty,
		&questionStatsJSON, &analytics.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Return empty analytics if not exists
			return &models.ExerciseAnalytics{
				ExerciseID: exerciseID,
			}, nil
		}
		return nil, err
	}

	if len(questionStatsJSON) > 0 {
		var jsonStr string
		jsonStr = string(questionStatsJSON)
		analytics.QuestionStatistics = &jsonStr
	}

	return &analytics, nil
}

// GetSubmissionByID retrieves a submission by ID
func (r *ExerciseRepository) GetSubmissionByID(submissionID uuid.UUID) (*models.UserExerciseAttempt, error) {
	query := `
		SELECT id, user_id, exercise_id, attempt_number, status, total_questions, questions_answered,
			correct_answers, score, band_score, time_limit_minutes, time_spent_seconds,
			started_at, completed_at, device_type,
			essay_text, word_count, task_type, prompt_text,
			audio_url, audio_duration_seconds, transcript_text, speaking_part_number,
			evaluation_status, ai_evaluation_id, detailed_scores, ai_feedback,
			official_test_result_id, practice_activity_id,
			created_at, updated_at
		FROM user_exercise_attempts
		WHERE id = $1
	`

	var s models.UserExerciseAttempt
	err := r.db.QueryRow(query, submissionID).Scan(
		&s.ID, &s.UserID, &s.ExerciseID, &s.AttemptNumber, &s.Status, &s.TotalQuestions, &s.QuestionsAnswered,
		&s.CorrectAnswers, &s.Score, &s.BandScore, &s.TimeLimitMinutes, &s.TimeSpentSeconds,
		&s.StartedAt, &s.CompletedAt, &s.DeviceType,
		&s.EssayText, &s.WordCount, &s.TaskType, &s.PromptText,
		&s.AudioURL, &s.AudioDurationSeconds, &s.TranscriptText, &s.SpeakingPartNumber,
		&s.EvaluationStatus, &s.AIEvaluationID, &s.DetailedScores, &s.AIFeedback,
		&s.OfficialTestResultID, &s.PracticeActivityID,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &s, nil
}

// GetExerciseByIDSimple retrieves basic exercise info by ID
func (r *ExerciseRepository) GetExerciseByIDSimple(exerciseID uuid.UUID) (*models.Exercise, error) {
	query := `
		SELECT id, title, slug, description, exercise_type, skill_type, ielts_test_type,
			difficulty, ielts_level, total_questions, total_sections, time_limit_minutes,
			thumbnail_url, audio_url, audio_duration_seconds, audio_transcript, passage_count,
			course_id, module_id, passing_score, total_points, is_free, is_published,
			total_attempts, average_score, average_completion_time, display_order,
			created_by, published_at, created_at, updated_at
		FROM exercises
		WHERE id = $1
	`

	var e models.Exercise
	err := r.db.QueryRow(query, exerciseID).Scan(
		&e.ID, &e.Title, &e.Slug, &e.Description, &e.ExerciseType, &e.SkillType, &e.IELTSTestType,
		&e.Difficulty, &e.IELTSLevel, &e.TotalQuestions, &e.TotalSections, &e.TimeLimitMinutes,
		&e.ThumbnailURL, &e.AudioURL, &e.AudioDurationSeconds, &e.AudioTranscript, &e.PassageCount,
		&e.CourseID, &e.ModuleID, &e.PassingScore, &e.TotalPoints, &e.IsFree, &e.IsPublished,
		&e.TotalAttempts, &e.AverageScore, &e.AverageCompletionTime, &e.DisplayOrder,
		&e.CreatedBy, &e.PublishedAt, &e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &e, nil
}

// UpdateSubmissionBandScore updates the band score of a submission
func (r *ExerciseRepository) UpdateSubmissionBandScore(submissionID uuid.UUID, bandScore float64) error {
	query := `
		UPDATE user_exercise_attempts
		SET band_score = $1, updated_at = NOW()
		WHERE id = $2
	`
	_, err := r.db.Exec(query, bandScore, submissionID)
	return err
}

// MarkUserServiceSyncSuccess marks submission as successfully synced to User Service
// FIX #9: Track successful sync to prevent data loss
func (r *ExerciseRepository) MarkUserServiceSyncSuccess(submissionID uuid.UUID) error {
	query := `
		UPDATE user_exercise_attempts
		SET user_service_sync_status = 'synced',
		    user_service_last_sync_attempt = NOW(),
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Exec(query, submissionID)
	if err != nil {
		log.Printf("⚠️ Failed to mark sync success for submission %s: %v", submissionID, err)
	}
	return err
}

// MarkUserServiceSyncFailed marks submission as failed to sync after retries
// FIX #9: Track failed syncs for background retry
func (r *ExerciseRepository) MarkUserServiceSyncFailed(submissionID uuid.UUID, errorMsg string) error {
	query := `
		UPDATE user_exercise_attempts
		SET user_service_sync_status = 'failed',
		    user_service_sync_attempts = user_service_sync_attempts + 1,
		    user_service_last_sync_attempt = NOW(),
		    user_service_sync_error = $2,
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Exec(query, submissionID, errorMsg)
	if err != nil {
		log.Printf("⚠️ Failed to mark sync failure for submission %s: %v", submissionID, err)
	}
	return err
}

// MarkUserServiceSyncNotRequired marks submission as not requiring sync (practice, incomplete, etc.)
func (r *ExerciseRepository) MarkUserServiceSyncNotRequired(submissionID uuid.UUID) error {
	query := `
		UPDATE user_exercise_attempts
		SET user_service_sync_status = 'not_required',
		    updated_at = NOW()
		WHERE id = $1
	`
	_, err := r.db.Exec(query, submissionID)
	return err
}

// GetPendingSyncs retrieves submissions that need to be synced to User Service
// FIX #8: Support background retry for failed/pending syncs
func (r *ExerciseRepository) GetPendingSyncs(limit int) ([]*models.UserExerciseAttempt, error) {
	query := `
		SELECT id, user_id, exercise_id, status, correct_answers, total_questions,
		       band_score, user_service_sync_status, user_service_sync_attempts,
		       user_service_last_sync_attempt, user_service_sync_error
		FROM user_exercise_attempts
		WHERE user_service_sync_status IN ('pending', 'failed')
		  AND status = 'completed'
		  AND user_service_sync_attempts < 5  -- Max 5 retry attempts
		ORDER BY user_service_last_sync_attempt ASC NULLS FIRST
		LIMIT $1
	`

	rows, err := r.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var submissions []*models.UserExerciseAttempt
	for rows.Next() {
		sub := &models.UserExerciseAttempt{}
		err := rows.Scan(
			&sub.ID, &sub.UserID, &sub.ExerciseID, &sub.Status, &sub.CorrectAnswers, &sub.TotalQuestions,
			&sub.BandScore, &sub.UserServiceSyncStatus, &sub.UserServiceSyncAttempts,
			&sub.UserServiceLastSyncAttempt, &sub.UserServiceSyncError,
		)
		if err != nil {
			log.Printf("⚠️ Error scanning pending sync: %v", err)
			continue
		}
		submissions = append(submissions, sub)
	}

	return submissions, nil
}

// UpdateSubmissionWritingData updates writing-specific fields
func (r *ExerciseRepository) UpdateSubmissionWritingData(submissionID uuid.UUID, essayText string, wordCount int, taskType, promptText string) error {
	query := `
		UPDATE user_exercise_attempts
		SET essay_text = $1, word_count = $2, task_type = $3, prompt_text = $4, updated_at = NOW()
		WHERE id = $5
	`
	_, err := r.db.Exec(query, essayText, wordCount, taskType, promptText, submissionID)
	return err
}

// UpdateSubmissionSpeakingData updates speaking-specific fields
func (r *ExerciseRepository) UpdateSubmissionSpeakingData(submissionID uuid.UUID, audioURL string, audioDuration, speakingPart int) error {
	query := `
		UPDATE user_exercise_attempts
		SET audio_url = $1, audio_duration_seconds = $2, speaking_part_number = $3, updated_at = NOW()
		WHERE id = $4
	`
	_, err := r.db.Exec(query, audioURL, audioDuration, speakingPart, submissionID)
	return err
}

// UpdateSubmissionEvaluationStatus updates the evaluation status
func (r *ExerciseRepository) UpdateSubmissionEvaluationStatus(submissionID uuid.UUID, status string) error {
	query := `
		UPDATE user_exercise_attempts
		SET evaluation_status = $1, updated_at = NOW()
		WHERE id = $2
	`
	_, err := r.db.Exec(query, status, submissionID)
	return err
}

// MarkSubmissionAsSubmitted marks submission as submitted with completed_at timestamp (backward compatibility)
func (r *ExerciseRepository) MarkSubmissionAsSubmitted(submissionID uuid.UUID) error {
	return r.MarkSubmissionAsSubmittedWithTime(submissionID, nil)
}

// MarkSubmissionAsSubmittedWithTime marks submission as submitted with time tracking
// This ensures completed_at and time_spent_seconds are set when user submits (for Writing/Speaking)
func (r *ExerciseRepository) MarkSubmissionAsSubmittedWithTime(submissionID uuid.UUID, frontendTimeSpent *int) error {
	// Get started_at for time calculation
	var startedAt time.Time
	var timeLimitMinutes *int
	err := r.db.QueryRow(`
		SELECT started_at, time_limit_minutes
		FROM user_exercise_attempts
		WHERE id = $1
	`, submissionID).Scan(&startedAt, &timeLimitMinutes)
	if err != nil {
		return fmt.Errorf("failed to get submission info: %w", err)
	}

	// Calculate time spent using same logic as CompleteSubmissionWithTime
	completedAt := time.Now()
	var timeSpent int

	if frontendTimeSpent != nil && *frontendTimeSpent > 0 {
		// PRIMARY: Use frontend-tracked time
		timeSpent = *frontendTimeSpent
		log.Printf("[Exercise-Repo] ✅ W/S submission - using frontend time: %d seconds", timeSpent)
	} else {
		// FALLBACK: Calculate elapsed time
		timeSpent = int(completedAt.Sub(startedAt).Seconds())
		log.Printf("[Exercise-Repo] ⚠️  W/S submission - using elapsed time: %d seconds", timeSpent)
	}

	// VALIDATION: Cap at time limit
	if timeLimitMinutes != nil && *timeLimitMinutes > 0 {
		maxSeconds := *timeLimitMinutes * 60
		if timeSpent > maxSeconds {
			log.Printf("[Exercise-Repo] ⚠️  Capping W/S time from %d to %d seconds", timeSpent, maxSeconds)
			timeSpent = maxSeconds
		}
	}

	query := `
		UPDATE user_exercise_attempts
		SET completed_at = COALESCE(completed_at, $1),
		    time_spent_seconds = $2,
		    status = CASE WHEN status = 'in_progress' THEN 'submitted' ELSE status END,
		    updated_at = $3
		WHERE id = $4
	`
	_, err = r.db.Exec(query, completedAt, timeSpent, completedAt, submissionID)
	if err != nil {
		return fmt.Errorf("failed to mark submission as submitted: %w", err)
	}

	log.Printf("[Exercise-Repo] 📊 W/S submission marked as submitted - time_spent: %d seconds", timeSpent)
	return nil
}

// UpdateSubmissionTranscript updates the transcript text
func (r *ExerciseRepository) UpdateSubmissionTranscript(submissionID uuid.UUID, transcript string) error {
	query := `
		UPDATE user_exercise_attempts
		SET transcript_text = $1, updated_at = NOW()
		WHERE id = $2
	`
	_, err := r.db.Exec(query, transcript, submissionID)
	return err
}

// UpdateSubmissionWithAIResult updates submission with AI evaluation results
func (r *ExerciseRepository) UpdateSubmissionWithAIResult(submissionID uuid.UUID, result *models.AIEvaluationResult) error {
	detailedScoresJSON, err := json.Marshal(result.DetailedScores)
	if err != nil {
		return fmt.Errorf("failed to marshal detailed_scores: %w", err)
	}
	detailedScoresStr := string(detailedScoresJSON)

	// FIX: Only set completed_at if it's not already set (to avoid violating check_attempt_sync_after_completed constraint)
	// For Writing/Speaking, completed_at should be set when user submits, not when AI evaluation completes
	query := `
		UPDATE user_exercise_attempts
		SET band_score = $1,
		    detailed_scores = $2,
		    ai_feedback = $3,
		    evaluation_status = 'completed',
		    status = 'completed',
		    completed_at = COALESCE(completed_at, NOW()),
		    updated_at = NOW()
		WHERE id = $4
	`
	_, err = r.db.Exec(query, result.OverallBandScore, detailedScoresStr, result.Feedback, submissionID)
	return err
}

// DeleteSection deletes a section and all its questions, then renumbers remaining sections
func (r *ExerciseRepository) DeleteSection(sectionID uuid.UUID) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get section number and exercise ID before deleting
	var sectionNumber int
	var exerciseID uuid.UUID
	err = tx.QueryRow("SELECT section_number, exercise_id FROM exercise_sections WHERE id = $1", sectionID).Scan(&sectionNumber, &exerciseID)
	if err != nil {
		return err
	}

	// Get all questions in this section
	rows, err := tx.Query("SELECT id FROM questions WHERE section_id = $1", sectionID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var questionIDs []uuid.UUID
	for rows.Next() {
		var qid uuid.UUID
		if err := rows.Scan(&qid); err != nil {
			return err
		}
		questionIDs = append(questionIDs, qid)
	}

	// Delete all question options and answers for questions in this section
	for _, qid := range questionIDs {
		_, err = tx.Exec("DELETE FROM question_options WHERE question_id = $1", qid)
		if err != nil {
			return err
		}
		_, err = tx.Exec("DELETE FROM question_answers WHERE question_id = $1", qid)
		if err != nil {
			return err
		}
	}

	// Delete all questions in this section
	_, err = tx.Exec("DELETE FROM questions WHERE section_id = $1", sectionID)
	if err != nil {
		return err
	}

	// Delete the section
	_, err = tx.Exec("DELETE FROM exercise_sections WHERE id = $1", sectionID)
	if err != nil {
		return err
	}

	// Renumber subsequent sections in the same exercise
	_, err = tx.Exec(`
		UPDATE exercise_sections 
		SET section_number = section_number - 1 
		WHERE exercise_id = $1 AND section_number > $2
	`, exerciseID, sectionNumber)
	if err != nil {
		return err
	}

	return tx.Commit()
}
