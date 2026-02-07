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

// GetHourlyStats 获取24小时分布
func (s *StatsService) GetHourlyStats(userID uuid.UUID, date time.Time) ([]repo.HourlyData, error) {
	return s.StatsRepo.GetHourlyStats(userID, date)
}

// GetCategoryStats 获取饮品类别统计
func (s *StatsService) GetCategoryStats(userID uuid.UUID, days int) ([]repo.CategoryData, error) {
	to := time.Now()
	from := to.AddDate(0, 0, -days)
	return s.StatsRepo.GetCategoryStats(userID, from, to)
}

// GetTrendStats 获取周对比趋势
func (s *StatsService) GetTrendStats(userID uuid.UUID) (*repo.TrendData, error) {
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	weekStart := now.AddDate(0, 0, -(weekday - 1))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, time.UTC)

	return s.StatsRepo.GetTrendStats(userID, weekStart)
}

// GetCurrentStreak 获取当前连续达标天数
func (s *StatsService) GetCurrentStreak(userID uuid.UUID) (int, error) {
	return s.StatsRepo.GetCurrentStreak(userID)
}

// GetBestTime 获取最佳饮水时段
func (s *StatsService) GetBestTime(userID uuid.UUID, days int) (*repo.BestTimeData, error) {
	if days < 1 || days > 30 {
		days = 7
	}
	return s.StatsRepo.GetBestTime(userID, days)
}

// GetGaps 获取饮水间隔分析
func (s *StatsService) GetGaps(userID uuid.UUID, date time.Time, thresholdMinutes int) (*repo.GapsData, error) {
	if thresholdMinutes < 60 || thresholdMinutes > 480 {
		thresholdMinutes = 240
	}
	return s.StatsRepo.GetGaps(userID, date, thresholdMinutes)
}

// GetHealthScore 获取健康评分
func (s *StatsService) GetHealthScore(userID uuid.UUID, date time.Time, dailyGoal int) (*repo.HealthData, error) {
	if dailyGoal <= 0 {
		dailyGoal = 2000
	}
	return s.StatsRepo.GetHealthScore(userID, date, dailyGoal)
}
