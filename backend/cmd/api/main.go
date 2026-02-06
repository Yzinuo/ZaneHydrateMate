/*
 * @Author: yangzinuo yangzinuo@caohua.com
 * @Date: 2026-02-05 15:48:55
 * @LastEditors: yangzinuo yangzinuo@caohua.com
 * @LastEditTime: 2026-02-05 16:02:13
 * @FilePath: \ZaneHydrateMate\backend\cmd\api\main.go
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
package main

import (
	"log"

	"hydratemate/internal/app/handler"
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
	db.AutoMigrate(&model.User{}, &model.UserSettings{}, &model.WaterIntake{})

	// 3. Init Layers
	// Repo
	userRepo := repo.NewUserRepository(db)

	// Service
	tokenManager := jwtutil.NewManager(jwtSecret, jwtSecret, 15*time.Minute, 168*time.Hour)
	authService := service.NewAuthService(userRepo, tokenManager)

	// Handler
	authHandler := handler.NewAuthHandler(authService)

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
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}
	}

	// 5. Start Server
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
