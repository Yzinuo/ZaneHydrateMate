package model

import (
	"time"

	"github.com/google/uuid"
)

type DailyStats struct {
	UserID     uuid.UUID `gorm:"type:uuid;primary_key" json:"user_id"`
	StatDate   time.Time `gorm:"type:date;primary_key" json:"stat_date"`
	TotalMl    int       `gorm:"default:0" json:"total_ml"`
	IsGoalMet  bool      `gorm:"default:false" json:"is_goal_met"`
	StreakDays int       `gorm:"default:0" json:"streak_days"`
}

type WeeklyStats struct {
	WeekStart  time.Time    `json:"week_start"`
	TotalMl    int          `json:"total_ml"`
	AvgDaily   int          `json:"avg_daily"`
	DaysLogged int          `json:"days_logged"`
	GoalsMet   int          `json:"goals_met"`
	DailyData  []DailyStats `json:"daily_data"`
}

type MonthlyStats struct {
	Month      string       `json:"month"`
	TotalMl    int          `json:"total_ml"`
	AvgDaily   int          `json:"avg_daily"`
	DaysLogged int          `json:"days_logged"`
	GoalsMet   int          `json:"goals_met"`
	DailyData  []DailyStats `json:"daily_data"`
}
