package models

import "github.com/google/uuid"

// CreateCourseRequest represents course creation request
type CreateCourseRequest struct {
	Title            string   `json:"title" binding:"required"`
	Slug             string   `json:"slug" binding:"required"`
	Description      *string  `json:"description"`
	ShortDescription *string  `json:"short_description"`
	SkillType        string   `json:"skill_type" binding:"required"` // listening, reading, writing, speaking, general
	Level            string   `json:"level" binding:"required"`      // beginner, intermediate, advanced
	TargetBandScore  *float64 `json:"target_band_score"`
	ThumbnailURL     *string  `json:"thumbnail_url"`
	PreviewVideoURL  *string  `json:"preview_video_url"`
	DurationHours    *float64 `json:"duration_hours"`
	EnrollmentType   string   `json:"enrollment_type"` // free, premium
	Price            float64  `json:"price"`
	Currency         string   `json:"currency"`
}

// UpdateCourseRequest represents course update request
type UpdateCourseRequest struct {
	Title            *string  `json:"title"`
	Description      *string  `json:"description"`
	ShortDescription *string  `json:"short_description"`
	TargetBandScore  *float64 `json:"target_band_score"`
	ThumbnailURL     *string  `json:"thumbnail_url"`
	PreviewVideoURL  *string  `json:"preview_video_url"`
	DurationHours    *float64 `json:"duration_hours"`
	Price            *float64 `json:"price"`
	Status           *string  `json:"status"` // draft, published, archived
	IsFeatured       *bool    `json:"is_featured"`
	IsRecommended    *bool    `json:"is_recommended"`
}

// CreateModuleRequest represents module creation request
type CreateModuleRequest struct {
	CourseID      uuid.UUID `json:"course_id" binding:"required"`
	Title         string    `json:"title" binding:"required"`
	Description   *string   `json:"description"`
	DurationHours *float64  `json:"duration_hours"`
	DisplayOrder  int       `json:"display_order"`
}

// CreateLessonRequest represents lesson creation request
type CreateLessonRequest struct {
	ModuleID        uuid.UUID `json:"module_id" binding:"required"`
	Title           string    `json:"title" binding:"required"`
	Description     *string   `json:"description"`
	ContentType     string    `json:"content_type" binding:"required"` // video, article, quiz, exercise
	DurationMinutes *int      `json:"duration_minutes"`
	DisplayOrder    int       `json:"display_order"`
	IsFree          bool      `json:"is_free"`
}

// CourseListQuery represents query parameters for listing courses
type CourseListQuery struct {
	SkillType      string `form:"skill_type"`      // listening, reading, writing, speaking, general
	Level          string `form:"level"`           // beginner, intermediate, advanced
	EnrollmentType string `form:"enrollment_type"` // free, premium
	Status         string `form:"status"`          // draft, published, archived
	IsFeatured     *bool  `form:"is_featured"`
	Search         string `form:"search"` // Search in title, description, instructor_name
	Page           int    `form:"page"`
	Limit          int    `form:"limit"`
	SortBy         string `form:"sort_by"`    // newest, popular, title, rating
	SortOrder      string `form:"sort_order"` // asc, desc
}

// CourseDetailResponse represents detailed course with modules and lessons
type CourseDetailResponse struct {
	Course               Course              `json:"course"`
	Modules              []ModuleWithLessons `json:"modules"`
	CourseLevelExercises []ExerciseSummary   `json:"course_level_exercises,omitempty"` // NEW: Course-level exercises (not tied to specific module)
	IsEnrolled           bool                `json:"is_enrolled"`
	EnrollmentDetails    *CourseEnrollment   `json:"enrollment_details,omitempty"`
}

// ModuleWithLessons represents a module with its lessons and exercises
type ModuleWithLessons struct {
	Module    Module             `json:"module"`
	Lessons   []LessonWithVideos `json:"lessons"`
	Exercises []ExerciseSummary  `json:"exercises"`
}

// ExerciseSummary represents a summary of an exercise (from Exercise Service)
type ExerciseSummary struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Slug           string    `json:"slug"`
	Description    *string   `json:"description,omitempty"`
	ExerciseType   string    `json:"exercise_type"`
	SkillType      string    `json:"skill_type"`
	Difficulty     string    `json:"difficulty"`
	TotalQuestions int       `json:"total_questions"`
	TotalSections  int       `json:"total_sections"`
	TimeLimitMins  *int      `json:"time_limit_minutes,omitempty"`
	PassingScore   *float64  `json:"passing_score,omitempty"`
	DisplayOrder   int       `json:"display_order"`
}

// LessonWithVideos represents a lesson with its video information
type LessonWithVideos struct {
	Lesson
	Videos []LessonVideo `json:"videos,omitempty"`
}

