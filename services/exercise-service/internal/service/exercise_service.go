package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bisosad1501/DATN/shared/pkg/client"
	aiClient "github.com/bisosad1501/ielts-platform/exercise-service/internal/client"
	"github.com/bisosad1501/ielts-platform/exercise-service/internal/models"
	"github.com/bisosad1501/ielts-platform/exercise-service/internal/repository"
	"github.com/google/uuid"
)

type ExerciseService struct {
	repo                 *repository.ExerciseRepository
	userServiceClient    *client.UserServiceClient
	notificationClient   *client.NotificationServiceClient
	aiServiceClient      *aiClient.AIServiceClient      // Phase 4: AI service client
	storageServiceClient *aiClient.StorageServiceClient // For generating presigned URLs
}

func NewExerciseService(repo *repository.ExerciseRepository, userServiceClient *client.UserServiceClient, notificationClient *client.NotificationServiceClient, aiServiceClient *aiClient.AIServiceClient, storageServiceClient *aiClient.StorageServiceClient) *ExerciseService {
	return &ExerciseService{
		repo:                 repo,
		userServiceClient:    userServiceClient,
		notificationClient:   notificationClient,
		aiServiceClient:      aiServiceClient,
		storageServiceClient: storageServiceClient,
	}
}

// GetExercises returns filtered and paginated exercises
func (s *ExerciseService) GetExercises(query *models.ExerciseListQuery) ([]models.Exercise, int, error) {
	// Set defaults
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 || query.Limit > 100 {
		query.Limit = 20
	}

	return s.repo.GetExercises(query)
}

// GetExerciseByID returns exercise with all details
func (s *ExerciseService) GetExerciseByID(id uuid.UUID) (*models.ExerciseDetailResponse, error) {
	return s.repo.GetExerciseByID(id)
}

// GetExerciseByIDAdmin returns exercise with all details (including unpublished)
func (s *ExerciseService) GetExerciseByIDAdmin(id uuid.UUID) (*models.ExerciseDetailResponse, error) {
	return s.repo.GetExerciseByIDAdmin(id)
}

// StartExercise creates a new submission for user
func (s *ExerciseService) StartExercise(userID, exerciseID uuid.UUID, deviceType *string) (*models.UserExerciseAttempt, error) {
	return s.repo.CreateSubmission(userID, exerciseID, deviceType)
}

// SubmitAnswers saves answers and grades the submission
func (s *ExerciseService) SubmitAnswers(submissionID uuid.UUID, answers []models.SubmitAnswerItem, frontendTimeSpent *int) error {
	// Save and grade answers
	err := s.repo.SaveSubmissionAnswers(submissionID, answers)
	if err != nil {
		return err
	}

	// Complete submission and calculate final score (pass frontend time_spent)
	err = s.repo.CompleteSubmissionWithTime(submissionID, frontendTimeSpent)
	if err != nil {
		return err
	}

	// Service-to-service integration: Update user stats and send notification
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[Exercise-Service] PANIC in handleExerciseCompletion: %v", r)
			}
		}()
		s.handleExerciseCompletion(submissionID)
	}()

	return nil
}

// GetSubmissionResult returns detailed results
func (s *ExerciseService) GetSubmissionResult(submissionID uuid.UUID) (*models.SubmissionResultResponse, error) {
	result, err := s.repo.GetSubmissionResult(submissionID)
	if err != nil {
		return nil, err
	}

	// If submission has audio_url, convert it to API Gateway URL for frontend access
	if result.Submission != nil && result.Submission.AudioURL != nil && *result.Submission.AudioURL != "" {
		audioURL := *result.Submission.AudioURL
		log.Printf("📎 [GetSubmissionResult] Audio URL from DB: %s", audioURL)

		// Extract object name from URL
		// Format: http://minio:9000/ielts-audio/audio/user-id/file-id.ext
		// Or: http://localhost:9000/ielts-audio/audio/user-id/file-id.ext
		objectName := s.extractObjectNameFromURL(audioURL)
		if objectName != "" {
			// Convert to API Gateway URL: http://localhost:8080/api/v1/storage/audio/file/{object_name}
			// This allows frontend to access audio through API Gateway proxy
			apiGatewayURL := fmt.Sprintf("http://localhost:8080/api/v1/storage/audio/file/%s", objectName)
			result.Submission.AudioURL = &apiGatewayURL
			log.Printf("✅ [GetSubmissionResult] Converted to API Gateway URL: %s", apiGatewayURL)
		} else {
			log.Printf("⚠️ [GetSubmissionResult] Could not extract object name from URL: %s, keeping original", audioURL)
		}
	}

	return result, nil
}

