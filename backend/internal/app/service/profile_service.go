package service

import (
	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"

	"github.com/google/uuid"
)

type ProfileService struct {
	ProfileRepo  *repo.ProfileRepository
	SettingsRepo *repo.SettingsRepository
}

func NewProfileService(profileRepo *repo.ProfileRepository, settingsRepo *repo.SettingsRepository) *ProfileService {
	return &ProfileService{
		ProfileRepo:  profileRepo,
		SettingsRepo: settingsRepo,
	}
}

type ProfileResponse struct {
	Profile        *model.UserProfile `json:"profile"`
	RecommendedMl  int                `json:"recommended_ml"`
	CurrentGoalMl  int                `json:"current_goal_ml"`
}

func (s *ProfileService) GetProfile(userID uuid.UUID) (*ProfileResponse, error) {
	profile, err := s.ProfileRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	settings, err := s.SettingsRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	return &ProfileResponse{
		Profile:       profile,
		RecommendedMl: profile.CalcRecommendedDailyMl(),
		CurrentGoalMl: settings.DailyGoalMl,
	}, nil
}

type UpdateProfileInput struct {
	HeightCm       int  `json:"height_cm"`
	WeightKg       int  `json:"weight_kg"`
	Age            int  `json:"age"`
	ApplyRecommend bool `json:"apply_recommend"`
}

func (s *ProfileService) UpdateProfile(userID uuid.UUID, input UpdateProfileInput) (*ProfileResponse, error) {
	profile := &model.UserProfile{
		UserID:   userID,
		HeightCm: input.HeightCm,
		WeightKg: input.WeightKg,
		Age:      input.Age,
	}

	if err := s.ProfileRepo.Upsert(profile); err != nil {
		return nil, err
	}

	recommendedMl := profile.CalcRecommendedDailyMl()

	settings, err := s.SettingsRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	// Apply recommended goal if requested
	if input.ApplyRecommend {
		settings.DailyGoalMl = recommendedMl
		if err := s.SettingsRepo.Update(settings); err != nil {
			return nil, err
		}
	}

	return &ProfileResponse{
		Profile:       profile,
		RecommendedMl: recommendedMl,
		CurrentGoalMl: settings.DailyGoalMl,
	}, nil
}
