package routes

import (
	"github.com/bisosad1501/ielts-platform/course-service/internal/handlers"
	"github.com/bisosad1501/ielts-platform/course-service/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	handler *handlers.CourseHandler,
	authMiddleware *middleware.AuthMiddleware,
) {
	// Health check
	router.GET("/health", handler.HealthCheck)

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Public course endpoints (optional auth to check enrollment status)
		courses := v1.Group("/courses")
		courses.Use(authMiddleware.OptionalAuth())
		{
			courses.GET("", handler.GetCourses)                         // List courses with filters
			courses.GET("/:id", handler.GetCourseDetail)                // Get course detail
			courses.GET("/:id/reviews", handler.GetCourseReviews)       // Get course reviews
			courses.GET("/:id/categories", handler.GetCourseCategories) // Get course categories
		}

		// Protected course progress endpoint
		coursesProtected := v1.Group("/courses")
		coursesProtected.Use(authMiddleware.AuthRequired())
		{
			coursesProtected.GET("/:id/progress", handler.GetCourseProgress) // Get all lesson progress for course
		}

		// Public lesson endpoints
		lessons := v1.Group("/lessons")
		lessons.Use(authMiddleware.OptionalAuth())
		{
			lessons.GET("/:id", handler.GetLessonDetail) // Get lesson detail
		}

		// Public categories endpoint
		v1.GET("/categories", handler.GetCategories) // Get all categories

		// Protected review endpoints (student and instructor only)
		reviews := v1.Group("/courses/:id/reviews")
		reviews.Use(authMiddleware.AuthRequired())
		reviews.Use(authMiddleware.RequireRole("student", "instructor"))
		{
			reviews.POST("", handler.CreateReview) // Create course review
			reviews.PUT("", handler.UpdateReview)  // Update course review
		}

		// Protected video tracking endpoints (student and instructor only)
		videos := v1.Group("/videos")
		videos.Use(authMiddleware.AuthRequired())
		videos.Use(authMiddleware.RequireRole("student", "instructor"))
		{
			videos.POST("/track", handler.TrackVideoProgress)       // Track video watch progress
			videos.GET("/history", handler.GetVideoWatchHistory)    // Get watch history
			videos.GET("/:id/subtitles", handler.GetVideoSubtitles) // Get video subtitles
		}

		// Protected material endpoints (student and instructor only)
		materials := v1.Group("/materials")
		materials.Use(authMiddleware.AuthRequired())
		materials.Use(authMiddleware.RequireRole("student", "instructor"))
		{
			materials.POST("/:id/download", handler.DownloadMaterial) // Record material download
		}

		// Protected enrollment endpoints (student and instructor only, admin cannot enroll)
		enrollments := v1.Group("/enrollments")
		enrollments.Use(authMiddleware.AuthRequired())
		enrollments.Use(authMiddleware.RequireRole("student", "instructor"))
		{
			enrollments.POST("", handler.EnrollCourse)                      // Enroll in course
			enrollments.GET("/my", handler.GetMyEnrollments)                // Get my enrollments
			enrollments.GET("/:id/progress", handler.GetEnrollmentProgress) // Get enrollment progress
		}

		// Protected lesson progress endpoints (student and instructor only)
		progress := v1.Group("/progress")
		progress.Use(authMiddleware.AuthRequired())
		progress.Use(authMiddleware.RequireRole("student", "instructor"))
		{
			progress.GET("/lessons/:id", handler.GetLessonProgress)    // Get lesson progress (for resume watching)
			progress.PUT("/lessons/:id", handler.UpdateLessonProgress) // Update lesson progress
		}

		// Admin routes (protected - instructor and admin only)
		admin := v1.Group("/admin")
		admin.Use(authMiddleware.AuthRequired())
		{
			// Course management (instructor and admin)
			admin.POST("/courses", authMiddleware.RequireRole("instructor", "admin"), handler.CreateCourse)
			admin.PUT("/courses/:id", authMiddleware.RequireRole("instructor", "admin"), handler.UpdateCourse)
			admin.POST("/courses/:id/publish", authMiddleware.RequireRole("instructor", "admin"), handler.PublishCourse)

			// Course deletion (admin only)
			admin.DELETE("/courses/:id", authMiddleware.RequireRole("admin"), handler.DeleteCourse)

			// Module and lesson management (instructor and admin)
			admin.POST("/modules", authMiddleware.RequireRole("instructor", "admin"), handler.CreateModule)
			admin.POST("/lessons", authMiddleware.RequireRole("instructor", "admin"), handler.CreateLesson)

			// Video management (instructor and admin)
			admin.POST("/lessons/:lesson_id/videos", authMiddleware.RequireRole("instructor", "admin"), handler.AddVideoToLesson)

			// Video duration sync (admin only)
			admin.POST("/videos/sync-all", authMiddleware.RequireRole("admin"), handler.SyncAllVideoDurations)                      // Sync videos with missing duration
			admin.POST("/videos/force-resync-all", authMiddleware.RequireRole("admin"), handler.ForceResyncAllVideos)               // Force re-sync ALL videos
			admin.POST("/videos/:video_id/sync-duration", authMiddleware.RequireRole("admin"), handler.SyncSingleVideoDuration)     // Sync single video
			admin.POST("/lessons/:lesson_id/sync-durations", authMiddleware.RequireRole("admin"), handler.SyncLessonVideoDurations) // Sync lesson videos
		}
	}
}
