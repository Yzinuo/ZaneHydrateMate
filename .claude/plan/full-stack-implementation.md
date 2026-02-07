# 完整实施计划：HydrateMate 全栈开发

## 概述
基于方案 B（同步维护 daily_stats）+ 完整前后端集成

---

## 一、后端开发（Go + Gin + GORM）

### 1. 数据模型扩展

#### 新增 UserProfile 模型
```go
type UserProfile struct {
    UserID    uuid.UUID `gorm:"type:uuid;primary_key"`
    HeightCm  int       `gorm:"default:170"`
    WeightKg  int       `gorm:"default:70"`
    Age       int       `gorm:"default:25"`
    UpdatedAt time.Time
}
```

### 2. API 设计

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/v1/intakes | 记录喝水 |
| GET | /api/v1/intakes | 查询记录（分页） |
| DELETE | /api/v1/intakes/:id | 删除记录 |
| GET | /api/v1/stats/weekly | 周统计 |
| GET | /api/v1/stats/monthly | 月统计 |
| GET | /api/v1/profile | 获取档案 |
| PUT | /api/v1/profile | 更新档案 |
| GET | /api/v1/settings | 获取设置 |
| PUT | /api/v1/settings | 更新设置 |

### 3. 分层架构

```
internal/app/
├── model/
│   ├── user.go (已有)
│   ├── intake.go (已有)
│   ├── profile.go (新增)
│   └── stats.go (新增)
├── repo/
│   ├── user_repo.go (已有)
│   ├── intake_repo.go (新增)
│   ├── profile_repo.go (新增)
│   └── stats_repo.go (新增)
├── service/
│   ├── auth_service.go (已有)
│   ├── intake_service.go (新增)
│   ├── profile_service.go (新增)
│   └── stats_service.go (新增)
├── handler/
│   ├── auth_handler.go (已有)
│   ├── intake_handler.go (新增)
│   ├── profile_handler.go (新增)
│   └── stats_handler.go (新增)
└── middleware/
    └── auth_middleware.go (新增)
```

### 4. 事务处理

喝水记录新增时同步更新 daily_stats：
1. Begin Transaction
2. Insert water_intakes
3. UPSERT daily_stats (total_ml += amount, is_goal_met = total >= goal)
4. Commit

### 5. 推荐饮水量公式

```go
func CalcRecommendedMl(weightKg, age int) int {
    base := weightKg * 30
    if age < 14 {
        base = weightKg * 40
    } else if age >= 65 {
        base = weightKg * 28
    }
    // Clamp 1200-4000
    if base < 1200 { base = 1200 }
    if base > 4000 { base = 4000 }
    return base
}
```

---

## 二、前端开发（React + Tailwind）

### 1. GlassCard 优化

修改 `components/GlassCard.tsx`：
```tsx
className={`backdrop-blur-3xl backdrop-saturate-[1.8] bg-white/[0.16] border border-white/[0.24] shadow-[0_12px_40px_rgba(0,0,0,0.3)] rounded-3xl ${className}`}
```

### 2. 新增 Profile.tsx

- 输入：体重、身高、年龄、活动强度
- 实时显示推荐饮水量
- 保存后更新全局目标

### 3. API 服务层

新增 `api.ts`：
```ts
const API_URL = '/api/v1';

export const api = {
    getSettings: () => fetch(`${API_URL}/settings`).then(r => r.json()),
    saveProfile: (p) => fetch(`${API_URL}/profile`, { method: 'PUT', body: JSON.stringify(p) }),
    logWater: (amount) => fetch(`${API_URL}/intakes`, { method: 'POST', body: JSON.stringify({ amount_ml: amount }) }),
    getWeeklyStats: (weekStart) => fetch(`${API_URL}/stats/weekly?week_start=${weekStart}`),
};
```

### 4. 类型扩展

```ts
export interface UserProfile {
    age: number;
    weight: number;
    height: number;
    activityLevel: 'sedentary' | 'moderate' | 'active';
}

export interface UserState {
    id?: string;
    profile?: UserProfile;
    dailyGoal: number;
    currentIntake: number;
    streak: number;
    totalIntake: number;
    records: DrinkRecord[];
}
```

---

## 三、实施顺序

### Phase 1: 前端 UI 修复（立即）
1. ✅ 修复 GlassCard 透明度
2. ✅ 创建 Profile.tsx 页面

### Phase 2: 后端 API 开发
1. 新增 JWT 中间件
2. 实现 Profile/Settings API
3. 实现 Intake CRUD API
4. 实现 Stats API

### Phase 3: 前后端集成
1. 创建 api.ts 服务层
2. 重构 App.tsx 状态管理
3. 集成所有 API 调用

### Phase 4: 测试与优化
1. 功能测试
2. 性能优化
3. 错误处理

---

## 四、预计工作量

| 模块 | 工作量 |
|------|--------|
| 前端 UI 修复 | 0.5h |
| Profile 页面 | 1h |
| 后端 API（全部） | 3-4h |
| 前后端集成 | 1-2h |
| 测试优化 | 1h |
| **总计** | **6-8h** |
