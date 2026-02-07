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

// Helper to parse int with default
func parseInt(s string, defaultVal int) int {
	if v, err := strconv.Atoi(s); err == nil {
		return v
	}
	return defaultVal
}
