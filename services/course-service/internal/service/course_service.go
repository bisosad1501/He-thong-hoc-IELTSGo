package service

import (
	"fmt"
	"log"
	"math"
	"time"

	"github.com/bisosad1501/DATN/shared/pkg/client"
	localclient "github.com/bisosad1501/ielts-platform/course-service/internal/client"
	"github.com/bisosad1501/ielts-platform/course-service/internal/models"
	"github.com/bisosad1501/ielts-platform/course-service/internal/repository"
	"github.com/google/uuid"
)

type CourseService struct {
	repo               *repository.CourseRepository
	userServiceClient  *client.UserServiceClient
	localUserClient    *localclient.UserServiceClient // For session tracking
	notificationClient *client.NotificationServiceClient
	exerciseClient     *client.ExerciseServiceClient
	youtubeService     *YouTubeService
}

func NewCourseService(repo *repository.CourseRepository, userServiceClient *client.UserServiceClient, notificationClient *client.NotificationServiceClient, exerciseClient *client.ExerciseServiceClient, youtubeService *YouTubeService, internalKey string, userServiceURL string) *CourseService {
	// Initialize local user service client for session tracking
	localUserClient := localclient.NewUserServiceClient(userServiceURL, internalKey)

	return &CourseService{
		repo:               repo,
		userServiceClient:  userServiceClient,
		localUserClient:    localUserClient,
		notificationClient: notificationClient,
		exerciseClient:     exerciseClient,
		youtubeService:     youtubeService,
	}
}

// GetCourses retrieves courses with filters
func (s *CourseService) GetCourses(query *models.CourseListQuery) ([]models.Course, int, error) {
	// Set defaults
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.Limit <= 0 || query.Limit > 100 {
		query.Limit = 20
	}

	return s.repo.GetCourses(query)
}

// GetCourseDetail retrieves detailed course with modules and lessons
func (s *CourseService) GetCourseDetail(courseID uuid.UUID, userID *uuid.UUID) (*models.CourseDetailResponse, error) {
	// Get course
	course, err := s.repo.GetCourseByID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	if course == nil {
		return nil, fmt.Errorf("course not found")
	}

	// Get modules
	modules, err := s.repo.GetModulesByCourseID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get modules: %w", err)
	}

	// Get lessons and exercises for each module
	var modulesWithLessons []models.ModuleWithLessons
	var courseLevelExercises []models.ExerciseSummary // Store course-level exercises separately

	// First, get course-level exercises once (only if course has modules)
	if len(modules) > 0 && s.exerciseClient != nil {
		courseLevelExercisesList, err := s.exerciseClient.GetExercisesByCourseIDWithFilter(modules[0].CourseID.String(), true)
		if err != nil {
			log.Printf("Warning: failed to get course-level exercises for course %s: %v", modules[0].CourseID, err)
		} else {
			// Convert to models.ExerciseSummary
			for _, ex := range courseLevelExercisesList {
				courseLevelExercises = append(courseLevelExercises, models.ExerciseSummary{
					ID:             uuid.MustParse(ex.ID),
					Title:          ex.Title,
					Slug:           ex.Slug,
					Description:    ex.Description,
					ExerciseType:   ex.ExerciseType,
					SkillType:      ex.SkillType,
					Difficulty:     ex.Difficulty,
					TotalQuestions: ex.TotalQuestions,
					TotalSections:  ex.TotalSections,
					TimeLimitMins:  ex.TimeLimitMins,
					PassingScore:   ex.PassingScore,
					DisplayOrder:   ex.DisplayOrder,
				})
			}
		}
	}

	for _, module := range modules {
		// Get lessons
		lessons, err := s.repo.GetLessonsByModuleID(module.ID)
		if err != nil {
			log.Printf("Warning: failed to get lessons for module %s: %v", module.ID, err)
			lessons = []models.Lesson{}
		}

		// Load videos for each lesson
		var lessonsWithVideos []models.LessonWithVideos
		for _, lesson := range lessons {
			lessonWithVideo := models.LessonWithVideos{
				Lesson: lesson,
			}

			// Get videos for this lesson
			videos, err := s.repo.GetVideosByLessonID(lesson.ID)
			if err != nil {
				log.Printf("Warning: failed to get videos for lesson %s: %v", lesson.ID, err)
			} else {
				lessonWithVideo.Videos = videos
			}

			lessonsWithVideos = append(lessonsWithVideos, lessonWithVideo)
		}

		// Get exercises for this module from Exercise Service
		// NOTE: Only get module-specific exercises, NOT course-level exercises
		var exercises []models.ExerciseSummary
		if s.exerciseClient != nil {
			// Get module-specific exercises (module_id = module.ID)
			moduleExercises, err := s.exerciseClient.GetExercisesByModuleID(module.ID.String())
			if err != nil {
				log.Printf("Warning: failed to get exercises for module %s: %v", module.ID, err)
			} else {
				// Convert client.ExerciseSummary to models.ExerciseSummary
				for _, ex := range moduleExercises {
					exercises = append(exercises, models.ExerciseSummary{
						ID:             uuid.MustParse(ex.ID),
						Title:          ex.Title,
						Slug:           ex.Slug,
						Description:    ex.Description,
						ExerciseType:   ex.ExerciseType,
						SkillType:      ex.SkillType,
						Difficulty:     ex.Difficulty,
						TotalQuestions: ex.TotalQuestions,
						TotalSections:  ex.TotalSections,
						TimeLimitMins:  ex.TimeLimitMins,
						PassingScore:   ex.PassingScore,
						DisplayOrder:   ex.DisplayOrder,
					})
				}
			}
		}

		modulesWithLessons = append(modulesWithLessons, models.ModuleWithLessons{
			Module:    module,
			Lessons:   lessonsWithVideos,
			Exercises: exercises,
		})
	}

	// 📊 DON'T override duration_hours - use database value
	// Database duration_hours is the SOURCE OF TRUTH, calculated from ALL lesson durations
	// (video + article + mixed), representing TOTAL study time for the course
	log.Printf("[Course-Service] ℹ️  Using database duration_hours: %.2f hours (total study time from all lessons)", func() float64 {
		if course.DurationHours != nil {
			return *course.DurationHours
		}
		return 0
	}())

	response := &models.CourseDetailResponse{
		Course:               *course,
		Modules:              modulesWithLessons,
		CourseLevelExercises: courseLevelExercises, // NEW: Return course-level exercises separately
	}

	// Check enrollment if user is authenticated
	if userID != nil {
		enrollment, err := s.repo.GetEnrollment(*userID, courseID)
		if err != nil {
			log.Printf("Warning: failed to get enrollment: %v", err)
		} else if enrollment != nil {
			response.IsEnrolled = true
			response.EnrollmentDetails = enrollment
		}
	}

	return response, nil
}

