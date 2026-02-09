package repo

import (
	"fmt"
	"hydratemate/internal/app/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StatsRepository struct {
	DB *gorm.DB
}

func NewStatsRepository(db *gorm.DB) *StatsRepository {
	return &StatsRepository{DB: db}
}

func (r *StatsRepository) GetDailyStatsRange(userID uuid.UUID, from, to time.Time) ([]model.DailyStats, error) {
	var stats []model.DailyStats
	err := r.DB.Where("user_id = ? AND stat_date >= ? AND stat_date < ?", userID, from, to).
		Order("stat_date ASC").
		Find(&stats).Error
	return stats, err
}

func (r *StatsRepository) GetWeeklyStats(userID uuid.UUID, weekStart time.Time) (*model.WeeklyStats, error) {
	weekEnd := weekStart.AddDate(0, 0, 7)

	dailyData, err := r.GetDailyStatsRange(userID, weekStart, weekEnd)
	if err != nil {
		return nil, err
	}

	var totalMl, goalsMet int
	for _, d := range dailyData {
		totalMl += d.TotalMl
		if d.IsGoalMet {
			goalsMet++
		}
	}

	daysLogged := len(dailyData)
	avgDaily := 0
	if daysLogged > 0 {
		avgDaily = totalMl / daysLogged
	}

	return &model.WeeklyStats{
		WeekStart:  weekStart,
		TotalMl:    totalMl,
		AvgDaily:   avgDaily,
		DaysLogged: daysLogged,
		GoalsMet:   goalsMet,
		DailyData:  dailyData,
	}, nil
}

func (r *StatsRepository) GetMonthlyStats(userID uuid.UUID, year int, month time.Month) (*model.MonthlyStats, error) {
	monthStart := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0)

	dailyData, err := r.GetDailyStatsRange(userID, monthStart, monthEnd)
	if err != nil {
		return nil, err
	}

	var totalMl, goalsMet int
	for _, d := range dailyData {
		totalMl += d.TotalMl
		if d.IsGoalMet {
			goalsMet++
		}
	}

	daysLogged := len(dailyData)
	avgDaily := 0
	if daysLogged > 0 {
		avgDaily = totalMl / daysLogged
	}

	return &model.MonthlyStats{
		Month:      monthStart.Format("2006-01"),
		TotalMl:    totalMl,
		AvgDaily:   avgDaily,
		DaysLogged: daysLogged,
		GoalsMet:   goalsMet,
		DailyData:  dailyData,
	}, nil
}

// HourlyStats 24小时分布统计
type HourlyData struct {
	Hour    int `json:"hour"`
	TotalMl int `json:"total_ml"`
	Count   int `json:"count"`
}

func (r *StatsRepository) GetHourlyStats(userID uuid.UUID, date time.Time) ([]HourlyData, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := startOfDay.AddDate(0, 0, 1)

	var results []HourlyData
	err := r.DB.Model(&model.WaterIntake{}).
		Select("EXTRACT(HOUR FROM intake_time) as hour, SUM(amount_ml) as total_ml, COUNT(*) as count").
		Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, startOfDay, endOfDay).
		Group("EXTRACT(HOUR FROM intake_time)").
		Order("hour ASC").
		Scan(&results).Error

	// 填充缺失的小时数据
	hourMap := make(map[int]HourlyData)
	for _, r := range results {
		hourMap[r.Hour] = r
	}

	fullData := make([]HourlyData, 24)
	for i := 0; i < 24; i++ {
		if data, exists := hourMap[i]; exists {
			fullData[i] = data
		} else {
			fullData[i] = HourlyData{Hour: i, TotalMl: 0, Count: 0}
		}
	}

	return fullData, err
}

// CategoryStats 饮品类别统计
type CategoryData struct {
	Category string `json:"category"`
	TotalMl  int    `json:"total_ml"`
	Count    int    `json:"count"`
	Percent  float64 `json:"percent"`
}

