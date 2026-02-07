package repo

import (
	"hydratemate/internal/app/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IntakeRepository struct {
	DB *gorm.DB
}

func NewIntakeRepository(db *gorm.DB) *IntakeRepository {
	return &IntakeRepository{DB: db}
}

func (r *IntakeRepository) Create(intake *model.WaterIntake) error {
	return r.DB.Create(intake).Error
}

func (r *IntakeRepository) FindByID(userID, intakeID uuid.UUID) (*model.WaterIntake, error) {
	var intake model.WaterIntake
	err := r.DB.Where("id = ? AND user_id = ?", intakeID, userID).First(&intake).Error
	return &intake, err
}

func (r *IntakeRepository) ListByUserAndRange(userID uuid.UUID, from, to time.Time, page, pageSize int) ([]model.WaterIntake, int64, error) {
	var intakes []model.WaterIntake
	var total int64

	query := r.DB.Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, from, to)

	if err := query.Model(&model.WaterIntake{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := query.Order("intake_time DESC").Offset(offset).Limit(pageSize).Find(&intakes).Error
	return intakes, total, err
}

func (r *IntakeRepository) Delete(userID, intakeID uuid.UUID) error {
	return r.DB.Where("id = ? AND user_id = ?", intakeID, userID).Delete(&model.WaterIntake{}).Error
}

func (r *IntakeRepository) GetDailyTotal(userID uuid.UUID, date time.Time) (int, error) {
	var total int
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	err := r.DB.Model(&model.WaterIntake{}).
		Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, startOfDay, endOfDay).
		Select("COALESCE(SUM(amount_ml), 0)").
		Scan(&total).Error

	return total, err
}

// UpsertDailyStats updates or inserts daily stats with the given delta
func (r *IntakeRepository) UpsertDailyStats(userID uuid.UUID, statDate time.Time, deltaMl int, dailyGoal int) error {
	date := time.Date(statDate.Year(), statDate.Month(), statDate.Day(), 0, 0, 0, 0, time.UTC)

	stats := model.DailyStats{
		UserID:   userID,
		StatDate: date,
		TotalMl:  deltaMl,
	}

	return r.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "stat_date"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"total_ml":    gorm.Expr("daily_stats.total_ml + ?", deltaMl),
			"is_goal_met": gorm.Expr("(daily_stats.total_ml + ?) >= ?", deltaMl, dailyGoal),
		}),
	}).Create(&stats).Error
}