// GetLessonDetail retrieves detailed lesson with videos and materials
func (s *CourseService) GetLessonDetail(lessonID uuid.UUID, userID *uuid.UUID) (*models.LessonDetailResponse, error) {
	// Get lesson
	lesson, err := s.repo.GetLessonByID(lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}
	if lesson == nil {
		return nil, fmt.Errorf("lesson not found")
	}

	// Get videos
	videos, err := s.repo.GetVideosByLessonID(lessonID)
	if err != nil {
		log.Printf("Warning: failed to get videos: %v", err)
		videos = []models.LessonVideo{}
	}

	// Get materials
	materials, err := s.repo.GetMaterialsByLessonID(lessonID)
	if err != nil {
		log.Printf("Warning: failed to get materials: %v", err)
		materials = []models.LessonMaterial{}
	}

	response := &models.LessonDetailResponse{
		Lesson:    *lesson,
		Videos:    videos,
		Materials: materials,
	}

	// Get progress if user is authenticated
	if userID != nil {
		progress, err := s.repo.GetLessonProgress(*userID, lessonID)
		if err != nil {
			log.Printf("Warning: failed to get lesson progress: %v", err)
		} else if progress != nil {
			response.Progress = progress
		}
	}

	return response, nil
}

// EnrollCourse enrolls a user in a course
func (s *CourseService) EnrollCourse(userID uuid.UUID, req *models.EnrollmentRequest) (*models.CourseEnrollment, error) {
	// Check if course exists
	course, err := s.repo.GetCourseByID(req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	if course == nil {
		return nil, fmt.Errorf("course not found")
	}

	// Validate enrollment type
	enrollmentType := req.EnrollmentType
	if enrollmentType == "" {
		enrollmentType = "free"
	}

	// For paid courses, validate enrollment type
	if course.EnrollmentType != "free" && enrollmentType == "free" {
		return nil, fmt.Errorf("this course requires payment")
	}

	// FIX #9: Let database handle duplicate check via ON CONFLICT
	// This prevents race conditions from check-then-insert pattern
	enrollment := &models.CourseEnrollment{
		ID:             uuid.New(),
		UserID:         userID,
		CourseID:       req.CourseID,
		EnrollmentType: enrollmentType,
		Status:         "active",
	}

	if enrollmentType == "purchased" {
		enrollment.AmountPaid = &course.Price
		enrollment.Currency = &course.Currency
	}

	err = s.repo.CreateEnrollment(enrollment)
	if err != nil {
		return nil, fmt.Errorf("failed to create enrollment: %w", err)
	}

	// Send enrollment notification (non-critical, async)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[Course-Service] PANIC in enrollment notification: %v", r)
			}
		}()

		log.Printf("[Course-Service] Sending enrollment notification for user %s, course %s", userID, course.ID)
		actionType := "navigate_to_course"
		err := s.notificationClient.SendNotification(client.SendNotificationRequest{
			UserID:     userID.String(),
			Title:      "Đã đăng ký khóa học thành công",
			Message:    fmt.Sprintf("Bạn đã đăng ký khóa học '%s'. Bắt đầu học ngay để đạt mục tiêu của bạn.", course.Title),
			Type:       "course_update",
			Category:   "success",
			ActionType: &actionType,
			ActionData: map[string]interface{}{
				"course_id": course.ID.String(),
			},
			Priority: "normal",
		})
		if err != nil {
			log.Printf("[Course-Service] ❌ ERROR: Failed to send enrollment notification: %v", err)
		} else {
			log.Printf("[Course-Service] ✅ SUCCESS: Sent enrollment notification for user %s, course %s", userID, course.ID)
		}
	}()

	// Return the enrollment (might be existing one due to ON CONFLICT)
	return s.repo.GetEnrollment(userID, req.CourseID)
}

// GetMyEnrollments retrieves user's enrollments with pagination
func (s *CourseService) GetMyEnrollments(userID uuid.UUID, page, limit int) (*models.MyEnrollmentsResponse, int, error) {
	// Validate pagination params
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	enrollments, total, err := s.repo.GetUserEnrollments(userID, page, limit)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get enrollments: %w", err)
	}

	var enrollmentsWithCourses []models.EnrollmentWithCourse
	for _, enrollment := range enrollments {
		course, err := s.repo.GetCourseByID(enrollment.CourseID)
		if err != nil {
			log.Printf("Warning: failed to get course %s: %v", enrollment.CourseID, err)
			continue
		}
		if course == nil {
			continue
		}

		enrollmentsWithCourses = append(enrollmentsWithCourses, models.EnrollmentWithCourse{
			Enrollment: enrollment,
			Course:     *course,
		})
	}

	return &models.MyEnrollmentsResponse{
		Enrollments: enrollmentsWithCourses,
		Total:       len(enrollmentsWithCourses),
	}, total, nil
}

