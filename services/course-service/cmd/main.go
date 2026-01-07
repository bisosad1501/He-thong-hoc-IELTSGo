package main

import (
	"log"

	"github.com/bisosad1501/DATN/shared/pkg/client"
	"github.com/bisosad1501/ielts-platform/course-service/internal/config"
	"github.com/bisosad1501/ielts-platform/course-service/internal/database"
	"github.com/bisosad1501/ielts-platform/course-service/internal/handlers"
	"github.com/bisosad1501/ielts-platform/course-service/internal/middleware"
	"github.com/bisosad1501/ielts-platform/course-service/internal/repository"
	"github.com/bisosad1501/ielts-platform/course-service/internal/routes"
	"github.com/bisosad1501/ielts-platform/course-service/internal/service"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("🚀 Starting Course Service...")

	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	db, err := database.NewDatabase(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repository
	repo := repository.NewCourseRepository(db.DB)
	log.Println("✅ Repository initialized")

	// Initialize service clients for service-to-service communication
	userServiceClient := client.NewUserServiceClient(cfg.UserServiceURL, cfg.InternalAPIKey)
	notificationClient := client.NewNotificationServiceClient(cfg.NotificationServiceURL, cfg.InternalAPIKey)
	exerciseClient := client.NewExerciseServiceClient(cfg.ExerciseServiceURL, cfg.InternalAPIKey)
	log.Println("✅ Service clients initialized")

	// Initialize YouTube service
	youtubeService, err := service.NewYouTubeService()
	if err != nil {
		log.Printf("⚠️  Failed to initialize YouTube service: %v (video duration auto-fetch disabled)", err)
		youtubeService = nil // Continue without YouTube service
	} else {
		log.Println("✅ YouTube service initialized")
	}

	// Initialize service with internal key for session tracking
	svc := service.NewCourseService(repo, userServiceClient, notificationClient, exerciseClient, youtubeService, cfg.InternalAPIKey, cfg.UserServiceURL)
	log.Println("✅ Service initialized")

	// Initialize and start video sync service
	var videoSyncService *service.VideoSyncService
	if youtubeService != nil {
		videoSyncService = service.NewVideoSyncService(repo, youtubeService)
		videoSyncService.StartPeriodicSync()
		log.Println("✅ Video sync service started (runs every 24 hours)")

		// Graceful shutdown
		defer videoSyncService.Stop()
	}

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(cfg)
	log.Println("✅ Middleware initialized")

	// Initialize handlers
	handler := handlers.NewCourseHandler(svc, videoSyncService)
	log.Println("✅ Handlers initialized")

	// Setup Gin router
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// Setup routes
	routes.SetupRoutes(router, handler, authMiddleware)
	log.Println("✅ Routes configured")

	// Print routes
	log.Println("📋 Registered routes:")
	log.Println("  - GET  /health")
	log.Println("  - GET  /api/v1/courses")
	log.Println("  - GET  /api/v1/courses/:id")
	log.Println("  - GET  /api/v1/lessons/:id")
	log.Println("  - POST /api/v1/enrollments")
	log.Println("  - GET  /api/v1/enrollments/my")
	log.Println("  - GET  /api/v1/enrollments/:id/progress")
	log.Println("  - PUT  /api/v1/progress/lessons/:id")

	// Start server
	serverAddr := ":" + cfg.ServerPort
	log.Printf("✅ Course Service started successfully on port %s\n", cfg.ServerPort)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
