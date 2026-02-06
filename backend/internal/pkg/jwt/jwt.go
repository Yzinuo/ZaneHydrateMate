package jwt

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Manager struct {
	AccessSecret  []byte
	RefreshSecret []byte
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
}

type Claims struct {
	Email string `json:"email"`
	Type  string `json:"typ"`
	jwt.RegisteredClaims
}

func NewManager(accessSecret, refreshSecret string, accessTTL, refreshTTL time.Duration) *Manager {
	return &Manager{
		AccessSecret:  []byte(accessSecret),
		RefreshSecret: []byte(refreshSecret),
		AccessTTL:     accessTTL,
		RefreshTTL:    refreshTTL,
	}
}

func (m *Manager) GenerateAccessToken(userID uuid.UUID, email string) (string, error) {
	return m.generateToken(userID, email, "access", m.AccessTTL, m.AccessSecret)
}

func (m *Manager) GenerateRefreshToken(userID uuid.UUID, email string) (string, error) {
	return m.generateToken(userID, email, "refresh", m.RefreshTTL, m.RefreshSecret)
}

func (m *Manager) generateToken(userID uuid.UUID, email, tokenType string, ttl time.Duration, secret []byte) (string, error) {
	now := time.Now()
	claims := Claims{
		Email: email,
		Type:  tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}