// UpdateLessonProgress updates lesson progress
func (s *CourseService) UpdateLessonProgress(userID, lessonID uuid.UUID, req *models.UpdateLessonProgressRequest) (*models.LessonProgress, error) {
	// Get lesson to validate
	lesson, err := s.repo.GetLessonByID(lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}
	if lesson == nil {
		return nil, fmt.Errorf("lesson not found")
	}

	// Check enrollment
	enrollment, err := s.repo.GetEnrollment(userID, lesson.CourseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check enrollment: %w", err)
	}
	if enrollment == nil {
		return nil, fmt.Errorf("not enrolled in this course")
	}

	// FIX #7 & #10: Use UPSERT pattern with atomic operations for ALL updates
	// This prevents race conditions by letting database handle concurrency

	// Check existing progress BEFORE update to detect completion
	existingProgress, _ := s.repo.GetLessonProgress(userID, lessonID)
	wasAlreadyCompleted := existingProgress != nil && existingProgress.Status == "completed"

	// Build progress update (preserve existing values)
	progress := &models.LessonProgress{
		ID:       uuid.New(),
		UserID:   userID,
		LessonID: lessonID,
		CourseID: lesson.CourseID,
		Status:   "in_progress",
	}

	// Preserve existing completed_at if already completed
	if existingProgress != nil {
		if existingProgress.Status == "completed" {
			progress.Status = "completed"
			progress.CompletedAt = existingProgress.CompletedAt
		}
		// Preserve ID for UPSERT
		progress.ID = existingProgress.ID
	}

	// ✅ Get current values from existingProgress to compare
	currentWatchedSeconds := 0
	currentProgressPct := 0.0
	if existingProgress != nil {
		currentWatchedSeconds = existingProgress.VideoWatchedSeconds
		currentProgressPct = existingProgress.ProgressPercentage
	}

	// ✅ Only update video progress if new value is GREATER than current
	// This prevents progress from being reset when user reloads page
	if req.VideoWatchedSeconds != nil {
		if *req.VideoWatchedSeconds > currentWatchedSeconds {
			progress.VideoWatchedSeconds = *req.VideoWatchedSeconds
			log.Printf("[Course-Service] ✅ Updated video_watched_seconds: %d -> %d",
				currentWatchedSeconds, *req.VideoWatchedSeconds)
		} else {
			// Keep existing value
			progress.VideoWatchedSeconds = currentWatchedSeconds
			log.Printf("[Course-Service] ⏭️  Skipped video_watched_seconds update: new=%d <= current=%d",
				*req.VideoWatchedSeconds, currentWatchedSeconds)
		}
	} else {
		// If not provided in request, keep existing value
		progress.VideoWatchedSeconds = currentWatchedSeconds
	}

	if req.VideoTotalSeconds != nil {
		progress.VideoTotalSeconds = req.VideoTotalSeconds
	} else if existingProgress != nil {
		progress.VideoTotalSeconds = existingProgress.VideoTotalSeconds
	}

	// video_watch_percentage field removed (see migration 011)
	// time_spent_minutes field removed (see migration 013)

	// ⏭️ Skip progress_percentage calculation here - will calculate AFTER last_position is updated

	// ✅ Smart update last_position (for resume watching)
	// CRITICAL: Don't reset to 0 if we already have a saved position!
	// This prevents overwriting resume position when page reloads (video not started yet)
	if req.LastPositionSeconds != nil {
		newPosition := *req.LastPositionSeconds
		currentPosition := 0
		if existingProgress != nil {
			currentPosition = existingProgress.LastPositionSeconds
		}

		// Only update if:
		// 1. New position > 0 (video is actually playing)
		// 2. OR current position is 0 (no saved position yet)
		if newPosition > 0 || currentPosition == 0 {
			progress.LastPositionSeconds = newPosition
			log.Printf("[Course-Service] ✅ Updated last_position_seconds: %d -> %d",
				currentPosition, newPosition)
		} else {
			// Keep existing position (don't reset to 0)
			progress.LastPositionSeconds = currentPosition
			log.Printf("[Course-Service] ⏭️  Kept last_position_seconds: %d (rejected new=0)",
				currentPosition)
		}
	} else if existingProgress != nil {
		// Keep existing value if not provided in request
		progress.LastPositionSeconds = existingProgress.LastPositionSeconds
	}

	// 🎯 PRODUCTION LOGIC: Calculate Progress AFTER last_position is updated
	// Progress = Furthest Position Reached (like YouTube/Coursera/Udemy)
	// This is simple, predictable, and matches user expectations:
	// - User seeks ahead → progress increases ✅
	// - User rewinds → progress stays same ✅
	// - Clear percentage based on how far they've reached in the video
	if req.ProgressPercentage != nil {
		// Allow manual override if provided
		progress.ProgressPercentage = *req.ProgressPercentage
		log.Printf("[Course-Service] 📊 Using provided progress_percentage: %.2f%%", progress.ProgressPercentage)
	} else {
		// Auto-calculate: Progress = last_position / total_duration * 100
		if progress.VideoTotalSeconds != nil && *progress.VideoTotalSeconds > 0 {
			progress.ProgressPercentage = float64(progress.LastPositionSeconds) / float64(*progress.VideoTotalSeconds) * 100
			log.Printf("[Course-Service] 📊 Auto-calculated progress: %.2f%% (position: %ds / %ds)",
				progress.ProgressPercentage, progress.LastPositionSeconds, *progress.VideoTotalSeconds)
		} else {
			// Keep existing value if no video data
			progress.ProgressPercentage = currentProgressPct
		}
	}

	// Check if completing (and was not already completed)
	wasJustCompleted := false
	isCompletedVal := "nil"
	if req.IsCompleted != nil {
		isCompletedVal = fmt.Sprintf("%v", *req.IsCompleted)
	}
	log.Printf("[Course-Service] UpdateLessonProgress for user %s: req.IsCompleted=%s, wasAlreadyCompleted=%v",
		userID, isCompletedVal, wasAlreadyCompleted)

	if req.IsCompleted != nil && *req.IsCompleted {
		progress.Status = "completed"
		now := time.Now()
		progress.CompletedAt = &now
		progress.ProgressPercentage = 100

		if !wasAlreadyCompleted {
			wasJustCompleted = true
			log.Printf("[Course-Service] Lesson just completed by user %s", userID)
		} else {
			log.Printf("[Course-Service] Lesson already completed - skipping user service integration for user %s", userID)
		}
	} else if progress.ProgressPercentage >= 100 {
		progress.Status = "completed"
		now := time.Now()
		progress.CompletedAt = &now

		if !wasAlreadyCompleted {
			wasJustCompleted = true
			log.Printf("[Course-Service] Lesson just completed (progress >= 100) by user %s", userID)
		}
	}

	// UPSERT: Insert or update using database ON CONFLICT
	err = s.repo.UpdateLessonProgress(progress)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert progress: %w", err)
	}

	// ✅ Track video watching time as study session
	// Track session when last_position changes (video is playing)
	// This works even when user replays video from start
	if req.LastPositionSeconds != nil {
		currentPosition := 0
		if existingProgress != nil {
			currentPosition = existingProgress.LastPositionSeconds
		}

		log.Printf("[Course-Service] 🔍 Session tracking: req.LastPos=%d, currentPos=%d, existingProgress=%v",
			*req.LastPositionSeconds, currentPosition, existingProgress != nil)

		// Calculate how much time passed since last update (5 seconds typically)
		// Only track if position is moving forward
		if *req.LastPositionSeconds > currentPosition {
			positionDiff := *req.LastPositionSeconds - currentPosition

			// Create session for EVERY update, even if < 60s
			// Count each 5s chunk as 1 minute minimum to track all watching time
			durationMinutes := positionDiff / 60
			if durationMinutes == 0 && positionDiff > 0 {
				durationMinutes = 1 // Track even small durations
			}

			log.Printf("[Course-Service] 🔍 Calculated: positionDiff=%d, durationMinutes=%d", positionDiff, durationMinutes)

			if durationMinutes > 0 {
				// Get course to get skill_type
				course, courseErr := s.repo.GetCourseByID(lesson.CourseID)
				if courseErr == nil && course != nil {
					// Create study session for this watching segment
					go func() {
						defer func() {
							if r := recover(); r != nil {
								log.Printf("[Course-Service] PANIC in createVideoStudySession: %v", r)
							}
						}()

						sessionReq := &localclient.StartSessionRequest{
							UserID:       userID.String(),
							SessionType:  "lesson",
							SkillType:    course.SkillType,
							ResourceID:   lessonID.String(),
							ResourceType: "video_lesson",
						}

						if err := s.localUserClient.StartSession(sessionReq); err != nil {
							log.Printf("[Course-Service] ⚠️  Failed to create video study session: %v", err)
						} else {
							log.Printf("[Course-Service] 📹 Created study session for %d minutes of video watching (position: %ds → %ds)",
								durationMinutes, currentPosition, *req.LastPositionSeconds)
						}
					}()
				}
			}
		}
	}

	// Handle lesson completion
	if wasJustCompleted {

		// Refresh progress for notification
		updatedProgress, _ := s.repo.GetLessonProgress(userID, lessonID)
		if updatedProgress != nil {
			go func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("[Course-Service] PANIC in handleLessonCompletion: %v", r)
					}
				}()
				s.handleLessonCompletion(userID, lessonID, lesson, updatedProgress)
			}()
		}
	}

	// Return final progress
	return s.repo.GetLessonProgress(userID, lessonID)
}

