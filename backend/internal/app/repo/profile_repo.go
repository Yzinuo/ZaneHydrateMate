package repo

import (
	"hydratemate/internal/app/model"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ProfileRepository struct {
	DB *gorm.DB
}

func NewProfileRepository(db *gorm.DB) *ProfileRepository {
	return &ProfileRepository{DB: db}
}

func (r *ProfileRepository) GetByUserID(userID uuid.UUID) (*model.UserProfile, error) {
	var profile model.UserProfile
	err := r.DB.Where("user_id = ?", userID).First(&profile).Error
	if err == gorm.ErrRecordNotFound {
		// Return default profile
		return &model.UserProfile{
			UserID:   userID,
			HeightCm: 170,
			WeightKg: 70,
			Age:      25,
		}, nil
	}
	return &profile, err
}

func (r *ProfileRepository) Upsert(profile *model.UserProfile) error {
	return r.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		UpdateAll: true,
	}).Create(profile).Error
}
