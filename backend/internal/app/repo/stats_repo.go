package repo

import (
	"hydratemate/internal/app/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StatsRepository struct {
	DB *gorm.DB
}

func NewStatsRepository(db *gorm.DB) *StatsRepository {
	return &StatsRepository{DB: db}
}

func (r *StatsRepository) GetDailyStatsRange(userID uuid.UUID, from, to time.Time) ([]model.DailyStats, error) {
	var stats []model.DailyStats
	err := r.DB.Where("user_id = ? AND stat_date >= ? AND stat_date < ?", userID, from, to).
		Order("stat_date ASC").
		Find(&stats).Error
	return stats, err
}

func (r *StatsRepository) GetWeeklyStats(userID uuid.UUID, weekStart time.Time) (*model.WeeklyStats, error) {
	weekEnd := weekStart.AddDate(0, 0, 7)

	dailyData, err := r.GetDailyStatsRange(userID, weekStart, weekEnd)
	if err != nil {
		return nil, err
	}

	var totalMl, goalsMet int
	for _, d := range dailyData {
		totalMl += d.TotalMl
		if d.IsGoalMet {
			goalsMet++
		}
	}

	daysLogged := len(dailyData)
	avgDaily := 0
	if daysLogged > 0 {
		avgDaily = totalMl / daysLogged
	}

	return &model.WeeklyStats{
		WeekStart:  weekStart,
		TotalMl:    totalMl,
		AvgDaily:   avgDaily,
		DaysLogged: daysLogged,
		GoalsMet:   goalsMet,
		DailyData:  dailyData,
	}, nil
}

func (r *StatsRepository) GetMonthlyStats(userID uuid.UUID, year int, month time.Month) (*model.MonthlyStats, error) {
	monthStart := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0)

	dailyData, err := r.GetDailyStatsRange(userID, monthStart, monthEnd)
	if err != nil {
		return nil, err
	}

	var totalMl, goalsMet int
	for _, d := range dailyData {
		totalMl += d.TotalMl
		if d.IsGoalMet {
			goalsMet++
		}
	}

	daysLogged := len(dailyData)
	avgDaily := 0
	if daysLogged > 0 {
		avgDaily = totalMl / daysLogged
	}

	return &model.MonthlyStats{
		Month:      monthStart.Format("2006-01"),
		TotalMl:    totalMl,
		AvgDaily:   avgDaily,
		DaysLogged: daysLogged,
		GoalsMet:   goalsMet,
		DailyData:  dailyData,
	}, nil
}