// GetEnrollmentProgress retrieves detailed enrollment progress
func (s *CourseService) GetEnrollmentProgress(userID, courseID uuid.UUID) (*models.EnrollmentProgressResponse, error) {
	// Get enrollment
	enrollment, err := s.repo.GetEnrollment(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get enrollment: %w", err)
	}
	if enrollment == nil {
		return nil, fmt.Errorf("not enrolled in this course")
	}

	// Get course
	course, err := s.repo.GetCourseByID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	if course == nil {
		return nil, fmt.Errorf("course not found")
	}

	// Get modules
	modules, err := s.repo.GetModulesByCourseID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get modules: %w", err)
	}

	// Calculate progress for each module
	var modulesProgress []models.ModuleProgress
	for _, module := range modules {
		lessons, err := s.repo.GetLessonsByModuleID(module.ID)
		if err != nil {
			log.Printf("Warning: failed to get lessons for module %s: %v", module.ID, err)
			continue
		}

		completedCount := 0
		for _, lesson := range lessons {
			progress, _ := s.repo.GetLessonProgress(userID, lesson.ID)
			if progress != nil && progress.Status == "completed" {
				completedCount++
			}
		}

		progressPercentage := 0.0
		if len(lessons) > 0 {
			progressPercentage = float64(completedCount) / float64(len(lessons)) * 100
		}

		modulesProgress = append(modulesProgress, models.ModuleProgress{
			Module:             module,
			TotalLessons:       len(lessons),
			CompletedLessons:   completedCount,
			ProgressPercentage: progressPercentage,
		})
	}

	return &models.EnrollmentProgressResponse{
		Enrollment:      *enrollment,
		Course:          *course,
		ModulesProgress: modulesProgress,
		RecentLessons:   []models.LessonWithProgress{}, // Can be enhanced later
	}, nil
}

// GetLessonProgressByID retrieves progress for a single lesson (for resume watching)
func (s *CourseService) GetLessonProgressByID(userID, lessonID uuid.UUID) (*models.LessonProgress, error) {
	// Simply return the progress from repository (no enrollment check needed here)
	progress, err := s.repo.GetLessonProgress(userID, lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson progress: %w", err)
	}

	// ℹ️ No resume position sanitization needed with production logic
	// Progress = last_position → User sees 65%, resumes at 65% → CONSISTENT!
	// Old logic would reset skip-ahead, causing mismatch between progress display and resume position.

	return progress, nil
}

