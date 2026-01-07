package routes

import (
	"net/http"

	"github.com/bisosad1501/ielts-platform/api-gateway/internal/config"
	"github.com/bisosad1501/ielts-platform/api-gateway/internal/middleware"
	"github.com/bisosad1501/ielts-platform/api-gateway/internal/proxy"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, cfg *config.Config, authMiddleware *middleware.AuthMiddleware) {
	// Health check for gateway itself
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "api-gateway",
			"version": "1.0.0",
		})
	})

	// Gateway info endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "IELTS Platform API Gateway",
			"version": "1.0.0",
			"status":  "running",
			"endpoints": gin.H{
				"health":        "/health",
				"auth":          "/api/v1/auth/* (login, register, OAuth, password reset)",
				"user":          "/api/v1/user/* (profile, progress, goals, reminders, leaderboard)",
				"courses":       "/api/v1/courses/* (browse, enroll, reviews, videos, materials)",
				"categories":    "/api/v1/categories (course categories)",
				"lessons":       "/api/v1/lessons/* (lesson details)",
				"enrollments":   "/api/v1/enrollments/* (enrollment management)",
				"progress":      "/api/v1/progress/* (lesson progress tracking)",
				"videos":        "/api/v1/videos/* (video tracking, subtitles)",
				"materials":     "/api/v1/materials/* (material downloads)",
				"exercises":     "/api/v1/exercises/* (browse, start exercises)",
				"submissions":   "/api/v1/submissions/* (submit answers, get results)",
				"tags":          "/api/v1/tags (exercise tags)",
				"notifications": "/api/v1/notifications/* (notifications, preferences, timezone, scheduled)",
				"ai":            "/api/v1/ai/* (writing/speaking evaluation)",
				"admin":         "/api/v1/admin/* (course/exercise/notification management)",
			},
			"documentation": "See README.md for detailed API documentation",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")

	// ============================================
	// AUTH SERVICE - No auth required (public routes)
	// ============================================
	authGroup := v1.Group("/auth")
	{
		// Public auth endpoints (no token required)
		authGroup.POST("/register", proxy.ReverseProxy(cfg.Services.AuthService))
		authGroup.POST("/login", proxy.ReverseProxy(cfg.Services.AuthService))
		authGroup.POST("/refresh", proxy.ReverseProxy(cfg.Services.AuthService))
		authGroup.POST("/logout", proxy.ReverseProxy(cfg.Services.AuthService))

		// Email verification
		authGroup.GET("/verify-email", proxy.ReverseProxy(cfg.Services.AuthService))          // Legacy token-based verification
		authGroup.POST("/verify-email-by-code", proxy.ReverseProxy(cfg.Services.AuthService)) // New 6-digit code verification
		authGroup.POST("/resend-verification", proxy.ReverseProxy(cfg.Services.AuthService))

		// Password reset
		authGroup.POST("/forgot-password", proxy.ReverseProxy(cfg.Services.AuthService))        // Request reset (sends 6-digit code)
		authGroup.POST("/reset-password", proxy.ReverseProxy(cfg.Services.AuthService))         // Legacy token-based reset
		authGroup.POST("/reset-password-by-code", proxy.ReverseProxy(cfg.Services.AuthService)) // New 6-digit code reset

		// Google OAuth
		authGroup.GET("/google/url", proxy.ReverseProxy(cfg.Services.AuthService))      // Get OAuth URL (Mobile/Web)
		authGroup.GET("/google", proxy.ReverseProxy(cfg.Services.AuthService))          // Web flow: Redirect to Google
		authGroup.GET("/google/callback", proxy.ReverseProxy(cfg.Services.AuthService)) // Web flow: Handle callback
		authGroup.POST("/google/token", proxy.ReverseProxy(cfg.Services.AuthService))   // Mobile flow: Exchange code

		// Protected auth endpoints (require token)
		authProtected := authGroup.Group("")
		authProtected.Use(authMiddleware.ValidateToken())
		{
			authProtected.GET("/validate", proxy.ReverseProxy(cfg.Services.AuthService))
			authProtected.POST("/change-password", proxy.ReverseProxy(cfg.Services.AuthService))
			authProtected.GET("/me", proxy.ReverseProxy(cfg.Services.AuthService))
		}
	}

	// ============================================
	// USER SERVICE - Most require auth
	// ============================================
	// Public user profile route (optional auth)
	usersGroup := v1.Group("/users")
	usersGroup.Use(authMiddleware.OptionalAuth()) // Optional auth for visibility check
	{
		usersGroup.GET("/:id/profile", proxy.ReverseProxy(cfg.Services.UserService))
		usersGroup.GET("/:id/achievements", proxy.ReverseProxy(cfg.Services.UserService))
		usersGroup.GET("/:id/followers", proxy.ReverseProxy(cfg.Services.UserService))
		usersGroup.GET("/:id/following", proxy.ReverseProxy(cfg.Services.UserService))
	}

	// Protected social routes (auth required)
	usersProtected := v1.Group("/users")
	usersProtected.Use(authMiddleware.ValidateToken())
	{
		usersProtected.POST("/:id/follow", proxy.ReverseProxy(cfg.Services.UserService))
		usersProtected.DELETE("/:id/follow", proxy.ReverseProxy(cfg.Services.UserService))
	}

	userGroup := v1.Group("/user")
	userGroup.Use(authMiddleware.ValidateToken())
	{
		userGroup.GET("/profile", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.PUT("/profile", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.POST("/profile/avatar", proxy.ReverseProxy(cfg.Services.UserService))
		// Remove follower (user removes someone from their followers list)
		userGroup.DELETE("/followers/:id", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/progress", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/progress/history", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/statistics", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/statistics/:skill", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/achievements", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/achievements/earned", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/preferences", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.PUT("/preferences", proxy.ReverseProxy(cfg.Services.UserService))

		// Study sessions
		userGroup.POST("/sessions", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.POST("/sessions/:id/end", proxy.ReverseProxy(cfg.Services.UserService))

		// Study goals
		userGroup.POST("/goals", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/goals", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/goals/:id", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.PUT("/goals/:id", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.POST("/goals/:id/complete", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.DELETE("/goals/:id", proxy.ReverseProxy(cfg.Services.UserService))

		// Study reminders
		userGroup.POST("/reminders", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/reminders", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.PUT("/reminders/:id", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.DELETE("/reminders/:id", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.PUT("/reminders/:id/toggle", proxy.ReverseProxy(cfg.Services.UserService))

		// Leaderboard
		userGroup.GET("/leaderboard", proxy.ReverseProxy(cfg.Services.UserService))
		userGroup.GET("/leaderboard/rank", proxy.ReverseProxy(cfg.Services.UserService))
	}

	// ============================================
	// COURSE SERVICE - Mixed auth (some public, some protected)
	// ============================================
	courseGroup := v1.Group("/courses")
	{
		// Public endpoints (browsing courses)
		courseGroup.GET("", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.CourseService))
		courseGroup.GET("/:id", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.CourseService))
		courseGroup.GET("/:id/reviews", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.CourseService))    // Get course reviews
		courseGroup.GET("/:id/categories", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.CourseService)) // Get course categories

		// Protected review endpoints
		courseProtected := courseGroup.Group("")
		courseProtected.Use(authMiddleware.ValidateToken())
		{
			courseProtected.POST("/:id/enroll", proxy.ReverseProxy(cfg.Services.CourseService))
			courseProtected.GET("/my-courses", proxy.ReverseProxy(cfg.Services.CourseService))
			courseProtected.GET("/:id/progress", proxy.ReverseProxy(cfg.Services.CourseService))
			courseProtected.POST("/:id/reviews", proxy.ReverseProxy(cfg.Services.CourseService)) // Create course review
			courseProtected.PUT("/:id/reviews", proxy.ReverseProxy(cfg.Services.CourseService))  // Update course review
		}
	}

	// Categories (public)
	v1.GET("/categories", proxy.ReverseProxy(cfg.Services.CourseService))

	// Lessons endpoints (from Course Service)
	lessonGroup := v1.Group("/lessons")
	{
		lessonGroup.GET("/:id", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.CourseService))
	}

	// Video endpoints (protected)
	videoGroup := v1.Group("/videos")
	videoGroup.Use(authMiddleware.ValidateToken())
	{
		videoGroup.POST("/track", proxy.ReverseProxy(cfg.Services.CourseService))        // Track video watch progress
		videoGroup.GET("/history", proxy.ReverseProxy(cfg.Services.CourseService))       // Get watch history
		videoGroup.GET("/:id/subtitles", proxy.ReverseProxy(cfg.Services.CourseService)) // Get video subtitles
	}

	// Materials endpoints (protected)
	materialGroup := v1.Group("/materials")
	materialGroup.Use(authMiddleware.ValidateToken())
	{
		materialGroup.POST("/:id/download", proxy.ReverseProxy(cfg.Services.CourseService)) // Record material download
	}

	// Enrollments endpoints (from Course Service)
	enrollmentGroup := v1.Group("/enrollments")
	enrollmentGroup.Use(authMiddleware.ValidateToken())
	{
		enrollmentGroup.POST("", proxy.ReverseProxy(cfg.Services.CourseService))
		enrollmentGroup.GET("/my", proxy.ReverseProxy(cfg.Services.CourseService))
		enrollmentGroup.GET("/:id/progress", proxy.ReverseProxy(cfg.Services.CourseService))
	}

	// Progress endpoints (from Course Service)
	progressGroup := v1.Group("/progress")
	progressGroup.Use(authMiddleware.ValidateToken())
	{
		progressGroup.GET("/lessons/:id", proxy.ReverseProxy(cfg.Services.CourseService)) // Get lesson progress (for resume watching)
		progressGroup.PUT("/lessons/:id", proxy.ReverseProxy(cfg.Services.CourseService)) // Update lesson progress
	}

	// ============================================
	// EXERCISE SERVICE - Mixed auth
	// ============================================
	exerciseGroup := v1.Group("/exercises")
	{
		// Public browsing
		exerciseGroup.GET("", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.ExerciseService))
		exerciseGroup.GET("/:id", authMiddleware.OptionalAuth(), proxy.ReverseProxy(cfg.Services.ExerciseService))
		exerciseGroup.GET("/:id/tags", proxy.ReverseProxy(cfg.Services.ExerciseService)) // Get exercise tags

		// Protected (requires login)
		exerciseProtected := exerciseGroup.Group("")
		exerciseProtected.Use(authMiddleware.ValidateToken())
		{
			exerciseProtected.POST("/:id/start", proxy.ReverseProxy(cfg.Services.ExerciseService))
		}
	}

	// Tags (public)
	tagsGroup := v1.Group("/tags")
	{
		tagsGroup.GET("", proxy.ReverseProxy(cfg.Services.ExerciseService)) // Get all tags
	}

	// Submissions (all protected)
	submissionGroup := v1.Group("/submissions")
	submissionGroup.Use(authMiddleware.ValidateToken())
	{
		submissionGroup.POST("", proxy.ReverseProxy(cfg.Services.ExerciseService))            // Start new submission
		submissionGroup.POST("/:id/submit", proxy.ReverseProxy(cfg.Services.ExerciseService)) // Unified submission (Phase 4)
		submissionGroup.PUT("/:id/answers", proxy.ReverseProxy(cfg.Services.ExerciseService)) // Deprecated, use /submit
		submissionGroup.GET("/:id/result", proxy.ReverseProxy(cfg.Services.ExerciseService))
		submissionGroup.GET("/my", proxy.ReverseProxy(cfg.Services.ExerciseService))
		submissionGroup.GET("", proxy.ReverseProxy(cfg.Services.ExerciseService)) // List my submissions (duplicate of /my)
	}

	// ============================================
	// STORAGE SERVICE
	// ============================================
	storageGroup := v1.Group("/storage")
	{
		audio := storageGroup.Group("/audio")
		{
			// Protected routes (require auth)
			audio.POST("/upload", authMiddleware.ValidateToken(), proxy.ReverseProxy(cfg.Services.ExerciseService))                   // Upload audio (proxy to Storage Service)
			audio.GET("/info/*object_name", authMiddleware.ValidateToken(), proxy.ReverseProxy(cfg.Services.ExerciseService))         // Get audio info
			audio.GET("/presigned-url/*object_name", authMiddleware.ValidateToken(), proxy.ReverseProxy(cfg.Services.StorageService)) // Get presigned URL (direct to Storage Service)

			// Public route (no auth required) - for HTML5 audio player
			// NOTE: This is safe because audio files are already protected during upload
			// Only users who own the submission can get the audio URL
			audio.GET("/file/*object_name", proxy.ReverseProxy(cfg.Services.StorageService))
		}
	}

	// ============================================
	// NOTIFICATION SERVICE - All protected
	// ============================================
	notificationGroup := v1.Group("/notifications")
	notificationGroup.Use(authMiddleware.ValidateToken())
	{
		// SSE stream (must be before /:id to avoid route conflict)
		notificationGroup.GET("/stream", proxy.ReverseProxy(cfg.Services.NotificationService))

		notificationGroup.GET("", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.GET("/unread-count", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.GET("/:id", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.PUT("/:id/read", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.PUT("/mark-all-read", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.DELETE("/:id", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.POST("/devices", proxy.ReverseProxy(cfg.Services.NotificationService))

		// Preferences (including timezone)
		notificationGroup.GET("/preferences", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.PUT("/preferences", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.GET("/preferences/timezone", proxy.ReverseProxy(cfg.Services.NotificationService)) // Get timezone
		notificationGroup.PUT("/preferences/timezone", proxy.ReverseProxy(cfg.Services.NotificationService)) // Update timezone

		// Scheduled notifications
		notificationGroup.POST("/scheduled", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.GET("/scheduled", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.GET("/scheduled/:id", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.PUT("/scheduled/:id", proxy.ReverseProxy(cfg.Services.NotificationService))
		notificationGroup.DELETE("/scheduled/:id", proxy.ReverseProxy(cfg.Services.NotificationService))
	}

	// Internal notification routes (service-to-service communication)
	notificationInternal := v1.Group("/notifications/internal")
	// TODO: Add internal auth middleware for service-to-service calls
	{
		notificationInternal.POST("/send", proxy.ReverseProxy(cfg.Services.NotificationService)) // Send notification from another service
		notificationInternal.POST("/bulk", proxy.ReverseProxy(cfg.Services.NotificationService)) // Send bulk notifications
	}

	// ============================================
	// ADMIN ROUTES - Require admin/instructor role
	// ============================================
	adminGroup := v1.Group("/admin")
	adminGroup.Use(authMiddleware.ValidateToken())
	adminGroup.Use(authMiddleware.RequireRole("instructor", "admin"))
	{
		// Course management
		adminGroup.POST("/courses", proxy.ReverseProxy(cfg.Services.CourseService))
		adminGroup.PUT("/courses/:id", proxy.ReverseProxy(cfg.Services.CourseService))
		adminGroup.DELETE("/courses/:id", proxy.ReverseProxy(cfg.Services.CourseService))
		adminGroup.POST("/courses/:id/publish", proxy.ReverseProxy(cfg.Services.CourseService))

		// Module and lesson management
		adminGroup.POST("/modules", proxy.ReverseProxy(cfg.Services.CourseService))
		adminGroup.POST("/lessons", proxy.ReverseProxy(cfg.Services.CourseService))

		// Video management
		adminGroup.POST("/lessons/:lesson_id/videos", proxy.ReverseProxy(cfg.Services.CourseService))

		// Exercise management
		adminGroup.POST("/exercises", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.PUT("/exercises/:id", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.DELETE("/exercises/:id", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/exercises/:id/publish", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/exercises/:id/unpublish", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/exercises/:id/sections", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.GET("/exercises/:id/analytics", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/exercises/:id/tags", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.DELETE("/exercises/:id/tags/:tag_id", proxy.ReverseProxy(cfg.Services.ExerciseService))

		// Question management
		adminGroup.POST("/questions", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/questions/:id/options", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/questions/:id/answer", proxy.ReverseProxy(cfg.Services.ExerciseService))

		// Question Bank management
		adminGroup.GET("/question-bank", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.POST("/question-bank", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.PUT("/question-bank/:id", proxy.ReverseProxy(cfg.Services.ExerciseService))
		adminGroup.DELETE("/question-bank/:id", proxy.ReverseProxy(cfg.Services.ExerciseService))

		// Tag management
		adminGroup.POST("/tags", proxy.ReverseProxy(cfg.Services.ExerciseService))

		// Notification management
		adminGroup.POST("/notifications", proxy.ReverseProxy(cfg.Services.NotificationService))
		adminGroup.POST("/notifications/bulk", proxy.ReverseProxy(cfg.Services.NotificationService))

		// Admin statistics (user-service)
		adminGroup.GET("/stats/dashboard", proxy.ReverseProxy(cfg.Services.UserService))
		adminGroup.GET("/stats/user-growth", proxy.ReverseProxy(cfg.Services.UserService))
		adminGroup.GET("/stats/enrollments", proxy.ReverseProxy(cfg.Services.UserService))
		adminGroup.GET("/stats/activities", proxy.ReverseProxy(cfg.Services.UserService))
	}

	// ============================================
	// AI SERVICE - Protected (auth required)
	// ============================================
	aiGroup := v1.Group("/ai")
	aiGroup.Use(authMiddleware.ValidateToken())
	{
		// Writing endpoints
		aiGroup.POST("/writing/submit", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/writing/submissions", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/writing/submissions/:id", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/writing/prompts", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/writing/prompts/:id", proxy.ReverseProxy(cfg.Services.AIService))

		// Speaking endpoints
		aiGroup.POST("/speaking/submit", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/speaking/submissions", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/speaking/submissions/:id", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/speaking/prompts", proxy.ReverseProxy(cfg.Services.AIService))
		aiGroup.GET("/speaking/prompts/:id", proxy.ReverseProxy(cfg.Services.AIService))
	}

	// ============================================
	// ADMIN AI ROUTES - Require admin role
	// ============================================
	adminAIGroup := v1.Group("/admin/ai")
	adminAIGroup.Use(authMiddleware.ValidateToken())
	adminAIGroup.Use(authMiddleware.RequireRole("admin"))
	{
		// Writing prompts management
		adminAIGroup.POST("/writing/prompts", proxy.ReverseProxy(cfg.Services.AIService))
		adminAIGroup.PUT("/writing/prompts/:id", proxy.ReverseProxy(cfg.Services.AIService))
		adminAIGroup.DELETE("/writing/prompts/:id", proxy.ReverseProxy(cfg.Services.AIService))

		// Speaking prompts management
		adminAIGroup.POST("/speaking/prompts", proxy.ReverseProxy(cfg.Services.AIService))
		adminAIGroup.PUT("/speaking/prompts/:id", proxy.ReverseProxy(cfg.Services.AIService))
		adminAIGroup.DELETE("/speaking/prompts/:id", proxy.ReverseProxy(cfg.Services.AIService))
	}

	// ============================================
	// Fallback for undefined routes
	// ============================================
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "route_not_found",
			"message": "The requested endpoint does not exist",
			"path":    c.Request.URL.Path,
		})
	})
}