// EnrollmentRequest represents enrollment request
type EnrollmentRequest struct {
	CourseID       uuid.UUID `json:"course_id" binding:"required"`
	EnrollmentType string    `json:"enrollment_type"` // free, purchased
}

// UpdateLessonProgressRequest represents lesson progress update
type UpdateLessonProgressRequest struct {
	ProgressPercentage  *float64 `json:"progress_percentage,omitempty"`
	VideoWatchedSeconds *int     `json:"video_watched_seconds,omitempty"`
	VideoTotalSeconds   *int     `json:"video_total_seconds,omitempty"`
	TimeSpentMinutes    *int     `json:"time_spent_minutes,omitempty"`
	LastPositionSeconds *int     `json:"last_position_seconds,omitempty"` // For resume watching
	IsCompleted         *bool    `json:"is_completed,omitempty"`
}

// MyEnrollmentsResponse represents user's enrollments
type MyEnrollmentsResponse struct {
	Enrollments []EnrollmentWithCourse `json:"enrollments"`
	Total       int                    `json:"total"`
}

// CourseReviewsResponse represents paginated course reviews
type CourseReviewsResponse struct {
	Reviews    []CourseReview `json:"reviews"`
	Total      int            `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

// VideoWatchHistoryResponse represents paginated video watch history
type VideoWatchHistoryResponse struct {
	History    []VideoWatchHistory `json:"history"`
	Total      int                 `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}

// EnrollmentWithCourse represents enrollment with course details
type EnrollmentWithCourse struct {
	Enrollment CourseEnrollment `json:"enrollment"`
	Course     Course           `json:"course"`
}

// LessonDetailResponse represents detailed lesson with materials
type LessonDetailResponse struct {
	Lesson    Lesson           `json:"lesson"`
	Videos    []LessonVideo    `json:"videos"`
	Materials []LessonMaterial `json:"materials"`
	Progress  *LessonProgress  `json:"progress,omitempty"`
}

// EnrollmentProgressResponse represents enrollment progress details
type EnrollmentProgressResponse struct {
	Enrollment      CourseEnrollment     `json:"enrollment"`
	Course          Course               `json:"course"`
	ModulesProgress []ModuleProgress     `json:"modules_progress"`
	RecentLessons   []LessonWithProgress `json:"recent_lessons"`
}

// ModuleProgress represents module completion stats
type ModuleProgress struct {
	Module             Module  `json:"module"`
	TotalLessons       int     `json:"total_lessons"`
	CompletedLessons   int     `json:"completed_lessons"`
	ProgressPercentage float64 `json:"progress_percentage"`
}

// LessonWithProgress represents lesson with progress
type LessonWithProgress struct {
	Lesson   Lesson         `json:"lesson"`
	Progress LessonProgress `json:"progress"`
}

// CreateReviewRequest represents course review creation request
type CreateReviewRequest struct {
	Rating  int     `json:"rating" binding:"required,min=1,max=5"`
	Title   *string `json:"title"`
	Comment *string `json:"comment"`
}

// UpdateReviewRequest represents course review update request
// All fields are optional - user can update rating, title, or comment independently
type UpdateReviewRequest struct {
	Rating  *int    `json:"rating" binding:"omitempty,min=1,max=5"`
	Title   *string `json:"title"`
	Comment *string `json:"comment"`
}

// TrackVideoProgressRequest represents video watch progress tracking
type TrackVideoProgressRequest struct {
	VideoID        uuid.UUID  `json:"video_id" binding:"required"`
	LessonID       uuid.UUID  `json:"lesson_id" binding:"required"`
	WatchedSeconds int        `json:"watched_seconds" binding:"required"`
	TotalSeconds   int        `json:"total_seconds" binding:"required"`
	SessionID      *uuid.UUID `json:"session_id"`
	DeviceType     *string    `json:"device_type"` // web, android, ios
}

// AddVideoToLessonRequest represents adding video to a lesson
type AddVideoToLessonRequest struct {
	Title           string  `json:"title" binding:"required"`
	VideoProvider   string  `json:"video_provider" binding:"required"` // youtube, bunny, vimeo, self-hosted
	VideoID         string  `json:"video_id" binding:"required"`       // YouTube video ID or Bunny video library ID
	VideoURL        string  `json:"video_url" binding:"required"`      // Full video URL
	DurationSeconds *int    `json:"duration_seconds"`                  // Video duration in seconds
	ThumbnailURL    *string `json:"thumbnail_url"`                     // Video thumbnail URL
	Quality         *string `json:"quality"`                           // 720p, 1080p, 4k, etc.
	FileSize        *int64  `json:"file_size"`                         // File size in bytes
	DisplayOrder    *int    `json:"display_order"`                     // Order in lesson
}
