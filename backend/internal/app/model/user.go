package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Settings     UserSettings `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

type UserSettings struct {
	UserID            uuid.UUID `gorm:"type:uuid;primary_key"`
	DailyGoalMl       int       `gorm:"default:2000"`
	ReminderIntensity int       `gorm:"default:5"`
	QuietHoursStart   string    `gorm:"type:time;default:'22:00'"`
	QuietHoursEnd     string    `gorm:"type:time;default:'08:00'"`
	UpdatedAt         time.Time
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return
}