// extractObjectNameFromURL extracts object name from audio URL
// Format: http://minio:9000/ielts-audio/audio/user-id/file-id.ext
// Returns: audio/user-id/file-id.ext
func (s *ExerciseService) extractObjectNameFromURL(url string) string {
	// Remove query parameters
	if idx := strings.Index(url, "?"); idx != -1 {
		url = url[:idx]
	}

	// Extract path after bucket name
	// URL format: http://host:port/bucket-name/object-name
	parts := strings.Split(url, "/")
	if len(parts) < 2 {
		return ""
	}

	// Find bucket name (ielts-audio) and get everything after it
	bucketName := "ielts-audio"
	bucketIndex := -1
	for i, part := range parts {
		if part == bucketName {
			bucketIndex = i
			break
		}
	}

	if bucketIndex == -1 || bucketIndex >= len(parts)-1 {
		return ""
	}

	// Get object name (everything after bucket name)
	objectParts := parts[bucketIndex+1:]
	return strings.Join(objectParts, "/")
}

// GetMySubmissions returns user's submission history with filters
func (s *ExerciseService) GetMySubmissions(userID uuid.UUID, query *models.MySubmissionsQuery) (*models.MySubmissionsResponse, error) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 || query.Limit > 100 {
		query.Limit = 20
	}

	return s.repo.GetUserSubmissions(userID, query)
}

// CreateExercise creates new exercise (admin only)
func (s *ExerciseService) CreateExercise(req *models.CreateExerciseRequest, createdBy uuid.UUID) (*models.Exercise, error) {
	return s.repo.CreateExercise(req, createdBy)
}

// UpdateExercise updates exercise details (admin only)
func (s *ExerciseService) UpdateExercise(id uuid.UUID, req *models.UpdateExerciseRequest, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		if err := s.repo.CheckExerciseOwnership(id, userID); err != nil {
			return err
		}
	}
	return s.repo.UpdateExercise(id, req)
}

// DeleteExercise soft deletes exercise (admin only)
func (s *ExerciseService) DeleteExercise(id uuid.UUID, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		if err := s.repo.CheckExerciseOwnership(id, userID); err != nil {
			return err
		}
	}
	return s.repo.DeleteExercise(id)
}

// CheckOwnership verifies if user owns the exercise
func (s *ExerciseService) CheckOwnership(exerciseID, userID uuid.UUID) error {
	return s.repo.CheckExerciseOwnership(exerciseID, userID)
}

// CreateSection creates a new section for exercise
func (s *ExerciseService) CreateSection(exerciseID uuid.UUID, req *models.CreateSectionRequest, userID uuid.UUID, userRole string) (*models.ExerciseSection, error) {
	// Verify ownership
	if userRole != "admin" {
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return nil, err
		}
	}
	return s.repo.CreateSection(exerciseID, req)
}

// CreateQuestion creates a new question
func (s *ExerciseService) CreateQuestion(req *models.CreateQuestionRequest, userID uuid.UUID, userRole string) (*models.Question, error) {
	// Verify ownership
	if userRole != "admin" {
		if err := s.repo.CheckExerciseOwnership(req.ExerciseID, userID); err != nil {
			return nil, err
		}
	}
	return s.repo.CreateQuestion(req)
}

// CreateQuestionOption creates an option for multiple choice question
func (s *ExerciseService) CreateQuestionOption(questionID uuid.UUID, req *models.CreateQuestionOptionRequest, userID uuid.UUID, userRole string) (*models.QuestionOption, error) {
	// Get exercise ID from question and verify ownership
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return nil, err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return nil, err
		}
	}
	return s.repo.CreateQuestionOption(questionID, req)
}

// CreateQuestionAnswer creates answer for text-based question
func (s *ExerciseService) CreateQuestionAnswer(questionID uuid.UUID, req *models.CreateQuestionAnswerRequest, userID uuid.UUID, userRole string) (*models.QuestionAnswer, error) {
	// Get exercise ID from question and verify ownership
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return nil, err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return nil, err
		}
	}
	return s.repo.CreateQuestionAnswer(questionID, req)
}

// UpdateQuestion updates question details
func (s *ExerciseService) UpdateQuestion(questionID uuid.UUID, req *models.UpdateQuestionRequest, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.UpdateQuestion(questionID, req)
}