// GetCourseProgressLessons retrieves all lesson progress for a course
func (s *CourseService) GetCourseProgressLessons(userID, courseID uuid.UUID) ([]models.LessonProgress, error) {
	// Check if user is enrolled
	enrollment, err := s.repo.GetEnrollment(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get enrollment: %w", err)
	}
	if enrollment == nil {
		return nil, fmt.Errorf("not enrolled in this course")
	}

	// Get all modules for this course
	modules, err := s.repo.GetModulesByCourseID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get modules: %w", err)
	}

	// Collect all lesson progress
	var allProgress []models.LessonProgress
	for _, module := range modules {
		lessons, err := s.repo.GetLessonsByModuleID(module.ID)
		if err != nil {
			log.Printf("Warning: failed to get lessons for module %s: %v", module.ID, err)
			continue
		}

		for _, lesson := range lessons {
			progress, err := s.repo.GetLessonProgress(userID, lesson.ID)
			if err != nil {
				// If no progress yet, skip (don't return error)
				continue
			}
			if progress != nil {
				allProgress = append(allProgress, *progress)
			}
		}
	}

	return allProgress, nil
}

// CreateCourse creates a new course (Admin/Instructor only)
func (s *CourseService) CreateCourse(instructorID uuid.UUID, instructorName string, req *models.CreateCourseRequest) (*models.Course, error) {
	// Validate enrollment type and price
	enrollmentType := "free"
	if req.EnrollmentType != "" {
		enrollmentType = req.EnrollmentType
	}

	course := &models.Course{
		ID:               uuid.New(),
		Title:            req.Title,
		Slug:             req.Slug,
		Description:      req.Description,
		ShortDescription: req.ShortDescription,
		SkillType:        req.SkillType,
		Level:            req.Level,
		TargetBandScore:  req.TargetBandScore,
		ThumbnailURL:     req.ThumbnailURL,
		PreviewVideoURL:  req.PreviewVideoURL,
		InstructorID:     instructorID,
		InstructorName:   &instructorName,
		DurationHours:    req.DurationHours,
		EnrollmentType:   enrollmentType,
		Price:            req.Price,
		Currency:         req.Currency,
		Status:           "draft",
		DisplayOrder:     0,
	}

	if course.Currency == "" {
		course.Currency = "VND"
	}

	err := s.repo.CreateCourse(course)
	if err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}

	return course, nil
}

