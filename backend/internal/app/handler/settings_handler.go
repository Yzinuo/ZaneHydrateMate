package handler

import (
	"net/http"

	"hydratemate/internal/app/middleware"
	"hydratemate/internal/app/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SettingsHandler struct {
	SettingsService *service.SettingsService
}

func NewSettingsHandler(settingsService *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{SettingsService: settingsService}
}

func (h *SettingsHandler) GetSettings(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	settings, err := h.SettingsService.GetSettings(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"daily_goal_ml":       settings.DailyGoalMl,
		"reminder_intensity":  settings.ReminderIntensity,
		"quiet_hours_start":   settings.QuietHoursStart,
		"quiet_hours_end":     settings.QuietHoursEnd,
	})
}

type updateSettingsRequest struct {
	DailyGoalMl       *int    `json:"daily_goal_ml"`
	ReminderIntensity *int    `json:"reminder_intensity"`
	QuietHoursStart   *string `json:"quiet_hours_start"`
	QuietHoursEnd     *string `json:"quiet_hours_end"`
}

func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req updateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	input := service.UpdateSettingsInput{
		DailyGoalMl:       req.DailyGoalMl,
		ReminderIntensity: req.ReminderIntensity,
		QuietHoursStart:   req.QuietHoursStart,
		QuietHoursEnd:     req.QuietHoursEnd,
	}

	settings, err := h.SettingsService.UpdateSettings(userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"daily_goal_ml":       settings.DailyGoalMl,
		"reminder_intensity":  settings.ReminderIntensity,
		"quiet_hours_start":   settings.QuietHoursStart,
		"quiet_hours_end":     settings.QuietHoursEnd,
	})
}

// parseUUID helper function
func parseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
