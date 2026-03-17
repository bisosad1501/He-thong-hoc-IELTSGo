package models

import (
	"time"

	"github.com/google/uuid"
)

// Course represents a course
type Course struct {
	ID               uuid.UUID  `json:"id"`
	Title            string     `json:"title"`
	Slug             string     `json:"slug"`
	Description      *string    `json:"description,omitempty"`
	ShortDescription *string    `json:"short_description,omitempty"`
	SkillType        string     `json:"skill_type"` // listening, reading, writing, speaking, general
	Level            string     `json:"level"`      // beginner, intermediate, advanced, etc.
	TargetBandScore  *float64   `json:"target_band_score,omitempty"`
	ThumbnailURL     *string    `json:"thumbnail_url,omitempty"`
	PreviewVideoURL  *string    `json:"preview_video_url,omitempty"`
	InstructorID     uuid.UUID  `json:"instructor_id"`
	InstructorName   *string    `json:"instructor_name,omitempty"`
	DurationHours    *float64   `json:"duration_hours,omitempty"`
	TotalLessons     int        `json:"total_lessons"`
	TotalVideos      int        `json:"total_videos"`
	EnrollmentType   string     `json:"enrollment_type"` // free, premium, subscription
	Price            float64    `json:"price"`
	Currency         string     `json:"currency"`
	Status           string     `json:"status"` // draft, published, archived
	IsFeatured       bool       `json:"is_featured"`
	IsRecommended    bool       `json:"is_recommended"`
	TotalEnrollments int        `json:"total_enrollments"`
	AverageRating    float64    `json:"average_rating"`
	TotalReviews     int        `json:"total_reviews"`
	DisplayOrder     int        `json:"display_order"`
	PublishedAt      *time.Time `json:"published_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// Module represents a course module/section
type Module struct {
	ID             uuid.UUID `json:"id"`
	CourseID       uuid.UUID `json:"course_id"`
	Title          string    `json:"title"`
	Description    *string   `json:"description,omitempty"`
	DurationHours  *float64  `json:"duration_hours,omitempty"`
	TotalLessons   int       `json:"total_lessons"`
	TotalExercises int       `json:"total_exercises"`
	DisplayOrder   int       `json:"display_order"`
	IsPublished    bool      `json:"is_published"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Lesson represents a lesson within a module
type Lesson struct {
	ID               uuid.UUID `json:"id"`
	ModuleID         uuid.UUID `json:"module_id"`
	CourseID         uuid.UUID `json:"course_id"`
	Title            string    `json:"title"`
	Description      *string   `json:"description,omitempty"`
	ContentType      string    `json:"content_type"` // video, text, quiz, exercise
	DurationMinutes  *int      `json:"duration_minutes,omitempty"`
	DisplayOrder     int       `json:"display_order"`
	IsFree           bool      `json:"is_free"`
	IsPublished      bool      `json:"is_published"`
	TotalCompletions int       `json:"total_completions"`
	AverageTimeSpent *int      `json:"average_time_spent,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// LessonVideo represents video content for a lesson
type LessonVideo struct {
	ID              uuid.UUID `json:"id"`
	LessonID        uuid.UUID `json:"lesson_id"`
	Title           string    `json:"title"`
	VideoURL        string    `json:"video_url"`
	VideoProvider   string    `json:"video_provider"` // youtube, vimeo, bunny, etc.
	VideoID         *string   `json:"video_id,omitempty"`
	DurationSeconds int       `json:"duration_seconds"`
	Quality         string    `json:"quality"`
	ThumbnailURL    *string   `json:"thumbnail_url,omitempty"`
	DisplayOrder    int       `json:"display_order"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// LessonMaterial represents downloadable materials
type LessonMaterial struct {
	ID             uuid.UUID `json:"id"`
	LessonID       uuid.UUID `json:"lesson_id"`
	Title          string    `json:"title"`
	Description    *string   `json:"description,omitempty"`
	FileType       string    `json:"file_type"` // pdf, doc, ppt, zip
	FileURL        string    `json:"file_url"`
	FileSizeBytes  *int64    `json:"file_size_bytes,omitempty"`
	DisplayOrder   int       `json:"display_order"`
	TotalDownloads int       `json:"total_downloads"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// CourseEnrollment represents user enrollment in a course
type CourseEnrollment struct {
	ID                    uuid.UUID  `json:"id"`
	UserID                uuid.UUID  `json:"user_id"`
	CourseID              uuid.UUID  `json:"course_id"`
	EnrollmentDate        time.Time  `json:"enrollment_date"`
	EnrollmentType        string     `json:"enrollment_type"` // free, purchased, gifted
	PaymentID             *uuid.UUID `json:"payment_id,omitempty"`
	AmountPaid            *float64   `json:"amount_paid,omitempty"`
	Currency              *string    `json:"currency,omitempty"`
	ProgressPercentage    float64    `json:"progress_percentage"`
	LessonsCompleted      int        `json:"lessons_completed"`
	TotalTimeSpentMinutes int        `json:"total_time_spent_minutes"`
	Status                string     `json:"status"` // active, completed, dropped, expired
	CompletedAt           *time.Time `json:"completed_at,omitempty"`
	CertificateIssued     bool       `json:"certificate_issued"`
	CertificateURL        *string    `json:"certificate_url,omitempty"`
	ExpiresAt             *time.Time `json:"expires_at,omitempty"`
	LastAccessedAt        *time.Time `json:"last_accessed_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

// LessonProgress tracks user progress for lessons
type LessonProgress struct {
	ID                  uuid.UUID  `json:"id"`
	UserID              uuid.UUID  `json:"user_id"`
	LessonID            uuid.UUID  `json:"lesson_id"`
	CourseID            uuid.UUID  `json:"course_id"`
	Status              string     `json:"status"` // not_started, in_progress, completed
	ProgressPercentage  float64    `json:"progress_percentage"`
	VideoWatchedSeconds int        `json:"video_watched_seconds"`
	VideoTotalSeconds   *int       `json:"video_total_seconds,omitempty"`
	LastPositionSeconds int        `json:"last_position_seconds"` // For resume watching & time calculation
	CompletedAt         *time.Time `json:"completed_at,omitempty"`
	FirstAccessedAt     time.Time  `json:"first_accessed_at"`
	LastAccessedAt      time.Time  `json:"last_accessed_at"`
}

// CourseReview represents a course review
type CourseReview struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	CourseID     uuid.UUID  `json:"course_id"`
	Rating       int        `json:"rating"` // 1-5
	Title        *string    `json:"title,omitempty"`
	Comment      *string    `json:"comment,omitempty"`
	HelpfulCount int        `json:"helpful_count"`
	IsApproved   bool       `json:"is_approved"`
	ApprovedBy   *uuid.UUID `json:"approved_by,omitempty"`
	ApprovedAt   *time.Time `json:"approved_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	// User info (from JOIN)
	UserName      *string `json:"user_name,omitempty"`
	UserEmail     *string `json:"user_email,omitempty"`
	UserAvatarURL *string `json:"user_avatar_url,omitempty"`
}

// VideoSubtitle represents subtitle files for videos
type VideoSubtitle struct {
	ID          uuid.UUID `json:"id"`
	VideoID     uuid.UUID `json:"video_id"`
	Language    string    `json:"language"` // vi, en
	SubtitleURL string    `json:"subtitle_url"`
	Format      string    `json:"format"` // vtt, srt
	IsDefault   bool      `json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
}

// VideoWatchHistory represents detailed video watching history
type VideoWatchHistory struct {
	ID              uuid.UUID  `json:"id"`
	UserID          uuid.UUID  `json:"user_id"`
	VideoID         uuid.UUID  `json:"video_id"`
	LessonID        uuid.UUID  `json:"lesson_id"`
	WatchedSeconds  int        `json:"watched_seconds"`
	TotalSeconds    int        `json:"total_seconds"`
	WatchPercentage float64    `json:"watch_percentage"`
	SessionID       *uuid.UUID `json:"session_id,omitempty"`
	DeviceType      *string    `json:"device_type,omitempty"` // web, android, ios
	WatchedAt       time.Time  `json:"watched_at"`
}

// CourseCategory represents categories/tags for courses
type CourseCategory struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  *string   `json:"description,omitempty"`
	ParentID     *int      `json:"parent_id,omitempty"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
}

// CourseCategoryMapping represents many-to-many relationship between courses and categories
type CourseCategoryMapping struct {
	CourseID   uuid.UUID `json:"course_id"`
	CategoryID int       `json:"category_id"`
}
