package service

import (
	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"

	"github.com/google/uuid"
)

type SettingsService struct {
	SettingsRepo *repo.SettingsRepository
}

func NewSettingsService(settingsRepo *repo.SettingsRepository) *SettingsService {
	return &SettingsService{SettingsRepo: settingsRepo}
}

func (s *SettingsService) GetSettings(userID uuid.UUID) (*model.UserSettings, error) {
	return s.SettingsRepo.GetByUserID(userID)
}

type UpdateSettingsInput struct {
	DailyGoalMl       *int    `json:"daily_goal_ml"`
	ReminderIntensity *int    `json:"reminder_intensity"`
	QuietHoursStart   *string `json:"quiet_hours_start"`
	QuietHoursEnd     *string `json:"quiet_hours_end"`
}

func (s *SettingsService) UpdateSettings(userID uuid.UUID, input UpdateSettingsInput) (*model.UserSettings, error) {
	settings, err := s.SettingsRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	if input.DailyGoalMl != nil {
		settings.DailyGoalMl = *input.DailyGoalMl
	}
	if input.ReminderIntensity != nil {
		settings.ReminderIntensity = *input.ReminderIntensity
	}
	if input.QuietHoursStart != nil {
		settings.QuietHoursStart = *input.QuietHoursStart
	}
	if input.QuietHoursEnd != nil {
		settings.QuietHoursEnd = *input.QuietHoursEnd
	}

	if err := s.SettingsRepo.Update(settings); err != nil {
		return nil, err
	}

	return settings, nil
}
