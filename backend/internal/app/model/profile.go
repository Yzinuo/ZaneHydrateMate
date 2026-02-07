package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserProfile struct {
	UserID    uuid.UUID `gorm:"type:uuid;primary_key" json:"user_id"`
	HeightCm  int       `gorm:"default:170" json:"height_cm"`
	WeightKg  int       `gorm:"default:70" json:"weight_kg"`
	Age       int       `gorm:"default:25" json:"age"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *UserProfile) BeforeCreate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now()
	return nil
}

func (p *UserProfile) BeforeUpdate(tx *gorm.DB) error {
	p.UpdatedAt = time.Now()
	return nil
}

// CalcRecommendedDailyMl calculates recommended daily water intake
func (p *UserProfile) CalcRecommendedDailyMl() int {
	base := p.WeightKg * 30

	// Age adjustment
	if p.Age < 14 {
		base = p.WeightKg * 40
	} else if p.Age >= 65 {
		base = p.WeightKg * 28
	}

	// Clamp between 1200 and 4000
	if base < 1200 {
		base = 1200
	}
	if base > 4000 {
		base = 4000
	}

	return base
}
