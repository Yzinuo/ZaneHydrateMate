package handler

import (
	"net/http"
	"strconv"
	"time"

	"hydratemate/internal/app/middleware"
	"hydratemate/internal/app/service"

	"github.com/gin-gonic/gin"
)

type IntakeHandler struct {
	IntakeService *service.IntakeService
}

func NewIntakeHandler(intakeService *service.IntakeService) *IntakeHandler {
	return &IntakeHandler{IntakeService: intakeService}
}

type addIntakeRequest struct {
	AmountMl   int    `json:"amount_ml" binding:"required,gt=0"`
	Category   string `json:"category"`
	IntakeTime string `json:"intake_time"`
}

func (h *IntakeHandler) AddIntake(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req addIntakeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	var intakeTime time.Time
	if req.IntakeTime != "" {
		var err error
		intakeTime, err = time.Parse(time.RFC3339, req.IntakeTime)
		if err != nil {
			intakeTime = time.Now()
		}
	} else {
		intakeTime = time.Now()
	}

	input := service.AddIntakeInput{
		AmountMl:   req.AmountMl,
		Category:   req.Category,
		IntakeTime: intakeTime,
	}

	intake, err := h.IntakeService.AddIntake(userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_add_intake"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":          intake.ID,
		"amount_ml":   intake.AmountMl,
		"category":    intake.Category,
		"intake_time": intake.IntakeTime,
	})
}

func (h *IntakeHandler) ListIntakes(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Parse query params
	fromStr := c.DefaultQuery("from", time.Now().AddDate(0, 0, -7).Format("2006-01-02"))
	toStr := c.DefaultQuery("to", time.Now().AddDate(0, 0, 1).Format("2006-01-02"))
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "20")

	from, _ := time.Parse("2006-01-02", fromStr)
	to, _ := time.Parse("2006-01-02", toStr)
	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	intakes, total, err := h.IntakeService.ListIntakes(userID, from, to, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_list_intakes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"intakes":   intakes,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (h *IntakeHandler) DeleteIntake(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	intakeIDStr := c.Param("id")
	intakeID, err := parseUUID(intakeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_intake_id"})
		return
	}

	if err := h.IntakeService.DeleteIntake(userID, intakeID); err != nil {
		if err == service.ErrIntakeNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "intake_not_found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_delete_intake"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
