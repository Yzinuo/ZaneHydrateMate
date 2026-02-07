# Technical Design: Enhanced Hydration Features

## Overview

本设计文档描述 HydrateMate 增强功能的技术实现方案，基于多模型分析结果和用户确认的约束。

---

## Architecture Decisions

### AD1: 时区处理
- **决策**: 使用 UTC 时间
- **理由**: 保持与现有系统一致，简化计算逻辑
- **影响**: 用户在中国看到的"今日"基于 UTC 00:00，可能与本地时间有 8 小时偏差

### AD2: 健康评分计算
- **决策**: 按需计算 (Compute-on-Read)
- **理由**: 避免额外存储和同步复杂度
- **影响**: 每次请求时实时计算，无缓存

### AD3: 饮水选项布局
- **决策**: 2 列网格布局
- **理由**: 支持 7 个选项，更大触控目标
- **影响**: 需修改 `DrinkSelector.tsx` 的 grid-cols-3 为 grid-cols-2

### AD4: Streak 计算时机
- **决策**: 在 `UpsertDailyStats` 时同步更新
- **理由**: 保证数据一致性，避免异步复杂度
- **影响**: 需要前向传播计算（从修改日到今日）

---

## Backend Implementation

### New API Endpoints

```
GET /api/v1/stats/best-time?days=7
GET /api/v1/stats/gaps?date=2026-02-07
GET /api/v1/stats/health?date=2026-02-07
```

### Streak Calculation Algorithm

```go
// RecomputeStreaksFromDate 从指定日期开始向前重新计算 streak
func (r *StatsRepository) RecomputeStreaksFromDate(userID uuid.UUID, fromDate time.Time) error {
    // 1. 获取前一天的 streak 值
    prevDay := fromDate.AddDate(0, 0, -1)
    prevStats, _ := r.GetDailyStats(userID, prevDay)
    prevStreak := 0
    if prevStats != nil && prevStats.IsGoalMet {
        prevStreak = prevStats.StreakDays
    }

    // 2. 从 fromDate 遍历到今天
    current := fromDate
    today := time.Now().UTC().Truncate(24 * time.Hour)

    for !current.After(today) {
        stats, err := r.GetDailyStats(userID, current)
        if err != nil || stats == nil {
            prevStreak = 0
            current = current.AddDate(0, 0, 1)
            continue
        }

        if stats.IsGoalMet {
            stats.StreakDays = prevStreak + 1
        } else {
            stats.StreakDays = 0
        }

        r.DB.Save(stats)
        prevStreak = stats.StreakDays
        current = current.AddDate(0, 0, 1)
    }
    return nil
}
```

### Health Score Formula

```go
type HealthBreakdown struct {
    GoalCompletion    float64 `json:"goal_completion"`    // 40%
    Regularity        float64 `json:"regularity"`         // 30%
    CategoryDiversity float64 `json:"category_diversity"` // 15%
    IntervalUniformity float64 `json:"interval_uniformity"` // 15%
}

func CalculateHealthScore(
    totalMl, goalMl int,
    intakes []WaterIntake,
    categories map[string]int,
) (int, HealthBreakdown) {
    // Goal Completion (40 points max)
    goalScore := math.Min(float64(totalMl)/float64(goalMl), 1.0) * 40

    // Regularity (30 points max) - based on intake distribution
    regularityScore := calculateRegularity(intakes) * 30

    // Category Diversity (15 points max) - Shannon entropy
    diversityScore := calculateDiversity(categories) * 15

    // Interval Uniformity (15 points max) - inverse of gap variance
    uniformityScore := calculateUniformity(intakes) * 15

    total := int(goalScore + regularityScore + diversityScore + uniformityScore)
    return min(100, max(0, total)), HealthBreakdown{...}
}
```

### Best Time Analysis

```go
type BestTimeResponse struct {
    BestHour  int    `json:"best_hour"`
    Window    string `json:"window"`
    TotalMl   int    `json:"total_ml"`
    AvgMl     int    `json:"avg_ml"`
    Days      int    `json:"days"`
}

// GetBestTime 获取最佳饮水时段
func (r *StatsRepository) GetBestTime(userID uuid.UUID, days int) (*BestTimeResponse, error) {
    from := time.Now().AddDate(0, 0, -days)

    var hourlyAgg []struct {
        Hour    int
        TotalMl int
        Count   int
    }

    r.DB.Model(&WaterIntake{}).
        Select("EXTRACT(HOUR FROM intake_time) as hour, SUM(amount_ml) as total_ml, COUNT(*) as count").
        Where("user_id = ? AND intake_time >= ?", userID, from).
        Group("hour").
        Order("total_ml DESC").
        Limit(1).
        Scan(&hourlyAgg)

    if len(hourlyAgg) == 0 {
        return nil, nil
    }

    best := hourlyAgg[0]
    return &BestTimeResponse{
        BestHour: best.Hour,
        Window:   fmt.Sprintf("%02d:00-%02d:00", best.Hour, (best.Hour+1)%24),
        TotalMl:  best.TotalMl,
        AvgMl:    best.TotalMl / days,
        Days:     days,
    }, nil
}
```

### Gap Analysis

