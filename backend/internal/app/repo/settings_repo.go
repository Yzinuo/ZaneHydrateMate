package repo

import (
	"hydratemate/internal/app/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SettingsRepository struct {
	DB *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) *SettingsRepository {
	return &SettingsRepository{DB: db}
}

func (r *SettingsRepository) GetByUserID(userID uuid.UUID) (*model.UserSettings, error) {
	var settings model.UserSettings
	err := r.DB.Where("user_id = ?", userID).First(&settings).Error
	if err == gorm.ErrRecordNotFound {
		return &model.UserSettings{
			UserID:            userID,
			DailyGoalMl:       2000,
			ReminderIntensity: 5,
			QuietHoursStart:   "22:00",
			QuietHoursEnd:     "08:00",
		}, nil
	}
	return &settings, err
}

func (r *SettingsRepository) Update(settings *model.UserSettings) error {
	return r.DB.Save(settings).Error
}
