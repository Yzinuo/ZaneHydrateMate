package handler

import (
	"net/http"
	"strconv"
	"time"

	"hydratemate/internal/app/middleware"
	"hydratemate/internal/app/service"

	"github.com/gin-gonic/gin"
)

type StatsHandler struct {
	StatsService *service.StatsService
}

func NewStatsHandler(statsService *service.StatsService) *StatsHandler {
	return &StatsHandler{StatsService: statsService}
}

func (h *StatsHandler) GetWeeklyStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	weekStartStr := c.DefaultQuery("week_start", time.Now().Format("2006-01-02"))
	weekStart, err := time.Parse("2006-01-02", weekStartStr)
	if err != nil {
		weekStart = time.Now()
	}

	stats, err := h.StatsService.GetWeeklyStats(userID, weekStart)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *StatsHandler) GetMonthlyStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	monthStr := c.DefaultQuery("month", time.Now().Format("2006-01"))
	parsed, err := time.Parse("2006-01", monthStr)
	if err != nil {
		parsed = time.Now()
	}

	year := parsed.Year()
	month := parsed.Month()

	stats, err := h.StatsService.GetMonthlyStats(userID, year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *StatsHandler) GetTodayStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	today := time.Now()
	weekStart := today.AddDate(0, 0, -int(today.Weekday()))

	stats, err := h.StatsService.GetWeeklyStats(userID, weekStart)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_stats"})
		return
	}

	// Find today's stats
	todayDate := today.Format("2006-01-02")
	var todayMl int
	for _, d := range stats.DailyData {
		if d.StatDate.Format("2006-01-02") == todayDate {
			todayMl = d.TotalMl
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"today_ml":   todayMl,
		"week_total": stats.TotalMl,
		"week_avg":   stats.AvgDaily,
		"goals_met":  stats.GoalsMet,
	})
}

// GetHourlyStats 获取24小时分布
func (h *StatsHandler) GetHourlyStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		date = time.Now()
	}

	stats, err := h.StatsService.GetHourlyStats(userID, date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_hourly_stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"date":   date.Format("2006-01-02"),
		"hourly": stats,
	})
}

// GetCategoryStats 获取饮品类别统计
func (h *StatsHandler) GetCategoryStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	days := parseInt(c.DefaultQuery("days", "7"), 7)
	if days < 1 || days > 365 {
		days = 7
	}

	stats, err := h.StatsService.GetCategoryStats(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_category_stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"days":       days,
		"categories": stats,
	})
}

// GetTrendStats 获取周对比趋势
func (h *StatsHandler) GetTrendStats(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	trends, err := h.StatsService.GetTrendStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_trends"})
		return
	}

	c.JSON(http.StatusOK, trends)
}

// Helper to parse int with default
func parseInt(s string, defaultVal int) int {
	if v, err := strconv.Atoi(s); err == nil {
		return v
	}
	return defaultVal
}

// GetCurrentStreak 获取当前连续达标天数
func (h *StatsHandler) GetCurrentStreak(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	streak, err := h.StatsService.GetCurrentStreak(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_streak"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"streak_days": streak,
	})
}

// GetBestTime 获取最佳饮水时段
func (h *StatsHandler) GetBestTime(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	days := parseInt(c.DefaultQuery("days", "7"), 7)

	result, err := h.StatsService.GetBestTime(userID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_best_time"})
		return
	}

	if result == nil {
		c.JSON(http.StatusOK, gin.H{"message": "no_data"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetGaps 获取饮水间隔分析
func (h *StatsHandler) GetGaps(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		date = time.Now()
	}

	threshold := parseInt(c.DefaultQuery("threshold", "240"), 240)

	result, err := h.StatsService.GetGaps(userID, date, threshold)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_gaps"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetHealthScore 获取健康评分
func (h *StatsHandler) GetHealthScore(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		date = time.Now()
	}

	dailyGoal := parseInt(c.DefaultQuery("goal", "2000"), 2000)

	result, err := h.StatsService.GetHealthScore(userID, date, dailyGoal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_health_score"})
		return
	}

	c.JSON(http.StatusOK, result)
}
