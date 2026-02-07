/*
 * @Author: yangzinuo yangzinuo@caohua.com
 * @Date: 2026-02-05 15:48:55
 * @LastEditors: yangzinuo yangzinuo@caohua.com
 * @LastEditTime: 2026-02-05 16:02:13
 * @FilePath: \ZaneHydrateMate\backend\cmd\api\main.go
 * @Description: HydrateMate API Server
 */
package main

import (
	"log"

	"hydratemate/internal/app/handler"
	"hydratemate/internal/app/middleware"
	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"
	"hydratemate/internal/app/service"
	jwtutil "hydratemate/internal/pkg/jwt"

	"time"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Load Config
	viper.SetConfigFile("configs/config.yaml")
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file: %s", err)
	}

	dsn := viper.GetString("database.dsn")
	port := viper.GetString("server.port")
	jwtSecret := viper.GetString("jwt.secret")

	// 2. Init DB
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migrate (Dev only)
	db.AutoMigrate(
		&model.User{},
		&model.UserSettings{},
		&model.WaterIntake{},
		&model.UserProfile{},
		&model.DailyStats{},
	)

	// 3. Init Layers
	// Token Manager
	tokenManager := jwtutil.NewManager(jwtSecret, jwtSecret, 15*time.Minute, 168*time.Hour)

	// Repositories
	userRepo := repo.NewUserRepository(db)
	intakeRepo := repo.NewIntakeRepository(db)
	profileRepo := repo.NewProfileRepository(db)
	statsRepo := repo.NewStatsRepository(db)
	settingsRepo := repo.NewSettingsRepository(db)

	// Services
	authService := service.NewAuthService(userRepo, tokenManager)
	intakeService := service.NewIntakeService(db, intakeRepo, settingsRepo)
	profileService := service.NewProfileService(profileRepo, settingsRepo)
	statsService := service.NewStatsService(statsRepo)
	settingsService := service.NewSettingsService(settingsRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	intakeHandler := handler.NewIntakeHandler(intakeService)
	profileHandler := handler.NewProfileHandler(profileService)
	statsHandler := handler.NewStatsHandler(statsService)
	settingsHandler := handler.NewSettingsHandler(settingsService)

	// 4. Init Router
	r := gin.Default()

	// CORS Middleware (Simplified)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api/v1")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(tokenManager))
		{
			// Intake routes
			intakes := protected.Group("/intakes")
			{
				intakes.POST("", intakeHandler.AddIntake)
				intakes.GET("", intakeHandler.ListIntakes)
				intakes.DELETE("/:id", intakeHandler.DeleteIntake)
			}

			// Stats routes
			stats := protected.Group("/stats")
			{
				stats.GET("/weekly", statsHandler.GetWeeklyStats)
				stats.GET("/monthly", statsHandler.GetMonthlyStats)
				stats.GET("/today", statsHandler.GetTodayStats)
			}

			// Profile routes
			protected.GET("/profile", profileHandler.GetProfile)
			protected.PUT("/profile", profileHandler.UpdateProfile)

			// Settings routes
			protected.GET("/settings", settingsHandler.GetSettings)
			protected.PUT("/settings", settingsHandler.UpdateSettings)
		}
	}

	// 5. Start Server
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
