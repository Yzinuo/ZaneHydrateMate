package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WaterIntake struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index:idx_intakes_user_time"`
	AmountMl   int       `gorm:"not null"`
	Category   string    `gorm:"type:varchar(20);default:'water'"`
	IntakeTime time.Time `gorm:"not null;index:idx_intakes_user_time,sort:desc"`
	CreatedAt  time.Time
}

func (w *WaterIntake) BeforeCreate(tx *gorm.DB) (err error) {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return
}
