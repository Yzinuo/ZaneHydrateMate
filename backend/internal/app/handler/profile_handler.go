package handler

import (
	"net/http"

	"hydratemate/internal/app/middleware"
	"hydratemate/internal/app/service"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	ProfileService *service.ProfileService
}

func NewProfileHandler(profileService *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{ProfileService: profileService}
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	resp, err := h.ProfileService.GetProfile(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_get_profile"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

type updateProfileRequest struct {
	HeightCm       int  `json:"height_cm" binding:"required,gt=0"`
	WeightKg       int  `json:"weight_kg" binding:"required,gt=0"`
	Age            int  `json:"age" binding:"required,gt=0"`
	ApplyRecommend bool `json:"apply_recommend"`
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_request"})
		return
	}

	input := service.UpdateProfileInput{
		HeightCm:       req.HeightCm,
		WeightKg:       req.WeightKg,
		Age:            req.Age,
		ApplyRecommend: req.ApplyRecommend,
	}

	resp, err := h.ProfileService.UpdateProfile(userID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_profile"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
