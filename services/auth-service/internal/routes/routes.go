package routes

import (
	"github.com/bisosad1501/DATN/services/auth-service/internal/handlers"
	"github.com/bisosad1501/DATN/services/auth-service/internal/middleware"
	"github.com/bisosad1501/DATN/services/auth-service/internal/service"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, authHandler *handlers.AuthHandler, adminHandler *handlers.AdminHandler, authService service.AuthService) {
	// Health check
	router.GET("/health", authHandler.HealthCheck)

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			// Public endpoints (no authentication required)
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)

			// Google OAuth endpoints
			auth.GET("/google/url", authHandler.GetGoogleOAuthURL)      // Step 1: Get OAuth URL (Mobile/Web)
			auth.GET("/google", authHandler.GoogleLogin)                // Web flow: Redirect to Google
			auth.GET("/google/callback", authHandler.GoogleCallback)    // Web flow: Handle callback
			auth.POST("/google/token", authHandler.GoogleExchangeToken) // Mobile flow: Exchange code for tokens

			// Password reset endpoints
			auth.POST("/forgot-password", authHandler.ForgotPassword)             // Request password reset (sends 6-digit code)
			auth.POST("/reset-password", authHandler.ResetPassword)               // Reset password with token (legacy)
			auth.POST("/reset-password-by-code", authHandler.ResetPasswordByCode) // Reset password with 6-digit code

			// Email verification endpoints
			auth.GET("/verify-email", authHandler.VerifyEmail)                // Verify email with token (legacy)
			auth.POST("/verify-email-by-code", authHandler.VerifyEmailByCode) // Verify email with 6-digit code
			auth.POST("/resend-verification", authHandler.ResendVerification) // Resend verification email (sends 6-digit code)

			// Protected endpoints (require authentication)
			protected := auth.Group("")
			protected.Use(middleware.AuthMiddleware(authService))
			{
				protected.GET("/validate", authHandler.ValidateToken)
				protected.POST("/logout", authHandler.Logout)
				protected.POST("/change-password", authHandler.ChangePassword)
			}
		}

		// Admin routes (require admin role)
		admin := v1.Group("/admin")
		admin.Use(middleware.AuthMiddleware(authService))
		admin.Use(middleware.AdminMiddleware())
		{
			// User management
			admin.GET("/users", adminHandler.ListUsers)
			admin.GET("/users/:id", adminHandler.GetUser)
			admin.PUT("/users/:id", adminHandler.UpdateUser)
			admin.DELETE("/users/:id", adminHandler.DeleteUser)
			admin.PUT("/users/:id/status", adminHandler.UpdateUserStatus)

			// Role management
			admin.POST("/users/:id/roles", adminHandler.AssignRole)
			admin.DELETE("/users/:id/roles/:role", adminHandler.RevokeRole)
		}
	}
}