// DeleteQuestion deletes a question
func (s *ExerciseService) DeleteQuestion(questionID uuid.UUID, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.DeleteQuestion(questionID)
}

// DeleteSection deletes a section and all its questions
func (s *ExerciseService) DeleteSection(sectionID uuid.UUID, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDBySectionID(sectionID)
		if err != nil {
			return err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.DeleteSection(sectionID)
}

// DeleteQuestionOption deletes a question option
func (s *ExerciseService) DeleteQuestionOption(questionID, optionID uuid.UUID, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.DeleteQuestionOption(questionID, optionID)
}

// UpdateQuestionAnswer updates answer details
func (s *ExerciseService) UpdateQuestionAnswer(questionID, answerID uuid.UUID, req *models.UpdateQuestionAnswerRequest, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.UpdateQuestionAnswer(questionID, answerID, req)
}

// DeleteQuestionAnswer deletes a question answer
func (s *ExerciseService) DeleteQuestionAnswer(questionID, answerID uuid.UUID, userID uuid.UUID, userRole string) error {
	if userRole != "admin" {
		exerciseID, err := s.repo.GetExerciseIDByQuestionID(questionID)
		if err != nil {
			return err
		}
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.DeleteQuestionAnswer(questionID, answerID)
}

// PublishExercise publishes an exercise
func (s *ExerciseService) PublishExercise(exerciseID, userID uuid.UUID, userRole string) error {
	// Verify ownership
	if userRole != "admin" {
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.PublishExercise(exerciseID)
}

// UnpublishExercise unpublishes an exercise
func (s *ExerciseService) UnpublishExercise(exerciseID, userID uuid.UUID, userRole string) error {
	// Verify ownership
	if userRole != "admin" {
		if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
			return err
		}
	}
	return s.repo.UnpublishExercise(exerciseID)
}

// GetAllTags returns all available tags
func (s *ExerciseService) GetAllTags() ([]models.ExerciseTag, error) {
	return s.repo.GetAllTags()
}

// GetExerciseTags returns tags for a specific exercise
func (s *ExerciseService) GetExerciseTags(exerciseID uuid.UUID) ([]models.ExerciseTag, error) {
	return s.repo.GetExerciseTags(exerciseID)
}

// AddTagToExercise adds a tag to an exercise
func (s *ExerciseService) AddTagToExercise(exerciseID uuid.UUID, tagID int, userID uuid.UUID) error {
	// Verify ownership
	if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
		return err
	}
	return s.repo.AddTagToExercise(exerciseID, tagID)
}

// RemoveTagFromExercise removes a tag from an exercise
func (s *ExerciseService) RemoveTagFromExercise(exerciseID uuid.UUID, tagID int, userID uuid.UUID) error {
	// Verify ownership
	if err := s.repo.CheckExerciseOwnership(exerciseID, userID); err != nil {
		return err
	}
	return s.repo.RemoveTagFromExercise(exerciseID, tagID)
}

// CreateTag creates a new tag
func (s *ExerciseService) CreateTag(name, slug string) (*models.ExerciseTag, error) {
	return s.repo.CreateTag(name, slug)
}

// GetBankQuestions returns questions from question bank
func (s *ExerciseService) GetBankQuestions(skillType, questionType string, page, limit int) ([]models.QuestionBank, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.repo.GetBankQuestions(skillType, questionType, limit, offset)
}

// CreateBankQuestion creates a question in question bank
func (s *ExerciseService) CreateBankQuestion(req *models.CreateBankQuestionRequest, userID uuid.UUID) (*models.QuestionBank, error) {
	return s.repo.CreateBankQuestion(req, userID)
}

// UpdateBankQuestion updates a question in question bank
func (s *ExerciseService) UpdateBankQuestion(questionID uuid.UUID, req *models.UpdateBankQuestionRequest, userID uuid.UUID) error {
	return s.repo.UpdateBankQuestion(questionID, req)
}

// DeleteBankQuestion deletes a question from question bank
func (s *ExerciseService) DeleteBankQuestion(questionID, userID uuid.UUID) error {
	return s.repo.DeleteBankQuestion(questionID)
}

// GetExerciseAnalytics returns analytics for an exercise
func (s *ExerciseService) GetExerciseAnalytics(exerciseID uuid.UUID) (*models.ExerciseAnalytics, error) {
	return s.repo.GetExerciseAnalytics(exerciseID)
}

// handleExerciseCompletion handles service-to-service integration when exercise is completed
func (s *ExerciseService) handleExerciseCompletion(submissionID uuid.UUID) {
	log.Printf("[Exercise-Service] Handling exercise completion for submission %s", submissionID)

	// Get submission result (includes both submission and exercise)
	result, err := s.repo.GetSubmissionResult(submissionID)
	if err != nil {
		log.Printf("[Exercise-Service] ERROR: Failed to get submission result: %v", err)
		return
	}

	submission := result.Submission
	exercise := result.Exercise
	skillType := exercise.SkillType

	// Extract band score value (handle pointer)
	// We use band_score (0-9) for all statistics and notifications
	bandScore := 0.0
	if submission.BandScore != nil {
		bandScore = *submission.BandScore
	}

	// Use time_spent_seconds from submission (already calculated and stored)
	// This represents ACTIVE study time, not just elapsed time
	// TimeSpentSeconds is set by CompleteSubmissionWithTime or MarkSubmissionAsSubmittedWithTime
	timeMinutes := 0
	if submission.TimeSpentSeconds > 0 {
		timeMinutes = submission.TimeSpentSeconds / 60
		log.Printf("[Exercise-Service] Using stored time_spent: %d seconds (%d minutes)",
			submission.TimeSpentSeconds, timeMinutes)
	} else if submission.CompletedAt != nil {
		// FALLBACK: Calculate elapsed time if time_spent not available
		duration := submission.CompletedAt.Sub(submission.StartedAt)
		timeMinutes = int(duration.Minutes())
		log.Printf("[Exercise-Service] ⚠️  No time_spent, using elapsed: %d minutes", timeMinutes)
	}

	// FIX #15: Add retry mechanism for service integration
	maxRetries := 3
	retryDelay := time.Second

	// 1. Update skill statistics in User Service (only if bandScore > 0)
	// Note: We only update stats when bandScore > 0 to avoid creating stats with 0 scores
	// This is by design - users need to get at least some correct answers to have meaningful statistics
	// Apply to all skills (Listening, Reading, Writing, Speaking)
	if bandScore > 0 {
		log.Printf("[Exercise-Service] Updating skill statistics in User Service (bandScore: %.1f, skill: %s)...", bandScore, skillType)
		var lastErr error
		for attempt := 1; attempt <= maxRetries; attempt++ {
			err = s.userServiceClient.UpdateSkillStatistics(client.UpdateSkillStatsRequest{
				UserID:         submission.UserID.String(),
				SkillType:      skillType,
				Score:          bandScore, // Send band score (0-9) instead of percentage
				TimeMinutes:    timeMinutes,
				IsCompleted:    true,
				TotalPractices: 1,
			})
			if err == nil {
				log.Printf("[Exercise-Service] SUCCESS: Updated skill statistics (attempt %d)", attempt)
				break
			}
			lastErr = err
			if attempt < maxRetries {
				log.Printf("[Exercise-Service] Attempt %d failed, retrying in %v...", attempt, retryDelay)
				time.Sleep(retryDelay)
				retryDelay *= 2 // Exponential backoff
			}
		}
		if lastErr != nil {
			log.Printf("[Exercise-Service] ERROR: Failed to update skill stats after %d attempts: %v", maxRetries, lastErr)
		}
	} else {
		log.Printf("[Exercise-Service] Skipping skill statistics update (bandScore = 0). User needs to get at least some correct answers to have meaningful statistics.")
	}

	// 2. Update overall progress in User Service (for all skills)
	log.Printf("[Exercise-Service] Updating user progress in User Service (skill: %s)...", skillType)
	retryDelay = time.Second // Reset delay
	var progressErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		err = s.userServiceClient.UpdateProgress(client.UpdateProgressRequest{
			UserID:            submission.UserID.String(),
			ExercisesComplete: 1,
			StudyMinutes:      timeMinutes,
			SkillType:         skillType,
			SessionType:       "exercise",
			ResourceID:        submission.ExerciseID.String(),
			Score:             bandScore, // Send band score (0-9) instead of percentage
		})
		if err == nil {
			log.Printf("[Exercise-Service] SUCCESS: Updated user progress (attempt %d)", attempt)
			break
		}
		progressErr = err
		if attempt < maxRetries {
			log.Printf("[Exercise-Service] Attempt %d failed, retrying in %v...", attempt, retryDelay)
			time.Sleep(retryDelay)
			retryDelay *= 2 // Exponential backoff
		}
	}
	if progressErr != nil {
		log.Printf("[Exercise-Service] ERROR: Failed to update user progress after %d attempts: %v", maxRetries, progressErr)
	}

	// 3. Send exercise result notification for all skills (Listening, Reading, Writing, Speaking)
	log.Printf("[Exercise-Service] Sending exercise result notification for skill: %s...", skillType)
	retryDelay = time.Second // Reset delay
	var notificationErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		err = s.notificationClient.SendExerciseResultNotification(
			submission.UserID.String(),
			exercise.Title,
			bandScore, // Send band score (0-9) instead of percentage
		)
		if err == nil {
			log.Printf("[Exercise-Service] SUCCESS: Sent exercise result notification (attempt %d)", attempt)
			break
		}
		notificationErr = err
		if attempt < maxRetries {
			log.Printf("[Exercise-Service] Attempt %d failed, retrying in %v...", attempt, retryDelay)
			time.Sleep(retryDelay)
			retryDelay *= 2 // Exponential backoff
		}
	}
	if notificationErr != nil {
		log.Printf("[Exercise-Service] ERROR: Failed to send notification after %d attempts: %v", maxRetries, notificationErr)
	}
}

