package service

import (
	"testing"
	"time"

	"hydratemate/internal/app/model"
	"hydratemate/internal/app/repo"

	"github.com/google/uuid"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupIntakeTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to database: %v", err)
	}

	err = db.AutoMigrate(&model.WaterIntake{}, &model.UserSettings{}, &model.DailyStats{})
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func TestIntakeService(t *testing.T) {
	db := setupIntakeTestDB(t)
	intakeRepo := repo.NewIntakeRepository(db)
	settingsRepo := repo.NewSettingsRepository(db)
	intakeService := NewIntakeService(db, intakeRepo, settingsRepo)

	userID := uuid.New()

	t.Run("Add Intake Success", func(t *testing.T) {
		input := AddIntakeInput{
			AmountMl:   500,
			Category:   "water",
			IntakeTime: time.Now(),
		}

		intake, err := intakeService.AddIntake(userID, input)
		if err != nil {
			t.Fatalf("AddIntake failed: %v", err)
		}

		if intake.AmountMl != 500 {
			t.Errorf("Expected 500ml, got %d", intake.AmountMl)
		}

		// Verify stats
		var stats model.DailyStats
		err = db.Where("user_id = ?", userID).First(&stats).Error
		if err != nil {
			t.Fatalf("Failed to find stats: %v", err)
		}

		if stats.TotalMl != 500 {
			t.Errorf("Expected total 500ml in stats, got %d", stats.TotalMl)
		}
	})

	t.Run("Add Multiple Intakes", func(t *testing.T) {
		input := AddIntakeInput{
			AmountMl:   250,
			Category:   "water",
			IntakeTime: time.Now(),
		}

		_, err := intakeService.AddIntake(userID, input)
		if err != nil {
			t.Fatalf("AddIntake failed: %v", err)
		}

		var stats model.DailyStats
		db.Where("user_id = ?", userID).First(&stats)
		if stats.TotalMl != 750 {
			t.Errorf("Expected total 750ml in stats, got %d", stats.TotalMl)
		}
	})

	t.Run("Delete Intake", func(t *testing.T) {
		// First add one to delete
		intake, _ := intakeService.AddIntake(userID, AddIntakeInput{AmountMl: 100})
		
		err := intakeService.DeleteIntake(userID, intake.ID)
		if err != nil {
			t.Fatalf("DeleteIntake failed: %v", err)
		}

		var stats model.DailyStats
		db.Where("user_id = ?", userID).First(&stats)
		if stats.TotalMl != 750 { // Back to 750
			t.Errorf("Expected total 750ml after deletion, got %d", stats.TotalMl)
		}
	})
}
