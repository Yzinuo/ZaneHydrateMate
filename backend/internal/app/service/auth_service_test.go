package service

import (
	"testing"
	"time"

	"hydratemate/internal/app/repo"
	jwtutil "hydratemate/internal/pkg/jwt"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"hydratemate/internal/app/model"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&model.User{}, &model.UserSettings{})
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func TestAuthService(t *testing.T) {
	db := setupTestDB(t)
	userRepo := repo.NewUserRepository(db)
	tokenManager := jwtutil.NewManager("access", "refresh", 15*time.Minute, 24*time.Hour)
	authService := NewAuthService(userRepo, tokenManager)

	email := "test@example.com"
	password := "password123"

	t.Run("Register Success", func(t *testing.T) {
		user, tokens, err := authService.Register(email, password)
		if err != nil {
			t.Fatalf("Register failed: %v", err)
		}

		if user.Email != email {
			t.Errorf("Expected email %s, got %s", email, user.Email)
		}

		if tokens.AccessToken == "" || tokens.RefreshToken == "" {
			t.Error("Expected tokens, got empty strings")
		}
	})

	t.Run("Register Duplicate Email", func(t *testing.T) {
		_, _, err := authService.Register(email, password)
		if err != ErrEmailExists {
			t.Errorf("Expected ErrEmailExists, got %v", err)
		}
	})

	t.Run("Login Success", func(t *testing.T) {
		user, tokens, err := authService.Login(email, password)
		if err != nil {
			t.Fatalf("Login failed: %v", err)
		}

		if user.Email != email {
			t.Errorf("Expected email %s, got %s", email, user.Email)
		}

		if tokens.AccessToken == "" || tokens.RefreshToken == "" {
			t.Error("Expected tokens, got empty strings")
		}
	})

	t.Run("Login Invalid Credentials", func(t *testing.T) {
		_, _, err := authService.Login(email, "wrongpassword")
		if err != ErrInvalidCredentials {
			t.Errorf("Expected ErrInvalidCredentials, got %v", err)
		}

		_, _, err = authService.Login("nonexistent@example.com", password)
		if err != ErrInvalidCredentials {
			t.Errorf("Expected ErrInvalidCredentials, got %v", err)
		}
	})

	t.Run("Register Invalid Input", func(t *testing.T) {
		_, _, err := authService.Register("", "short")
		if err != ErrInvalidInput {
			t.Errorf("Expected ErrInvalidInput, got %v", err)
		}
	})
}