// StartSyncRetryWorker starts background worker to retry failed syncs
// FIX #8, #9: Persistent sync retry mechanism
func (s *ExerciseService) StartSyncRetryWorker() {
	ticker := time.NewTicker(5 * time.Minute) // Check every 5 minutes
	defer ticker.Stop()

	log.Println("🔄 Started User Service sync retry worker (checking every 5 minutes)")

	for range ticker.C {
		s.retryFailedSyncs()
	}
}

// retryFailedSyncs attempts to resync failed/pending submissions
func (s *ExerciseService) retryFailedSyncs() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("❌ PANIC in retryFailedSyncs: %v", r)
		}
	}()

	// Get pending syncs (limit 50 per batch)
	submissions, err := s.repo.GetPendingSyncs(50)
	if err != nil {
		log.Printf("⚠️ Failed to get pending syncs: %v", err)
		return
	}

	if len(submissions) == 0 {
		return // No pending syncs
	}

	log.Printf("🔄 Found %d pending syncs, attempting retry...", len(submissions))

	successCount := 0
	failCount := 0

	for _, submission := range submissions {
		// Get full exercise data
		exercise, err := s.repo.GetExerciseByIDSimple(submission.ExerciseID)
		if err != nil {
			log.Printf("⚠️ Failed to get exercise %s: %v", submission.ExerciseID, err)
			continue
		}

		// Get band score
		bandScore := 0.0
		if submission.BandScore != nil {
			bandScore = *submission.BandScore
		}

		// Retry sync (not in goroutine - sequential for reliability)
		err = s.retrySingleSync(submission, exercise, bandScore)
		if err != nil {
			failCount++
			log.Printf("❌ Retry failed for submission %s: %v", submission.ID, err)
		} else {
			successCount++
			log.Printf("✅ Retry succeeded for submission %s", submission.ID)
		}
	}

	log.Printf("🔄 Sync retry batch completed: %d succeeded, %d failed", successCount, failCount)
}

