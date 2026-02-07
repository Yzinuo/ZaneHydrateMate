package reminder

import (
	"log"
	"sync"
	"time"

	"hydratemate/internal/app/repo"
	ws "hydratemate/internal/app/websocket"

	"github.com/google/uuid"
)

// Scheduler 提醒调度器
type Scheduler struct {
	hub          *ws.Hub
	settingsRepo *repo.SettingsRepository
	intakeRepo   *repo.IntakeRepository
	users        map[uuid.UUID]*userReminder
	mu           sync.RWMutex
	stopChan     chan struct{}
}

type userReminder struct {
	lastReminder time.Time
	intervalMin  int // 提醒间隔（分钟）
}

// NewScheduler 创建提醒调度器
func NewScheduler(hub *ws.Hub, settingsRepo *repo.SettingsRepository, intakeRepo *repo.IntakeRepository) *Scheduler {
	return &Scheduler{
		hub:          hub,
		settingsRepo: settingsRepo,
		intakeRepo:   intakeRepo,
		users:        make(map[uuid.UUID]*userReminder),
		stopChan:     make(chan struct{}),
	}
}

// Start 启动调度器
func (s *Scheduler) Start() {
	go s.run()
	log.Println("Reminder scheduler started")
}

// Stop 停止调度器
func (s *Scheduler) Stop() {
	close(s.stopChan)
}

// RegisterUser 注册用户到调度器
func (s *Scheduler) RegisterUser(userID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()

	settings, err := s.settingsRepo.GetByUserID(userID)
	if err != nil {
		log.Printf("Failed to get settings for user %s: %v", userID, err)
		return
	}

	// 根据 ReminderIntensity (1-10) 计算间隔
	// 1 = 每120分钟, 10 = 每30分钟
	interval := 120 - (settings.ReminderIntensity-1)*10
	if interval < 30 {
		interval = 30
	}

	s.users[userID] = &userReminder{
		lastReminder: time.Now(),
		intervalMin:  interval,
	}
}

// UnregisterUser 从调度器移除用户
func (s *Scheduler) UnregisterUser(userID uuid.UUID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.users, userID)
}

// run 主循环
func (s *Scheduler) run() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.checkAndSendReminders()
		}
	}
}

// checkAndSendReminders 检查并发送提醒
func (s *Scheduler) checkAndSendReminders() {
	s.mu.RLock()
	usersCopy := make(map[uuid.UUID]*userReminder)
	for k, v := range s.users {
		usersCopy[k] = v
	}
	s.mu.RUnlock()

	now := time.Now()

	for userID, reminder := range usersCopy {
		// 检查是否在线
		if !s.hub.IsUserOnline(userID) {
			continue
		}

		// 检查是否到了提醒时间
		if now.Sub(reminder.lastReminder) < time.Duration(reminder.intervalMin)*time.Minute {
			continue
		}

		// 检查是否在安静时段
		if s.isQuietHours(userID, now) {
			continue
		}

		// 获取今日饮水量
		todayIntake, goalMl := s.getTodayProgress(userID)

		// 如果已达标，减少提醒频率
		if todayIntake >= goalMl {
			continue
		}

		// 发送提醒
		s.sendReminder(userID, todayIntake, goalMl)

		// 更新最后提醒时间
		s.mu.Lock()
		if ur, ok := s.users[userID]; ok {
			ur.lastReminder = now
		}
		s.mu.Unlock()
	}
}

// isQuietHours 检查是否在安静时段
func (s *Scheduler) isQuietHours(userID uuid.UUID, now time.Time) bool {
	settings, err := s.settingsRepo.GetByUserID(userID)
	if err != nil {
		return false
	}

	currentTime := now.Format("15:04")
	start := settings.QuietHoursStart
	end := settings.QuietHoursEnd

	// 处理跨午夜的情况 (22:00 - 08:00)
	if start > end {
		return currentTime >= start || currentTime < end
	}
	return currentTime >= start && currentTime < end
}

// getTodayProgress 获取今日饮水进度
func (s *Scheduler) getTodayProgress(userID uuid.UUID) (int, int) {
	settings, _ := s.settingsRepo.GetByUserID(userID)
	goalMl := settings.DailyGoalMl

	today := time.Now()
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.Local)
	endOfDay := startOfDay.AddDate(0, 0, 1)

	intakes, _ := s.intakeRepo.GetByDateRange(userID, startOfDay, endOfDay)

	var totalMl int
	for _, intake := range intakes {
		totalMl += intake.AmountMl
	}

	return totalMl, goalMl
}

// sendReminder 发送提醒
func (s *Scheduler) sendReminder(userID uuid.UUID, currentMl, goalMl int) {
	remaining := goalMl - currentMl
	percent := float64(currentMl) / float64(goalMl) * 100

	var title, body string
	if percent < 30 {
		title = "该喝水啦 💧"
		body = "今天才喝了一点点，来杯水吧~"
	} else if percent < 60 {
		title = "补充水分 🌿"
		body = "已经过半啦，继续保持！"
	} else if percent < 90 {
		title = "快达标了 🌱"
		body = "再喝一点就达标啦！"
	} else {
		title = "最后冲刺 🎯"
		body = "就差一点点了！"
	}

	payload := ws.ReminderPayload{
		Title:     title,
		Body:      body + " 还差" + formatMl(remaining),
		CurrentMl: currentMl,
		GoalMl:    goalMl,
		Timestamp: time.Now().Unix(),
	}

	s.hub.SendToUser(userID, "reminder", payload)
	log.Printf("Sent reminder to user %s: %s", userID, body)
}

func formatMl(ml int) string {
	if ml >= 1000 {
		return string(rune('0'+ml/1000)) + "." + string(rune('0'+(ml%1000)/100)) + "L"
	}
	return string(rune('0'+ml/100)) + string(rune('0'+(ml%100)/10)) + string(rune('0'+ml%10)) + "ml"
}