```go
type GapInfo struct {
    Start   string `json:"start"`
    End     string `json:"end"`
    Minutes int    `json:"minutes"`
}

type GapsResponse struct {
    Date              string    `json:"date"`
    ThresholdMinutes  int       `json:"threshold_minutes"`
    Gaps              []GapInfo `json:"gaps"`
    LongestGapMinutes int       `json:"longest_gap_minutes"`
}

// GetGaps 获取饮水间隔分析
func (r *StatsRepository) GetGaps(userID uuid.UUID, date time.Time, thresholdMinutes int) (*GapsResponse, error) {
    startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, time.UTC)
    endOfDay := startOfDay.Add(24 * time.Hour)

    var intakes []WaterIntake
    r.DB.Where("user_id = ? AND intake_time >= ? AND intake_time < ?", userID, startOfDay, endOfDay).
        Order("intake_time ASC").
        Find(&intakes)

    gaps := []GapInfo{}
    longest := 0

    // Check gap from day start to first intake
    if len(intakes) > 0 {
        firstGap := int(intakes[0].IntakeTime.Sub(startOfDay).Minutes())
        if firstGap >= thresholdMinutes {
            gaps = append(gaps, GapInfo{
                Start:   "00:00",
                End:     intakes[0].IntakeTime.Format("15:04"),
                Minutes: firstGap,
            })
            longest = max(longest, firstGap)
        }
    }

    // Check gaps between consecutive intakes
    for i := 1; i < len(intakes); i++ {
        gap := int(intakes[i].IntakeTime.Sub(intakes[i-1].IntakeTime).Minutes())
        if gap >= thresholdMinutes {
            gaps = append(gaps, GapInfo{
                Start:   intakes[i-1].IntakeTime.Format("15:04"),
                End:     intakes[i].IntakeTime.Format("15:04"),
                Minutes: gap,
            })
            longest = max(longest, gap)
        }
    }

    return &GapsResponse{
        Date:              date.Format("2006-01-02"),
        ThresholdMinutes:  thresholdMinutes,
        Gaps:              gaps,
        LongestGapMinutes: longest,
    }, nil
}
```

---

## Frontend Implementation

### DrinkSelector Layout Change

```tsx
// Before: grid-cols-3
// After:  grid-cols-2

const DRINK_OPTIONS: DrinkOption[] = [
    { id: 'sip', label: '一小口', amount: 30, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },
    { id: 'small', label: '小杯水', amount: 50, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },
    // ... existing options
];

// Grid change
<div className="grid grid-cols-2 gap-3 mb-4">
```

### Plant Growth Animation

```tsx
// Enhanced transition with growth effect
const plantTransitionStyles = `
  transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
  will-change-transform will-change-opacity
`;

// Active state
const activeStyles = 'opacity-100 scale-100';
// Inactive state
const inactiveStyles = 'opacity-0 scale-75'; // Changed from scale-90 to scale-75 for more growth feel

// Glow pulse during transition
const glowPulseAnimation = `
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }
`;
```

### Capacitor Configuration

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hydratemate.app',
  appName: 'HydrateMate',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    }
  }
};

export default config;
```

### Self-Hosted Resources

```html
<!-- index.html - Remove external CDN -->
<!-- REMOVE: <script src="https://cdn.tailwindcss.com"></script> -->
<!-- REMOVE: <link href="https://fonts.googleapis.com/..." rel="stylesheet"> -->

<!-- ADD: Local font -->
<style>
  @font-face {
    font-family: 'Noto Sans SC';
    src: url('/fonts/NotoSansSC-Regular.woff2') format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Noto Sans SC';
    src: url('/fonts/NotoSansSC-Bold.woff2') format('woff2');
    font-weight: 700;
  }
</style>
```

---

## File Change Summary

### Backend (Go)

| File | Changes |
|------|---------|
| `backend/internal/app/repo/stats_repo.go` | Add `GetBestTime`, `GetGaps`, `RecomputeStreaksFromDate` |
| `backend/internal/app/service/stats_service.go` | Add `GetBestTime`, `GetGaps`, `CalculateHealthScore` |
| `backend/internal/app/handler/stats_handler.go` | Add handlers for `/best-time`, `/gaps`, `/health` |
| `backend/internal/app/repo/intake_repo.go` | Modify `UpsertDailyStats` to call streak recomputation |
| `backend/cmd/api/main.go` | Register new routes |

### Frontend (React/TypeScript)

| File | Changes |
|------|---------|
| `frontend/components/DrinkSelector.tsx` | Add 30ml option, change to 2-column grid |
| `frontend/pages/Home.tsx` | Enhance plant animation CSS |
| `frontend/pages/Stats.tsx` | Add streak, health score, gap visualizations |
| `frontend/api.ts` | Add `getBestTime`, `getGaps`, `getHealth` |
| `frontend/index.html` | Remove CDN, add local fonts |
| `frontend/public/fonts/` | Add Noto Sans SC woff2 files |

### New Files

| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor configuration |
| `frontend/public/fonts/*.woff2` | Self-hosted fonts |

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Backdated intake edits break streaks | `RecomputeStreaksFromDate` propagates forward |
| Health score inconsistency | Compute-on-read ensures always fresh |
| Animation jank on low-end devices | `will-change` + CSS-only transitions |
| Blocked CDN in China | All resources bundled locally |
