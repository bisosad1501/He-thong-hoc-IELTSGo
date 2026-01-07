package routes

import (
	"github.com/bisosad1501/ielts-platform/exercise-service/internal/handlers"
	"github.com/bisosad1501/ielts-platform/exercise-service/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, handler *handlers.ExerciseHandler, storageHandler *handlers.StorageHandler, authMiddleware *middleware.AuthMiddleware) {
	// Health check
	router.GET("/health", handler.HealthCheck)

	// API routes
	api := router.Group("/api/v1")
	{
		// Storage routes (auth required) - Proxy to Storage Service
		storage := api.Group("/storage")
		storage.Use(authMiddleware.AuthRequired())
		{
			audio := storage.Group("/audio")
			{
				audio.POST("/upload", storageHandler.UploadAudio)            // Direct upload (proxy)
				audio.GET("/info/*object_name", storageHandler.GetAudioInfo) // Get audio info
			}
		}

		// Exercise routes - single group with per-route middleware
		exercises := api.Group("/exercises")
		{
			// Public routes (optional auth)
			exercises.GET("", authMiddleware.OptionalAuth(), handler.GetExercises)        // List exercises
			exercises.GET("/:id", authMiddleware.OptionalAuth(), handler.GetExerciseByID) // Get detail

			// Protected route - start exercise (student/instructor only)
			exercises.POST("/:id/start",
				authMiddleware.AuthRequired(),
				authMiddleware.RequireRole("student", "instructor"),
				handler.StartExercise) // Start exercise
		}

		// Student routes (auth required, student and instructor only - admin cannot submit)
		submissions := api.Group("/submissions")
		submissions.Use(authMiddleware.AuthRequired())
		submissions.Use(authMiddleware.RequireRole("student", "instructor"))
		{
			submissions.POST("", handler.StartExercise)                 // Start new exercise
			submissions.POST("/:id/submit", handler.SubmitExercise)     // Unified submission (Phase 4)
			submissions.PUT("/:id/answers", handler.SubmitAnswers)      // Submit answers (deprecated, use /submit)
			submissions.GET("/:id/result", handler.GetSubmissionResult) // Get result
			submissions.GET("/my", handler.GetMySubmissions)            // Get my submissions
		}

		// Tags routes (public)
		tags := api.Group("/tags")
		{
			tags.GET("", handler.GetAllTags) // Get all tags
		}

		exerciseTags := api.Group("/exercises/:id/tags")
		{
			exerciseTags.GET("", handler.GetExerciseTags) // Get exercise tags
		}

		// Admin routes (instructor/admin only)
		admin := api.Group("/admin")
		admin.Use(authMiddleware.AuthRequired())
		admin.Use(authMiddleware.RequireRole("instructor", "admin"))
		{
			// Exercise management
			admin.POST("/exercises", handler.CreateExercise)                           // Create exercise
			admin.PUT("/exercises/:id", handler.UpdateExercise)                        // Update exercise
			admin.DELETE("/exercises/:id", handler.DeleteExercise)                     // Delete exercise
			admin.POST("/exercises/:id/publish", handler.PublishExercise)              // Publish exercise
			admin.POST("/exercises/:id/unpublish", handler.UnpublishExercise)          // Unpublish exercise
			admin.POST("/exercises/:id/sections", handler.CreateSection)               // Create section
			admin.GET("/exercises/:id/analytics", handler.GetExerciseAnalytics)        // Get analytics
			admin.POST("/exercises/:id/tags", handler.AddTagToExercise)                // Add tag to exercise
			admin.DELETE("/exercises/:id/tags/:tag_id", handler.RemoveTagFromExercise) // Remove tag

			// Question management
			admin.POST("/questions", handler.CreateQuestion)                   // Create question
			admin.POST("/questions/:id/options", handler.CreateQuestionOption) // Add option
			admin.POST("/questions/:id/answer", handler.CreateQuestionAnswer)  // Add answer

			// Tag management
			admin.POST("/tags", handler.CreateTag) // Create tag

			// Question Bank management
			admin.GET("/question-bank", handler.GetBankQuestions)          // List bank questions
			admin.POST("/question-bank", handler.CreateBankQuestion)       // Create bank question
			admin.PUT("/question-bank/:id", handler.UpdateBankQuestion)    // Update bank question
			admin.DELETE("/question-bank/:id", handler.DeleteBankQuestion) // Delete bank question
		}
	}
}