// UpdateCourse updates a course (Admin/Instructor only with ownership check)
func (s *CourseService) UpdateCourse(courseID uuid.UUID, userID uuid.UUID, userRole string, req *models.UpdateCourseRequest) (*models.Course, error) {
	// Check ownership if not admin
	if userRole != "admin" {
		isOwner, err := s.repo.CheckCourseOwnership(courseID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to check ownership: %w", err)
		}
		if !isOwner {
			return nil, fmt.Errorf("you don't have permission to update this course")
		}
	}

	// Get existing course
	course, err := s.repo.GetCourseByID(courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	if course == nil {
		return nil, fmt.Errorf("course not found")
	}

	// Build updates map
	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.ShortDescription != nil {
		updates["short_description"] = *req.ShortDescription
	}
	if req.TargetBandScore != nil {
		updates["target_band_score"] = *req.TargetBandScore
	}
	if req.ThumbnailURL != nil {
		updates["thumbnail_url"] = *req.ThumbnailURL
	}
	if req.PreviewVideoURL != nil {
		updates["preview_video_url"] = *req.PreviewVideoURL
	}
	if req.DurationHours != nil {
		updates["duration_hours"] = *req.DurationHours
	}
	if req.Price != nil {
		updates["price"] = *req.Price
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.IsFeatured != nil {
		updates["is_featured"] = *req.IsFeatured
	}
	if req.IsRecommended != nil {
		updates["is_recommended"] = *req.IsRecommended
	}

	err = s.repo.UpdateCourse(courseID, updates)
	if err != nil {
		return nil, fmt.Errorf("failed to update course: %w", err)
	}

	// Return updated course
	return s.repo.GetCourseByID(courseID)
}

// DeleteCourse deletes a course (Admin only)
func (s *CourseService) DeleteCourse(courseID uuid.UUID) error {
	return s.repo.DeleteCourse(courseID)
}

// CreateModule creates a new module (Admin/Instructor with ownership check)
func (s *CourseService) CreateModule(userID uuid.UUID, userRole string, req *models.CreateModuleRequest) (*models.Module, error) {
	// Check ownership if not admin
	if userRole != "admin" {
		isOwner, err := s.repo.CheckCourseOwnership(req.CourseID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to check ownership: %w", err)
		}
		if !isOwner {
			return nil, fmt.Errorf("you don't have permission to add modules to this course")
		}
	}

	// Verify course exists
	course, err := s.repo.GetCourseByID(req.CourseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course: %w", err)
	}
	if course == nil {
		return nil, fmt.Errorf("course not found")
	}

	module := &models.Module{
		ID:            uuid.New(),
		CourseID:      req.CourseID,
		Title:         req.Title,
		Description:   req.Description,
		DurationHours: req.DurationHours,
		DisplayOrder:  req.DisplayOrder,
		IsPublished:   true,
	}

	err = s.repo.CreateModule(module)
	if err != nil {
		return nil, fmt.Errorf("failed to create module: %w", err)
	}

	return module, nil
}

// CreateLesson creates a new lesson (Admin/Instructor with ownership check)
func (s *CourseService) CreateLesson(userID uuid.UUID, userRole string, req *models.CreateLessonRequest) (*models.Lesson, error) {
	// Get course_id from module
	courseID, err := s.repo.GetModuleCourseID(req.ModuleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get module: %w", err)
	}

	// Check ownership if not admin
	if userRole != "admin" {
		isOwner, err := s.repo.CheckCourseOwnership(courseID, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to check ownership: %w", err)
		}
		if !isOwner {
			return nil, fmt.Errorf("you don't have permission to add lessons to this course")
		}
	}

	lesson := &models.Lesson{
		ID:              uuid.New(),
		ModuleID:        req.ModuleID,
		CourseID:        courseID,
		Title:           req.Title,
		Description:     req.Description,
		ContentType:     req.ContentType,
		DurationMinutes: req.DurationMinutes,
		DisplayOrder:    req.DisplayOrder,
		IsFree:          req.IsFree,
		IsPublished:     true,
	}

	err = s.repo.CreateLesson(lesson)
	if err != nil {
		return nil, fmt.Errorf("failed to create lesson: %w", err)
	}

	// Send notification to enrolled users about new lesson (non-critical)
	go func() {
		// Get course to get enrolled users
		course, err := s.repo.GetCourseByID(courseID)
		if err != nil || course == nil {
			log.Printf("[Course-Service] WARNING: Failed to get course for new lesson notification: %v", err)
			return
		}

		// Get all enrolled users for this course
		enrollments, err := s.repo.GetCourseEnrollments(courseID)
		if err != nil {
			log.Printf("[Course-Service] WARNING: Failed to get enrollments for new lesson notification: %v", err)
			return
		}

		// Send notification to each enrolled user
		actionType := "navigate_to_lesson"
		for _, enrollment := range enrollments {
			err = s.notificationClient.SendNotification(client.SendNotificationRequest{
				UserID:     enrollment.UserID.String(),
				Title:      "Bài học mới đã được thêm vào khóa học",
				Message:    fmt.Sprintf("Khóa học '%s' vừa có bài học mới: '%s'. Truy cập để bắt đầu học.", course.Title, lesson.Title),
				Type:       "course_update",
				Category:   "info",
				ActionType: &actionType,
				ActionData: map[string]interface{}{
					"course_id": courseID.String(),
					"lesson_id": lesson.ID.String(),
				},
				Priority: "normal",
			})
			if err != nil {
				log.Printf("[Course-Service] WARNING: Failed to send new lesson notification to user %s: %v", enrollment.UserID, err)
			}
		}
		log.Printf("[Course-Service] ✅ Sent new lesson notifications to %d enrolled users", len(enrollments))
	}()

	return lesson, nil
}

// PublishCourse publishes a draft course (Admin/Instructor with ownership check)
func (s *CourseService) PublishCourse(courseID uuid.UUID, userID uuid.UUID, userRole string) error {
	// Check ownership if not admin
	if userRole != "admin" {
		isOwner, err := s.repo.CheckCourseOwnership(courseID, userID)
		if err != nil {
			return fmt.Errorf("failed to check ownership: %w", err)
		}
		if !isOwner {
			return fmt.Errorf("you don't have permission to publish this course")
		}
	}

	return s.repo.PublishCourse(courseID)
}

// ============================================
// COURSE REVIEWS
// ============================================

// GetCourseReviews retrieves reviews for a course with pagination
func (s *CourseService) GetCourseReviews(courseID uuid.UUID, page, limit int) ([]models.CourseReview, int, error) {
	// Validate pagination params
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.repo.GetCourseReviews(courseID, page, limit)
}

// CreateReview creates a new review for a course
func (s *CourseService) CreateReview(userID, courseID uuid.UUID, req *models.CreateReviewRequest) (*models.CourseReview, error) {
	// Check if user is enrolled
	enrollment, err := s.repo.GetEnrollment(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check enrollment: %w", err)
	}
	if enrollment == nil {
		return nil, fmt.Errorf("you must be enrolled in the course to leave a review")
	}

	// Check if user already reviewed
	existingReview, err := s.repo.GetUserReview(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing review: %w", err)
	}
	if existingReview != nil {
		return nil, fmt.Errorf("you have already reviewed this course")
	}

	// Create review
	now := time.Now()
	review := &models.CourseReview{
		UserID:     userID,
		CourseID:   courseID,
		Rating:     req.Rating,
		Title:      req.Title,
		Comment:    req.Comment,
		IsApproved: true, // Auto-approve (instant publish like Udemy/Coursera)
		ApprovedAt: &now, // Set approval timestamp
	}

	err = s.repo.CreateReview(review)
	if err != nil {
		return nil, fmt.Errorf("failed to create review: %w", err)
	}

	// Send notification to course instructor about new review (non-critical)
	go func() {
		// Get course to find instructor
		course, err := s.repo.GetCourseByID(courseID)
		if err != nil || course == nil {
			log.Printf("[Course-Service] WARNING: Failed to get course for review notification: %v", err)
			return
		}

		// Get reviewer name from user service (optional, can skip if fails)
		reviewerName := "Một học viên"
		// TODO: Get reviewer name from user service

		// Send notification to instructor
		actionType := "navigate_to_course"
		err = s.notificationClient.SendNotification(client.SendNotificationRequest{
			UserID:     course.InstructorID.String(),
			Title:      "Khóa học của bạn vừa nhận đánh giá mới",
			Message:    fmt.Sprintf("Khóa học '%s' vừa nhận được đánh giá %d sao từ %s. Xem chi tiết đánh giá.", course.Title, req.Rating, reviewerName),
			Type:       "course_update",
			Category:   "info",
			ActionType: &actionType,
			ActionData: map[string]interface{}{
				"course_id": courseID.String(),
			},
			Priority: "normal",
		})
		if err != nil {
			log.Printf("[Course-Service] WARNING: Failed to send review notification to instructor: %v", err)
		}
	}()

	return review, nil
}

// UpdateReview updates an existing review for a course
// Similar to Udemy/Coursera: User can edit their review (rating, title, comment) independently
func (s *CourseService) UpdateReview(userID, courseID uuid.UUID, req *models.UpdateReviewRequest) (*models.CourseReview, error) {
	// Check if user is enrolled
	enrollment, err := s.repo.GetEnrollment(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check enrollment: %w", err)
	}
	if enrollment == nil {
		return nil, fmt.Errorf("you must be enrolled in the course to update a review")
	}

	// Check if review exists
	existingReview, err := s.repo.GetUserReview(userID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing review: %w", err)
	}
	if existingReview == nil {
		return nil, fmt.Errorf("you haven't reviewed this course yet. Please create a review first")
	}

	// Note: Rating can remain unchanged if not provided in update request
	// This allows users to update only title or comment without changing rating

	// Update review
	review, err := s.repo.UpdateReview(userID, courseID, req)
	if err != nil {
		return nil, fmt.Errorf("failed to update review: %w", err)
	}

	return review, nil
}

// ============================================
// CATEGORIES
// ============================================

// GetAllCategories retrieves all course categories
func (s *CourseService) GetAllCategories() ([]models.CourseCategory, error) {
	return s.repo.GetAllCategories()
}

// GetCourseCategories retrieves categories for a specific course
func (s *CourseService) GetCourseCategories(courseID uuid.UUID) ([]models.CourseCategory, error) {
	return s.repo.GetCourseCategories(courseID)
}

// ============================================
// VIDEO TRACKING
// ============================================

// TrackVideoProgress records video watch progress
func (s *CourseService) TrackVideoProgress(userID uuid.UUID, req *models.TrackVideoProgressRequest) error {
	watchPercentage := float64(req.WatchedSeconds) / float64(req.TotalSeconds) * 100

	history := &models.VideoWatchHistory{
		UserID:          userID,
		VideoID:         req.VideoID,
		LessonID:        req.LessonID,
		WatchedSeconds:  req.WatchedSeconds,
		TotalSeconds:    req.TotalSeconds,
		WatchPercentage: watchPercentage,
		SessionID:       req.SessionID,
		DeviceType:      req.DeviceType,
	}

	return s.repo.CreateVideoWatchHistory(history)
}

// GetUserVideoWatchHistory retrieves user's video watch history
func (s *CourseService) GetUserVideoWatchHistory(userID uuid.UUID, page, limit int) ([]models.VideoWatchHistory, int, error) {
	// Validate pagination params
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return s.repo.GetUserVideoWatchHistory(userID, page, limit)
}

// ============================================
// MATERIALS
// ============================================

// IncrementMaterialDownload increments download count
func (s *CourseService) IncrementMaterialDownload(materialID uuid.UUID) error {
	return s.repo.IncrementMaterialDownload(materialID)
}

// ============================================
// SUBTITLES
// ============================================

// GetVideoSubtitles retrieves subtitles for a video
func (s *CourseService) GetVideoSubtitles(videoID uuid.UUID) ([]models.VideoSubtitle, error) {
	return s.repo.GetVideoSubtitles(videoID)
}

// ============================================
// VIDEO MANAGEMENT
// ============================================

// AddVideoToLesson adds a video to a lesson
func (s *CourseService) AddVideoToLesson(userID uuid.UUID, userRole string, lessonID uuid.UUID, req *models.AddVideoToLessonRequest) (*models.LessonVideo, error) {
	// Verify user has permission (admin or instructor who owns the course)
	lesson, err := s.repo.GetLessonByID(lessonID)
	if err != nil {
		return nil, fmt.Errorf("lesson not found: %v", err)
	}
	if lesson == nil {
		return nil, fmt.Errorf("lesson not found")
	}

	module, err := s.repo.GetModuleByID(lesson.ModuleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %v", err)
	}
	if module == nil {
		return nil, fmt.Errorf("module not found")
	}

	course, err := s.repo.GetCourseByID(module.CourseID)
	if err != nil {
		return nil, fmt.Errorf("course not found: %v", err)
	}
	if course == nil {
		return nil, fmt.Errorf("course not found")
	}

	// Check ownership
	if userRole != "admin" && course.InstructorID != userID {
		return nil, fmt.Errorf("unauthorized: you don't own this course")
	}

	// Get next display order
	displayOrder := 1
	if req.DisplayOrder != nil {
		displayOrder = *req.DisplayOrder
	} else {
		count, err := s.repo.GetLessonVideoCount(lessonID)
		if err == nil {
			displayOrder = count + 1
		}
	}

	video := &models.LessonVideo{
		LessonID:        lessonID,
		Title:           req.Title,
		VideoProvider:   req.VideoProvider,
		VideoID:         &req.VideoID,
		VideoURL:        req.VideoURL,
		DurationSeconds: 0,
		ThumbnailURL:    req.ThumbnailURL,
		DisplayOrder:    displayOrder,
	}

	if req.DurationSeconds != nil {
		video.DurationSeconds = *req.DurationSeconds
	}

	// Auto-fetch duration from YouTube API if provider is youtube and duration not provided
	if s.youtubeService != nil && req.VideoProvider == "youtube" && req.VideoID != "" && (req.DurationSeconds == nil || *req.DurationSeconds == 0) {
		log.Printf("[Course-Service] Auto-fetching YouTube video duration for video_id: %s", req.VideoID)

		duration, err := s.youtubeService.GetVideoDuration(req.VideoID)
		if err != nil {
			log.Printf("[Course-Service] WARNING: Failed to fetch YouTube duration: %v (continuing with 0)", err)
			// Continue anyway - duration can be updated later
		} else {
			video.DurationSeconds = int(duration)
			log.Printf("[Course-Service] ✅ Auto-fetched YouTube duration: %d seconds for video_id: %s", duration, req.VideoID)
		}
	}

	err = s.repo.CreateLessonVideo(video)
	if err != nil {
		return nil, fmt.Errorf("failed to create video: %v", err)
	}

	// Auto-sync lesson duration_minutes from video duration_seconds
	if video.DurationSeconds > 0 {
		durationMinutes := int(math.Ceil(float64(video.DurationSeconds) / 60.0))
		err = s.repo.UpdateLessonDuration(lessonID, durationMinutes)
		if err != nil {
			log.Printf("[Course-Service] WARNING: Failed to auto-sync lesson duration: %v", err)
		} else {
			log.Printf("[Course-Service] ✅ Auto-synced lesson duration: %d minutes (from %d seconds)", durationMinutes, video.DurationSeconds)
		}
	}

	return video, nil
}

// handleLessonCompletion handles service-to-service integration when a lesson is completed
// FIX #11: Added retry mechanism and better error handling
func (s *CourseService) handleLessonCompletion(userID, lessonID uuid.UUID, lesson *models.Lesson, progress *models.LessonProgress) {
	log.Printf("[Course-Service] Handling lesson completion for user %s, lesson %s", userID, lessonID)

	// Get course to determine skill type
	course, err := s.repo.GetCourseByID(lesson.CourseID)
	if err != nil {
		log.Printf("[Course-Service] ERROR: Failed to get course: %v", err)
		return
	}

	// Calculate study minutes from last_position_seconds (SOURCE OF TRUTH)
	studyMinutes := int(progress.LastPositionSeconds / 60)
	if studyMinutes == 0 && lesson.DurationMinutes != nil {
		studyMinutes = *lesson.DurationMinutes
	}

	// 1. Update user progress in User Service with retry
	log.Printf("[Course-Service] Updating user progress in User Service...")
	progressUpdateSuccess := false
	for attempt := 1; attempt <= 3; attempt++ {
		err = s.userServiceClient.UpdateProgress(client.UpdateProgressRequest{
			UserID:           userID.String(),
			LessonsCompleted: 1,
			StudyMinutes:     studyMinutes,
			SkillType:        course.SkillType,
			SessionType:      "lesson",
			ResourceID:       lessonID.String(),
		})
		if err == nil {
			log.Printf("[Course-Service] SUCCESS: Updated user progress (attempt %d)", attempt)
			progressUpdateSuccess = true
			break
		}
		log.Printf("[Course-Service] WARNING: Failed to update user progress (attempt %d/%d): %v", attempt, 3, err)
		if attempt < 3 {
			time.Sleep(time.Duration(attempt) * time.Second)
		}
	}

	// If all retries failed, log critical error
	if !progressUpdateSuccess {
		log.Printf("[Course-Service] CRITICAL ERROR: Failed to update user progress after 3 attempts for user %s, lesson %s", userID, lessonID)
		// TODO: Store in dead letter queue or manual reconciliation table
	}

	// 2. Send lesson completion notification with retry
	log.Printf("[Course-Service] Sending lesson completion notification...")

	// Get enrollment to calculate overall progress and check course completion
	enrollment, err := s.repo.GetEnrollment(userID, lesson.CourseID)
	overallProgress := 0
	isCourseCompleted := false
	if err == nil && enrollment != nil {
		overallProgress = int(enrollment.ProgressPercentage)
		isCourseCompleted = enrollment.Status == "completed" || enrollment.ProgressPercentage >= 100
	}

	notificationSuccess := false
	for attempt := 1; attempt <= 2; attempt++ {
		actionType := "navigate_to_lesson"
		err = s.notificationClient.SendNotification(client.SendNotificationRequest{
			UserID:     userID.String(),
			Title:      "Bạn đã hoàn thành bài học",
			Message:    fmt.Sprintf("Chúc mừng! Bạn đã hoàn thành bài học '%s'. Tiến độ khóa học hiện tại: %d%%.", lesson.Title, overallProgress),
			Type:       "course_update",
			Category:   "success",
			ActionType: &actionType,
			ActionData: map[string]interface{}{
				"course_id": lesson.CourseID.String(),
				"lesson_id": lessonID.String(),
			},
			Priority: "normal",
		})
		if err == nil {
			log.Printf("[Course-Service] SUCCESS: Sent lesson completion notification (attempt %d)", attempt)
			notificationSuccess = true
			break
		}
		log.Printf("[Course-Service] WARNING: Failed to send notification (attempt %d/%d): %v", attempt, 2, err)
		if attempt < 2 {
			time.Sleep(1 * time.Second)
		}
	}

	if !notificationSuccess {
		log.Printf("[Course-Service] ERROR: Failed to send notification after 2 attempts (non-critical)")
	}

	// 3. Check if course is completed and send completion notification
	if isCourseCompleted && enrollment.Status != "completed" {
		// Course just completed (first time reaching 100%)
		go func() {
			if err := s.notificationClient.SendCourseCompletionNotification(
				userID.String(),
				course.Title,
				course.ID.String(),
			); err != nil {
				log.Printf("[Course-Service] WARNING: Failed to send course completion notification: %v", err)
			} else {
				log.Printf("[Course-Service] ✅ Sent course completion notification for course %s", course.ID)
			}
		}()
	}
}

// SyncYouTubeVideoDuration syncs video duration from YouTube API
func (s *CourseService) SyncYouTubeVideoDuration(videoID string) error {
	youtubeService, err := NewYouTubeService()
	if err != nil {
		return fmt.Errorf("failed to initialize YouTube service: %w", err)
	}

	// Get video details from YouTube
	details, err := youtubeService.GetVideoDetails(videoID)
	if err != nil {
		return fmt.Errorf("failed to fetch YouTube video details: %w", err)
	}

	// Update lesson_videos table
	err = s.repo.UpdateVideoDuration(videoID, int(details.Duration))
	if err != nil {
		return fmt.Errorf("failed to update video duration: %w", err)
	}

	log.Printf("✅ Synced duration for video %s: %d seconds", videoID, details.Duration)
	return nil
}
