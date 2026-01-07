package main

import (
	"log"
	"os"

	"github.com/bisosad1501/DATN/services/user-service/internal/config"
	"github.com/bisosad1501/DATN/services/user-service/internal/database"
	"github.com/bisosad1501/DATN/services/user-service/internal/handlers"
	"github.com/bisosad1501/DATN/services/user-service/internal/middleware"
	"github.com/bisosad1501/DATN/services/user-service/internal/repository"
	"github.com/bisosad1501/DATN/services/user-service/internal/routes"
	"github.com/bisosad1501/DATN/services/user-service/internal/service"
)

func main() {
	log.SetOutput(os.Stdout)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	log.Println("🚀 Starting User Service...")

	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	db, err := database.NewDatabase(cfg)
	if err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize repository
	userRepo := repository.NewUserRepository(db, cfg)

	// Initialize service
	userService := service.NewUserService(userRepo, cfg)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(cfg)

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService)
	internalHandler := handlers.NewInternalHandler(userService)
	scoringHandler := handlers.NewScoringHandler(userService)
	adminStatsHandler := handlers.NewAdminStatsHandler(db.DB) // Pass underlying *sql.DB

	// Setup routes
	router := routes.SetupRoutes(userHandler, internalHandler, scoringHandler, adminStatsHandler, authMiddleware)

	// Start server
	port := ":" + cfg.ServerPort
	log.Printf("✅ User Service started successfully on port %s", cfg.ServerPort)
	log.Printf("🔗 Health check: http://localhost%s/health", port)
	log.Printf("📚 API documentation: http://localhost%s/api/v1/user", port)

	if err := router.Run(port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
