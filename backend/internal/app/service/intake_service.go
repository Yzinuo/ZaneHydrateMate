package service

import (
	"errors"
	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrIntakeNotFound = errors.New("intake not found")
)

type IntakeService struct {
	IntakeRepo   *repo.IntakeRepository
	SettingsRepo *repo.SettingsRepository
	DB           *gorm.DB
}

func NewIntakeService(db *gorm.DB, intakeRepo *repo.IntakeRepository, settingsRepo *repo.SettingsRepository) *IntakeService {
	return &IntakeService{
		IntakeRepo:   intakeRepo,
		SettingsRepo: settingsRepo,
		DB:           db,
	}
}

type AddIntakeInput struct {
	AmountMl   int       `json:"amount_ml"`
	Category   string    `json:"category"`
	IntakeTime time.Time `json:"intake_time"`
}

func (s *IntakeService) AddIntake(userID uuid.UUID, input AddIntakeInput) (*model.WaterIntake, error) {
	if input.AmountMl <= 0 {
		return nil, ErrInvalidInput
	}

	if input.Category == "" {
		input.Category = "water"
	}

	if input.IntakeTime.IsZero() {
		input.IntakeTime = time.Now()
	}

	// Get user's daily goal
	settings, err := s.SettingsRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	intake := &model.WaterIntake{
		ID:         uuid.New(),
		UserID:     userID,
		AmountMl:   input.AmountMl,
		Category:   input.Category,
		IntakeTime: input.IntakeTime,
		CreatedAt:  time.Now(),
	}

	// Use transaction to ensure consistency
	err = s.DB.Transaction(func(tx *gorm.DB) error {
		// Create intake
		if err := tx.Create(intake).Error; err != nil {
			return err
		}

		// Update daily stats
		intakeRepo := &repo.IntakeRepository{DB: tx}
		return intakeRepo.UpsertDailyStats(userID, input.IntakeTime, input.AmountMl, settings.DailyGoalMl)
	})

	if err != nil {
		return nil, err
	}

	return intake, nil
}

func (s *IntakeService) DeleteIntake(userID, intakeID uuid.UUID) error {
	intake, err := s.IntakeRepo.FindByID(userID, intakeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrIntakeNotFound
		}
		return err
	}

	settings, err := s.SettingsRepo.GetByUserID(userID)
	if err != nil {
		return err
	}

	// Use transaction
	return s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(intake).Error; err != nil {
			return err
		}

		// Subtract from daily stats
		intakeRepo := &repo.IntakeRepository{DB: tx}
		return intakeRepo.UpsertDailyStats(userID, intake.IntakeTime, -intake.AmountMl, settings.DailyGoalMl)
	})
}

func (s *IntakeService) ListIntakes(userID uuid.UUID, from, to time.Time, page, pageSize int) ([]model.WaterIntake, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return s.IntakeRepo.ListByUserAndRange(userID, from, to, page, pageSize)
}
