package service

import (
	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"
	"time"

	"github.com/google/uuid"
)

type StatsService struct {
	StatsRepo *repo.StatsRepository
}

func NewStatsService(statsRepo *repo.StatsRepository) *StatsService {
	return &StatsService{StatsRepo: statsRepo}
}

func (s *StatsService) GetWeeklyStats(userID uuid.UUID, weekStart time.Time) (*model.WeeklyStats, error) {
	// Normalize to start of week (Monday)
	weekday := int(weekStart.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	weekStart = weekStart.AddDate(0, 0, -(weekday - 1))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, time.UTC)

	return s.StatsRepo.GetWeeklyStats(userID, weekStart)
}

func (s *StatsService) GetMonthlyStats(userID uuid.UUID, year int, month time.Month) (*model.MonthlyStats, error) {
	return s.StatsRepo.GetMonthlyStats(userID, year, month)
}
