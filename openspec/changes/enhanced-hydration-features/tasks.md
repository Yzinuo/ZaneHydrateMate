# Implementation Tasks: Enhanced Hydration Features

## Overview

本文档包含零决策的可执行任务列表，按依赖顺序排列。
**范围**: R1 (饮水选项) + R2 (数据分析) + R3 (植物动画)
**排除**: Capacitor 打包（用户自行处理）

---

## Phase 1: 前端功能开发

### T1.1: 添加 30ml 饮水选项并调整布局
**优先级**: P1
**文件**: `frontend/components/DrinkSelector.tsx`

**变更**:
```typescript
// Line 15: 新增选项到 DRINK_OPTIONS 数组开头
{ id: 'sip', label: '一小口', amount: 30, category: 'water', icon: <Droplet className="w-5 h-5" />, color: 'bg-blue-500/20 text-blue-400' },

// Line 79: 修改网格布局
<div className="grid grid-cols-2 gap-3 mb-4">
```

**验收**:
- [ ] 显示 7 个选项，2 列布局
- [ ] 30ml 选项可正常记录到后端

---

### T1.2: 优化植物生长动画
**优先级**: P1
**文件**: `frontend/pages/Home.tsx`

**变更 1** (植物图片 ~Line 118):
```typescript
className={`absolute max-h-[70%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]
  transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
  will-change-[transform,opacity]
  ${index === currentStageIndex
    ? 'opacity-100 scale-100'
    : 'opacity-0 scale-75'  // 从 scale-90 改为 scale-75
  }`}
```

**变更 2** (发光效果 ~Line 104):
```typescript
<div className={`absolute w-32 h-32 rounded-full transition-all duration-1000 ${
  isTransitioning
    ? 'animate-pulse bg-gradient-radial from-yellow-300/60 via-green-400/30 to-transparent blur-[50px] scale-[1.5]'
    : currentStageIndex >= 2
      ? 'bg-gradient-radial from-yellow-300/40 via-green-400/20 to-transparent blur-[40px] scale-[1.5]'
      : 'opacity-0'
}`}></div>
```

**验收**:
- [ ] 植物切换时有从小到大的生长动画 (~1秒)
- [ ] 切换时有发光脉冲效果
- [ ] 无闪烁或跳跃

---

### T1.3: 添加统计 API 客户端方法
**优先级**: P1
**文件**: `frontend/api.ts`

**添加类型和方法**:
```typescript
// 新增类型
export interface BestTimeResponse {
  best_hour: number;
  window: string;
  total_ml: number;
  avg_ml: number;
  days: number;
}

export interface GapInfo {
  start: string;
  end: string;
  minutes: number;
}

export interface GapsResponse {
  date: string;
  threshold_minutes: number;
  gaps: GapInfo[];
  longest_gap_minutes: number;
}

export interface HealthResponse {
  date: string;
  health_score: number;
  breakdown: {
    goal_completion: number;
    regularity: number;
    category_diversity: number;
    interval_uniformity: number;
  };
}

// 添加到 statsApi 对象
async getBestTime(days: number = 7): Promise<BestTimeResponse | null> { ... }
async getGaps(date: string, threshold: number = 240): Promise<GapsResponse> { ... }
async getHealth(date: string): Promise<HealthResponse> { ... }
```

**验收**: TypeScript 编译通过

---

### T1.4: 更新统计页面 UI
**优先级**: P2
**文件**: `frontend/pages/Stats.tsx`

**添加组件**:
1. **Streak 卡片**: 🔥 图标 + "连续达标 X 天"
2. **健康评分**: 径向进度条 (0-100)
3. **最佳时段**: 时钟图标 + "黄金饮水时段: 09:00-10:00"
4. **间隔警告**: 如存在 > 4 小时间隔显示提示

**验收**: 统计页面显示新增的分析数据

---

## Phase 2: 后端功能开发

### T2.1: 实现 Streak 计算逻辑
**优先级**: P0 (核心功能修复)
**文件**: `backend/internal/app/repo/stats_repo.go`

