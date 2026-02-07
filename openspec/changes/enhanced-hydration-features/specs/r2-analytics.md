# R2: 增强数据分析

## Requirement

实现完整的数据分析功能集：连续达标天数、最佳饮水时段、饮水间隔分析、综合健康评分。

---

## Specifications

### S2.1: 连续达标天数 (Streak)

**触发条件**: 每次饮水记录添加/删除后
**计算逻辑**:
```
if current_day.is_goal_met && previous_day.is_goal_met:
    streak_days = previous_day.streak_days + 1
elif current_day.is_goal_met:
    streak_days = 1
else:
    streak_days = 0
```

**验收标准**:
- [ ] `DailyStats.StreakDays` 在每次 `UpsertDailyStats` 后正确更新
- [ ] 前向传播：修改历史日期时重新计算到今天
- [ ] 缺失日期视为未达标 (streak 重置)

**API 响应** (现有 `/stats/weekly` 等):
```json
{
  "daily_data": [
    { "stat_date": "2026-02-07", "streak_days": 5, ... }
  ]
}
```

### S2.2: 最佳饮水时段

**端点**: `GET /api/v1/stats/best-time?days=7`

**计算逻辑**:
- 聚合过去 N 天的 intake 按小时分组
- 返回 total_ml 最高的小时

**响应格式**:
```json
{
  "best_hour": 9,
  "window": "09:00-10:00",
  "total_ml": 1250,
  "avg_ml": 178,
  "days": 7
}
```

**验收标准**:
- [ ] 默认 days=7，支持 1-30 范围
- [ ] 无数据时返回 `null` 或空对象
- [ ] 时间基于 UTC

### S2.3: 饮水间隔分析

**端点**: `GET /api/v1/stats/gaps?date=2026-02-07&threshold=240`

**计算逻辑**:
- 获取当日所有 intake，按时间排序
- 计算相邻 intake 之间的间隔
- 返回超过阈值 (默认 240 分钟) 的间隔

**响应格式**:
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

**验收标准**:
- [ ] 包含日初到首次饮水的间隔
- [ ] 阈值默认 240，支持 60-480 范围
- [ ] 无记录时返回空 gaps 数组

### S2.4: 综合健康评分

**端点**: `GET /api/v1/stats/health?date=2026-02-07`

**计算公式**:
```
score = goal_completion * 0.40
      + regularity * 0.30
      + category_diversity * 0.15
      + interval_uniformity * 0.15

goal_completion = min(total_ml / goal_ml, 1.0) * 100
regularity = (intakes per active hour) / 1.0 (normalized)
category_diversity = shannon_entropy(categories) / log(num_categories)
interval_uniformity = 1 - (gap_variance / max_expected_variance)
```

**响应格式**:
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

**验收标准**:
- [ ] score 范围 0-100
- [ ] 无数据时 score = 0
- [ ] 按需计算，不存储

---

## PBT Properties

### P2.1: Streak 单调性
```
INVARIANT: 连续达标期间 streak_days[i+1] = streak_days[i] + 1
FALSIFICATION:
  1. 插入连续 5 天达标记录
  2. 验证 streak 为 1,2,3,4,5
  3. 插入第 3 天未达标
  4. 验证 streak 变为 1,2,0,1,2
```

### P2.2: Health Score 边界
```
INVARIANT: 0 ≤ health_score ≤ 100
FALSIFICATION: 生成极端输入 (total_ml=0, total_ml=10000, 0 intakes, 100 intakes)
```

### P2.3: Gap 完整性
```
INVARIANT: sum(gap_minutes) + sum(intake_durations) ≈ active_hours * 60
FALSIFICATION: 验证 gaps 不重叠且覆盖所有未饮水时段
```

### P2.4: Best Time 确定性
```
INVARIANT: 相同输入数据返回相同 best_hour
FALSIFICATION: 连续调用 10 次验证结果一致
```

---

## Implementation Constraints

### Backend Files to Modify

| File | Changes |
|------|---------|
| `stats_repo.go` | Add `GetBestTime`, `GetGaps`, `RecomputeStreaksFromDate` |
| `stats_service.go` | Add `CalculateHealthScore` |
| `stats_handler.go` | Add handlers for new endpoints |
| `intake_repo.go` | Call streak recomputation in `UpsertDailyStats` |
| `main.go` | Register routes |

### Route Registration

```go
stats := v1.Group("/stats")
{
    stats.GET("/best-time", statsHandler.GetBestTime)
    stats.GET("/gaps", statsHandler.GetGaps)
    stats.GET("/health", statsHandler.GetHealth)
}
```