func (r *StatsRepository) GetCategoryStats(userID uuid.UUID, from, to time.Time) ([]CategoryData, error) {
	var results []CategoryData
	err := r.DB.Model(&model.WaterIntake{}).
		Select("category, SUM(amount_ml) as total_ml, COUNT(*) as count").
		Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, from, to).
		Group("category").
		Order("total_ml DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	// 计算百分比
	var total int
	for _, r := range results {
		total += r.TotalMl
	}
	if total > 0 {
		for i := range results {
			results[i].Percent = float64(results[i].TotalMl) / float64(total) * 100
		}
	}

	return results, nil
}

// TrendData 周对比趋势
type TrendData struct {
	ThisWeekTotal int     `json:"this_week_total"`
	LastWeekTotal int     `json:"last_week_total"`
	ChangePercent float64 `json:"change_percent"`
	ThisWeekAvg   int     `json:"this_week_avg"`
	LastWeekAvg   int     `json:"last_week_avg"`
	Trend         string  `json:"trend"` // "up", "down", "stable"
}

// GetDailyStats 获取指定日期的统计数据
func (r *StatsRepository) GetDailyStats(userID uuid.UUID, date time.Time) (*model.DailyStats, error) {
	normalizedDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	var stats model.DailyStats
	err := r.DB.Where("user_id = ? AND stat_date = ?", userID, normalizedDate).First(&stats).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &stats, err
}

// RecomputeStreaksFromDate 从指定日期开始向前重新计算 streak
func (r *StatsRepository) RecomputeStreaksFromDate(userID uuid.UUID, fromDate time.Time) error {
	normalizedFrom := time.Date(fromDate.Year(), fromDate.Month(), fromDate.Day(), 0, 0, 0, 0, time.UTC)

	// 获取前一天的 streak 值
	prevDay := normalizedFrom.AddDate(0, 0, -1)
	prevStats, err := r.GetDailyStats(userID, prevDay)
	if err != nil {
		return err
	}

	prevStreak := 0
	if prevStats != nil && prevStats.IsGoalMet {
		prevStreak = prevStats.StreakDays
	}

	// 从 fromDate 遍历到今天
	current := normalizedFrom
	today := time.Now().UTC().Truncate(24 * time.Hour)

	for !current.After(today) {
		stats, err := r.GetDailyStats(userID, current)
		if err != nil {
			return err
		}

		if stats == nil {
			prevStreak = 0
			current = current.AddDate(0, 0, 1)
			continue
		}

		newStreak := 0
		if stats.IsGoalMet {
			newStreak = prevStreak + 1
		}

		if stats.StreakDays != newStreak {
			r.DB.Model(&model.DailyStats{}).
				Where("user_id = ? AND stat_date = ?", userID, current).
				Update("streak_days", newStreak)
		}

		prevStreak = newStreak
		current = current.AddDate(0, 0, 1)
	}
	return nil
}

// GetCurrentStreak 获取用户当前连续达标天数
func (r *StatsRepository) GetCurrentStreak(userID uuid.UUID) (int, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	stats, err := r.GetDailyStats(userID, today)
	if err != nil {
		return 0, err
	}
	if stats != nil {
		return stats.StreakDays, nil
	}

	// 如果今天没有记录，查看昨天
	yesterday := today.AddDate(0, 0, -1)
	stats, err = r.GetDailyStats(userID, yesterday)
	if err != nil {
		return 0, err
	}
	if stats != nil && stats.IsGoalMet {
		return stats.StreakDays, nil
	}
	return 0, nil
}