**添加函数**:
```go
// RecomputeStreaksFromDate 从指定日期开始向前重新计算 streak
func (r *StatsRepository) RecomputeStreaksFromDate(userID uuid.UUID, fromDate time.Time) error {
    prevDay := fromDate.AddDate(0, 0, -1)
    prevStats, _ := r.GetDailyStats(userID, prevDay)
    prevStreak := 0
    if prevStats != nil && prevStats.IsGoalMet {
        prevStreak = prevStats.StreakDays
    }

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

**验收**: 单元测试验证连续达标和中断场景

---

### T2.2: 在 UpsertDailyStats 中调用 Streak 计算
**优先级**: P0
**文件**: `backend/internal/app/repo/intake_repo.go`

**修改** `UpsertDailyStats` 函数末尾:
```go
// 重新计算从该日期开始的 streak (异步)
go func() {
    statsRepo := NewStatsRepository(r.DB)
    statsRepo.RecomputeStreaksFromDate(userID, statDate)
}()
```

**验收**: 添加/删除 intake 后 streak_days 自动更新

---

### T2.3: 实现 Best Time API
**优先级**: P1
**文件**:
- `backend/internal/app/repo/stats_repo.go` - 添加 `GetBestTime`
- `backend/internal/app/service/stats_service.go` - 添加服务方法
- `backend/internal/app/handler/stats_handler.go` - 添加 handler

**端点**: `GET /api/v1/stats/best-time?days=7`

**响应**:
```json
{
  "best_hour": 9,
  "window": "09:00-10:00",
  "total_ml": 1250,
  "avg_ml": 178,
  "days": 7
}
```

**验收**: curl 测试返回正确 JSON

---

### T2.4: 实现 Gaps API
**优先级**: P1
**文件**: 同 T2.3

**端点**: `GET /api/v1/stats/gaps?date=2026-02-07&threshold=240`

**响应**:
```json
{
  "date": "2026-02-07",
  "threshold_minutes": 240,
  "gaps": [
    { "start": "08:00", "end": "14:30", "minutes": 390 }
  ],
  "longest_gap_minutes": 390
}
```

**验收**: curl 测试返回正确 JSON

---

### T2.5: 实现 Health Score API
**优先级**: P1
**文件**: 同 T2.3

**端点**: `GET /api/v1/stats/health?date=2026-02-07`

**计算公式**:
- goal_completion (40%): `min(total_ml / goal_ml, 1.0) * 40`
- regularity (30%): 基于饮水时间分布
- category_diversity (15%): 基于饮品类别数量
- interval_uniformity (15%): 基于间隔均匀度

**响应**:
```json
{
  "date": "2026-02-07",
  "health_score": 78,
  "breakdown": {
    "goal_completion": 32,
    "regularity": 24,
    "category_diversity": 12,
    "interval_uniformity": 10
  }
}
```

**验收**: curl 测试返回 0-100 范围的分数

---

### T2.6: 注册新路由
**优先级**: P1
**文件**: `backend/cmd/api/main.go`

**添加**:
```go
stats := v1.Group("/stats")
{
    // ... 现有路由
    stats.GET("/best-time", statsHandler.GetBestTime)
    stats.GET("/gaps", statsHandler.GetGaps)
    stats.GET("/health", statsHandler.GetHealth)
}
```

**验收**: 所有新端点可访问

---

## Task Dependencies

```
T2.1 ──> T2.2 ──┬──> T2.3 ──> T2.6
                ├──> T2.4 ──> T2.6
                └──> T2.5 ──> T2.6
                           │
T1.1 (独立)                v
T1.2 (独立)           T1.3 ──> T1.4
```

---

## Summary

| Phase | Tasks | 预估工时 |
|-------|-------|----------|
| Phase 1: 前端功能 | T1.1-T1.4 | 4-5 小时 |
| Phase 2: 后端功能 | T2.1-T2.6 | 6-8 小时 |
| **总计** | **10 任务** | **10-13 小时** |

---

## 执行顺序建议

1. **先后端**: T2.1 → T2.2 → T2.3/T2.4/T2.5 (可并行) → T2.6
2. **再前端**: T1.1, T1.2 (可并行) → T1.3 → T1.4