// retrySingleSync retries syncing a single submission
func (s *ExerciseService) retrySingleSync(
	submission *models.UserExerciseAttempt,
	exercise *models.Exercise,
	bandScore float64,
) error {
	isOfficialTest := exercise.IsOfficialTest()

	if isOfficialTest {
		// Retry official test result
		submissionIDStr := submission.ID.String()
		req := client.RecordTestResultRequest{
			TestType:      exercise.ExerciseType,
			SkillType:     exercise.SkillType,
			SourceService: "exercise_service",
			SourceTable:   "user_exercise_attempts",
			SourceID:      &submissionIDStr,
			TestSource:    "platform",
		}

		if exercise.SkillType == "reading" && exercise.IELTSTestType != nil {
			req.IELTSVariant = exercise.IELTSTestType
		}

		if exercise.SkillType == "listening" || exercise.SkillType == "reading" {
			req.RawScore = &submission.CorrectAnswers
			req.TotalQuestions = &submission.TotalQuestions
		} else {
			req.BandScore = bandScore
		}

		err := s.userServiceClient.RecordTestResult(submission.UserID.String(), req)
		if err != nil {
			s.repo.MarkUserServiceSyncFailed(submission.ID, err.Error())
			return err
		}

		s.repo.MarkUserServiceSyncSuccess(submission.ID)
		return nil

	} else {
		// Retry practice activity
		// Note: For retry, we don't have full submission data loaded
		// Mark as failed if we can't retry properly
		log.Printf("⚠️ Practice activity retry not fully implemented for %s", submission.ID)
		return nil
	}
}
