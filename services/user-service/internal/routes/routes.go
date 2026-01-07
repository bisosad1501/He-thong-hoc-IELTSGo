package routes

import (
	"github.com/bisosad1501/DATN/services/user-service/internal/handlers"
	"github.com/bisosad1501/DATN/services/user-service/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(handler *handlers.UserHandler, internalHandler *handlers.InternalHandler, scoringHandler *handlers.ScoringHandler, adminStatsHandler *handlers.AdminStatsHandler, authMiddleware *middleware.AuthMiddleware) *gin.Engine {
	router := gin.Default()

	// Health check
	router.GET("/health", handler.HealthCheck)

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Public user profile route (optional auth - for visibility check)
		usersGroup := v1.Group("/users")
		usersGroup.Use(authMiddleware.OptionalAuth()) // Optional auth - allows unauthenticated access but checks auth if available
		{
			usersGroup.GET("/:id/profile", handler.GetPublicProfile)           // Get public user profile
			usersGroup.GET("/:id/achievements", handler.GetPublicAchievements) // Get public user achievements
			usersGroup.GET("/:id/followers", handler.GetFollowers)             // Get user followers (paginated)
			usersGroup.GET("/:id/following", handler.GetFollowing)             // Get user following (paginated)
		}

		// Protected user social routes (auth required)
		usersProtected := v1.Group("/users")
		usersProtected.Use(authMiddleware.AuthRequired())
		{
			usersProtected.POST("/:id/follow", handler.FollowUser)     // Follow a user
			usersProtected.DELETE("/:id/follow", handler.UnfollowUser) // Unfollow a user
		}

		// User routes (protected)
		user := v1.Group("/user")
		user.Use(authMiddleware.AuthRequired())
		{
			// Profile management
			user.GET("/profile", handler.GetProfile)
			// Remove follower (user removes someone from their followers list)
			user.DELETE("/followers/:id", handler.RemoveFollower)
			user.PUT("/profile", handler.UpdateProfile)
			user.POST("/profile/avatar", handler.UpdateAvatar)

			// Progress and statistics
			user.GET("/progress", handler.GetProgress)
			user.GET("/progress/history", handler.GetHistory)

			// Study sessions
			user.POST("/sessions", handler.StartSession)
			user.POST("/sessions/:id/end", handler.EndSession)

			// Study goals
			user.POST("/goals", handler.CreateGoal)
			user.GET("/goals", handler.GetGoals)
			user.GET("/goals/:id", handler.GetGoalByID)
			user.PUT("/goals/:id", handler.UpdateGoal)
			user.POST("/goals/:id/complete", handler.CompleteGoal)
			user.DELETE("/goals/:id", handler.DeleteGoal)

			// Statistics
			user.GET("/statistics", handler.GetStatistics)
			user.GET("/statistics/:skill", handler.GetSkillStatistics)

			// Achievements
			user.GET("/achievements", handler.GetAchievements)
			user.GET("/achievements/earned", handler.GetEarnedAchievements)

			// Preferences
			user.GET("/preferences", handler.GetPreferences)
			user.PUT("/preferences", handler.UpdatePreferences)

			// Study reminders
			user.POST("/reminders", handler.CreateReminder)
			user.GET("/reminders", handler.GetReminders)
			user.PUT("/reminders/:id", handler.UpdateReminder)
			user.DELETE("/reminders/:id", handler.DeleteReminder)
			user.PUT("/reminders/:id/toggle", handler.ToggleReminder)

			// Leaderboard
			user.GET("/leaderboard", handler.GetLeaderboard)
			user.GET("/leaderboard/rank", handler.GetUserRank)
		}

		// Internal routes (service-to-service communication only)
		internal := v1.Group("/user/internal")
		internal.Use(authMiddleware.InternalAuth())
		{
			// Profile management
			internal.POST("/profile/create", internalHandler.CreateProfileInternal)

			// Progress updates
			internal.PUT("/progress/update", internalHandler.UpdateProgressInternal)

			// Skill statistics updates
			internal.PUT("/statistics/:skill/update", internalHandler.UpdateSkillStatisticsInternal)

			// Study session tracking
			internal.POST("/session/start", internalHandler.StartSessionInternal)
			internal.PUT("/session/:session_id/end", internalHandler.EndSessionInternal)
			internal.POST("/session/record", internalHandler.RecordCompletedSessionInternal)

			// Scoring endpoints (Phase 3 - Official vs Practice separation)
			internal.POST("/users/:user_id/test-results", scoringHandler.RecordTestResultInternal)
			internal.POST("/users/:user_id/practice-activities", scoringHandler.RecordPracticeActivityInternal)
			internal.GET("/users/:user_id/test-history", scoringHandler.GetUserTestHistory)
			internal.GET("/users/:user_id/practice-statistics", scoringHandler.GetUserPracticeStatistics)
		}

		// Admin statistics routes (admin only)
		adminStats := v1.Group("/admin/stats")
		adminStats.Use(authMiddleware.AuthRequired())
		adminStats.Use(authMiddleware.RequireRole("admin"))
		{
			adminStats.GET("/dashboard", adminStatsHandler.GetDashboardStats)    // Get overall dashboard stats
			adminStats.GET("/user-growth", adminStatsHandler.GetUserGrowthData)  // Get user growth data
			adminStats.GET("/enrollments", adminStatsHandler.GetEnrollmentData)  // Get enrollment stats
			adminStats.GET("/activities", adminStatsHandler.GetRecentActivities) // Get recent activities
		}
	}

	return router
}
