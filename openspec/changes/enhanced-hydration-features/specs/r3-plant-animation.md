# R3: 植物生长动画

## Requirement

实现植物状态变化的自然生长动画效果，从小到大缩放，带发光脉冲。

---

## Specifications

### S3.1: 缩放生长动画

**触发条件**: 植物阶段变化 (基于饮水进度阈值)
**动画参数**:
- 持续时间: 1000ms
- 缓动函数: `cubic-bezier(0.34, 1.56, 0.64, 1)` (Back-out 弹性效果)
- 起始缩放: 75%
- 结束缩放: 100%

**CSS 实现**:
```css
.plant-image {
  transition: all 1000ms cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, opacity;
}

.plant-image.active {
  opacity: 1;
  transform: scale(1);
}

.plant-image.inactive {
  opacity: 0;
  transform: scale(0.75);
}
```

**验收标准**:
- [ ] 阶段变化时植物从 75% 放大到 100%
- [ ] 动画持续约 1 秒
- [ ] 无闪烁或跳跃

### S3.2: 发光脉冲效果

**触发条件**: `isTransitioning === true` 期间
**动画参数**:
- 颜色: 黄绿渐变 (`from-yellow-300/40 via-green-400/20`)
- 模糊: 40px
- 脉冲频率: 1 次/秒

**CSS 实现**:
```css
@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}

.glow-effect.transitioning {
  animation: glow-pulse 1s ease-in-out;
}
```

**验收标准**:
- [ ] 阶段切换时发光层出现脉冲
- [ ] 脉冲与植物缩放同步
- [ ] 低阶段 (0-1) 无发光，高阶段 (2-3) 持续发光

### S3.3: 交叉淡化

**实现**: 所有阶段图片预渲染，通过 opacity 切换

**验收标准**:
- [ ] 旧图片淡出同时新图片淡入
- [ ] 无短暂空白或闪烁
- [ ] 使用绝对定位叠加

---

## PBT Properties

### P3.1: 动画时长一致性
```
INVARIANT: 动画持续时间 = 1000ms ± 50ms
FALSIFICATION: 使用 Performance API 测量多次动画时长
```

### P3.2: 状态同步
```
INVARIANT: isTransitioning=true 期间不响应新的阶段变化
FALSIFICATION: 快速连续触发多次进度变化，验证无动画叠加
```

### P3.3: 渲染性能
```
INVARIANT: 动画期间帧率 >= 30fps
FALSIFICATION: 使用 Chrome DevTools Performance 分析
```

---

## Implementation Constraints

### Files to Modify

| File | Changes |
|------|---------|
| `frontend/pages/Home.tsx` | Update transition styles and glow animation |

### Key Code Changes

```tsx
// Home.tsx - Line 118 area
<img
  key={stage.img}
  src={stage.img}
  className={`absolute max-h-[70%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]
    transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]
    will-change-transform will-change-opacity
    ${index === currentStageIndex
      ? 'opacity-100 scale-100'
      : 'opacity-0 scale-75'
    }`}
  alt={stage.label}
/>

// Glow effect - Line 104 area
<div className={`absolute w-32 h-32 rounded-full transition-all duration-1000 ${
  isTransitioning
    ? 'animate-[glow-pulse_1s_ease-in-out] bg-gradient-radial from-yellow-300/60 via-green-400/30 to-transparent blur-[50px] scale-150'
    : currentStageIndex >= 2
      ? 'bg-gradient-radial from-yellow-300/40 via-green-400/20 to-transparent blur-[40px] scale-150'
      : 'opacity-0'
}`}></div>
```
