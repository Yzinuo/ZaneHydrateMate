package jwt

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestJWTManager(t *testing.T) {
	manager := NewManager("access_secret", "refresh_secret", 15*time.Minute, 24*time.Hour)
	userID := uuid.New()
	email := "test@example.com"

	t.Run("Generate and Validate Access Token", func(t *testing.T) {
		token, err := manager.GenerateAccessToken(userID, email)
		if err != nil {
			t.Fatalf("Failed to generate access token: %v", err)
		}

		claims, err := manager.ValidateAccessToken(token)
		if err != nil {
			t.Fatalf("Failed to validate access token: %v", err)
		}

		if claims.Subject != userID.String() {
			t.Errorf("Expected userID %s, got %s", userID.String(), claims.Subject)
		}
		if claims.Email != email {
			t.Errorf("Expected email %s, got %s", email, claims.Email)
		}
		if claims.Type != "access" {
			t.Errorf("Expected type access, got %s", claims.Type)
		}
	})

	t.Run("Generate and Validate Refresh Token", func(t *testing.T) {
		token, err := manager.GenerateRefreshToken(userID, email)
		if err != nil {
			t.Fatalf("Failed to generate refresh token: %v", err)
		}

		claims, err := manager.ValidateRefreshToken(token)
		if err != nil {
			t.Fatalf("Failed to validate refresh token: %v", err)
		}

		if claims.Subject != userID.String() {
			t.Errorf("Expected userID %s, got %s", userID.String(), claims.Subject)
		}
		if claims.Type != "refresh" {
			t.Errorf("Expected type refresh, got %s", claims.Type)
		}
	})

	t.Run("Invalid Token", func(t *testing.T) {
		_, err := manager.ValidateAccessToken("invalid_token")
		if err == nil {
			t.Error("Expected error for invalid token, got nil")
		}
	})

	t.Run("Wrong Secret", func(t *testing.T) {
		token, _ := manager.GenerateAccessToken(userID, email)
		
		anotherManager := NewManager("wrong_secret", "wrong_secret", 15*time.Minute, 24*time.Hour)
		_, err := anotherManager.ValidateAccessToken(token)
		if err == nil {
			t.Error("Expected error for token validated with wrong secret, got nil")
		}
	})
}