func (r *StatsRepository) GetTrendStats(userID uuid.UUID, currentWeekStart time.Time) (*TrendData, error) {
	lastWeekStart := currentWeekStart.AddDate(0, 0, -7)
	currentWeekEnd := currentWeekStart.AddDate(0, 0, 7)

	// 本周数据
	thisWeekData, err := r.GetDailyStatsRange(userID, currentWeekStart, currentWeekEnd)
	if err != nil {
		return nil, err
	}

	// 上周数据
	lastWeekData, err := r.GetDailyStatsRange(userID, lastWeekStart, currentWeekStart)
	if err != nil {
		return nil, err
	}

	var thisWeekTotal, lastWeekTotal int
	for _, d := range thisWeekData {
		thisWeekTotal += d.TotalMl
	}
	for _, d := range lastWeekData {
		lastWeekTotal += d.TotalMl
	}

	thisWeekAvg := 0
	lastWeekAvg := 0
	if len(thisWeekData) > 0 {
		thisWeekAvg = thisWeekTotal / len(thisWeekData)
	}
	if len(lastWeekData) > 0 {
		lastWeekAvg = lastWeekTotal / len(lastWeekData)
	}

	changePercent := 0.0
	trend := "stable"
	if lastWeekTotal > 0 {
		changePercent = float64(thisWeekTotal-lastWeekTotal) / float64(lastWeekTotal) * 100
		if changePercent > 5 {
			trend = "up"
		} else if changePercent < -5 {
			trend = "down"
		}
	}

	return &TrendData{
		ThisWeekTotal: thisWeekTotal,
		LastWeekTotal: lastWeekTotal,
		ChangePercent: changePercent,
		ThisWeekAvg:   thisWeekAvg,
		LastWeekAvg:   lastWeekAvg,
		Trend:         trend,
	}, nil
}

// BestTimeData 最佳饮水时段
type BestTimeData struct {
	BestHour int    `json:"best_hour"`
	Window   string `json:"window"`
	TotalMl  int    `json:"total_ml"`
	AvgMl    int    `json:"avg_ml"`
	Days     int    `json:"days"`
}

// GetBestTime 获取最佳饮水时段
func (r *StatsRepository) GetBestTime(userID uuid.UUID, days int) (*BestTimeData, error) {
	from := time.Now().AddDate(0, 0, -days)

	var result struct {
		Hour    int
		TotalMl int
	}

	err := r.DB.Model(&model.WaterIntake{}).
		Select("EXTRACT(HOUR FROM intake_time) as hour, SUM(amount_ml) as total_ml").
		Where("user_id = ? AND intake_time >= ?", userID, from).
		Group("EXTRACT(HOUR FROM intake_time)").
		Order("total_ml DESC").
		Limit(1).
		Scan(&result).Error

	if err != nil {
		return nil, err
	}

	if result.TotalMl == 0 {
		return nil, nil
	}

	nextHour := (result.Hour + 1) % 24
	return &BestTimeData{
		BestHour: result.Hour,
		Window:   fmt.Sprintf("%02d:00-%02d:00", result.Hour, nextHour),
		TotalMl:  result.TotalMl,
		AvgMl:    result.TotalMl / days,
		Days:     days,
	}, nil
}

// GapInfo 饮水间隔信息
type GapInfo struct {
	Start   string `json:"start"`
	End     string `json:"end"`
	Minutes int    `json:"minutes"`
}

// GapsData 饮水间隔分析结果
type GapsData struct {
	Date              string    `json:"date"`
	ThresholdMinutes  int       `json:"threshold_minutes"`
	Gaps              []GapInfo `json:"gaps"`
	LongestGapMinutes int       `json:"longest_gap_minutes"`
}

