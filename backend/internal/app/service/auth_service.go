package service

import (
	"errors"
	"strings"

	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"
	jwtutil "hydratemate/internal/pkg/jwt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrEmailExists        = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidInput       = errors.New("invalid input")
)

type AuthService struct {
	UserRepo     *repo.UserRepository
	TokenManager *jwtutil.Manager
}

type AuthTokens struct {
	AccessToken  string
	RefreshToken string
}

func NewAuthService(userRepo *repo.UserRepository, tokenManager *jwtutil.Manager) *AuthService {
	return &AuthService{
		UserRepo:     userRepo,
		TokenManager: tokenManager,
	}
}

func (s *AuthService) Register(email, password string) (*model.User, *AuthTokens, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || len(password) < 8 {
		return nil, nil, ErrInvalidInput
	}

	_, err := s.UserRepo.FindByEmail(email)
	if err == nil {
		return nil, nil, ErrEmailExists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, err
	}

	user := &model.User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: string(hashed),
		Settings: model.UserSettings{
			UserID:            uuid.Nil, // Should be set to user.ID but GORM handles it via User
			DailyGoalMl:       2000,
			ReminderIntensity: 5,
			QuietHoursStart:   "22:00",
			QuietHoursEnd:     "08:00",
		},
	}

	// Important: Set the ID explicitly if GORM doesn't auto-generate before hooks in some drivers
	// But our model hook handles nil ID.

	if err := s.UserRepo.Create(user); err != nil {
		return nil, nil, err
	}

	tokens, err := s.issueTokens(user.ID, user.Email)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) Login(email, password string) (*model.User, *AuthTokens, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || password == "" {
		return nil, nil, ErrInvalidInput
	}

	user, err := s.UserRepo.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	tokens, err := s.issueTokens(user.ID, user.Email)
	if err != nil {
		return nil, nil, err
	}

	return user, tokens, nil
}

func (s *AuthService) issueTokens(userID uuid.UUID, email string) (*AuthTokens, error) {
	access, err := s.TokenManager.GenerateAccessToken(userID, email)
	if err != nil {
		return nil, err
	}
	refresh, err := s.TokenManager.GenerateRefreshToken(userID, email)
	if err != nil {
		return nil, err
	}
	return &AuthTokens{
		AccessToken:  access,
		RefreshToken: refresh,
	}, nil
}