// GetGaps 获取饮水间隔分析
func (r *StatsRepository) GetGaps(userID uuid.UUID, date time.Time, thresholdMinutes int) (*GapsData, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := startOfDay.AddDate(0, 0, 1)

	var intakes []model.WaterIntake
	err := r.DB.Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, startOfDay, endOfDay).
		Order("intake_time ASC").
		Find(&intakes).Error

	if err != nil {
		return nil, err
	}

	gaps := []GapInfo{}
	longest := 0

	if len(intakes) == 0 {
		return &GapsData{
			Date:              date.Format("2006-01-02"),
			ThresholdMinutes:  thresholdMinutes,
			Gaps:              gaps,
			LongestGapMinutes: 0,
		}, nil
	}

	// 检查从日初到首次饮水的间隔
	firstGap := int(intakes[0].IntakeTime.Sub(startOfDay).Minutes())
	if firstGap >= thresholdMinutes {
		gaps = append(gaps, GapInfo{
			Start:   "00:00",
			End:     intakes[0].IntakeTime.Format("15:04"),
			Minutes: firstGap,
		})
		if firstGap > longest {
			longest = firstGap
		}
	}

	// 检查相邻饮水之间的间隔
	for i := 1; i < len(intakes); i++ {
		gap := int(intakes[i].IntakeTime.Sub(intakes[i-1].IntakeTime).Minutes())
		if gap >= thresholdMinutes {
			gaps = append(gaps, GapInfo{
				Start:   intakes[i-1].IntakeTime.Format("15:04"),
				End:     intakes[i].IntakeTime.Format("15:04"),
				Minutes: gap,
			})
			if gap > longest {
				longest = gap
			}
		}
	}

	return &GapsData{
		Date:              date.Format("2006-01-02"),
		ThresholdMinutes:  thresholdMinutes,
		Gaps:              gaps,
		LongestGapMinutes: longest,
	}, nil
}

// HealthBreakdown 健康评分细分
type HealthBreakdown struct {
	GoalCompletion     int `json:"goal_completion"`
	Regularity         int `json:"regularity"`
	CategoryDiversity  int `json:"category_diversity"`
	IntervalUniformity int `json:"interval_uniformity"`
}

// HealthData 健康评分数据
type HealthData struct {
	Date        string          `json:"date"`
	HealthScore int             `json:"health_score"`
	Breakdown   HealthBreakdown `json:"breakdown"`
}

// GetHealthScore 计算健康评分
func (r *StatsRepository) GetHealthScore(userID uuid.UUID, date time.Time, dailyGoal int) (*HealthData, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := startOfDay.AddDate(0, 0, 1)

	var intakes []model.WaterIntake
	err := r.DB.Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, startOfDay, endOfDay).
		Order("intake_time ASC").
		Find(&intakes).Error
	if err != nil {
		return nil, err
	}

	totalMl := 0
	categories := make(map[string]int)
	for _, intake := range intakes {
		totalMl += intake.AmountMl
		categories[intake.Category]++
	}

	// 1. 目标完成度 (40分)
	goalRatio := float64(totalMl) / float64(dailyGoal)
	if goalRatio > 1 {
		goalRatio = 1
	}
	goalScore := int(goalRatio * 40)

	// 2. 饮水规律性 (30分)
	regularityScore := 0
	if len(intakes) > 0 {
		activeHours := make(map[int]bool)
		for _, intake := range intakes {
			activeHours[intake.IntakeTime.Hour()] = true
		}
		hourRatio := float64(len(activeHours)) / 8.0
		if hourRatio > 1 {
			hourRatio = 1
		}
		regularityScore = int(hourRatio * 30)
	}

	// 3. 类别多样性 (15分)
	diversityScore := 0
	numCategories := len(categories)
	if numCategories >= 3 {
		diversityScore = 15
	} else if numCategories == 2 {
		diversityScore = 10
	} else if numCategories == 1 {
		diversityScore = 5
	}

	// 4. 间隔均匀度 (15分)
	uniformityScore := 15
	if len(intakes) >= 2 {
		maxGap := 0
		for i := 1; i < len(intakes); i++ {
			gap := int(intakes[i].IntakeTime.Sub(intakes[i-1].IntakeTime).Minutes())
			if gap > maxGap {
				maxGap = gap
			}
		}
		if maxGap > 240 {
			uniformityScore = 5
		} else if maxGap > 180 {
			uniformityScore = 10
		}
	} else if len(intakes) <= 1 {
		uniformityScore = 0
	}

	totalScore := goalScore + regularityScore + diversityScore + uniformityScore
	if totalScore > 100 {
		totalScore = 100
	}

	return &HealthData{
		Date:        date.Format("2006-01-02"),
		HealthScore: totalScore,
		Breakdown: HealthBreakdown{
			GoalCompletion:     goalScore,
			Regularity:         regularityScore,
			CategoryDiversity:  diversityScore,
			IntervalUniformity: uniformityScore,
		},
	}, nil
}
