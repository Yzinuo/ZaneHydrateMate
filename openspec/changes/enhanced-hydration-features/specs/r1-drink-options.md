# R1: 扩展饮水选项

## Requirement

添加 30ml "一小口" 饮水选项，并调整 UI 布局为 2 列网格。

---

## Specifications

### S1.1: 新增饮水选项

**输入**: 用户点击饮水选择器
**输出**: 显示包含 30ml "一小口" 的 7 个选项

**验收标准**:
- [ ] 选项列表包含 `{ id: 'sip', label: '一小口', amount: 30, category: 'water' }`
- [ ] 图标使用 `Droplet` (lucide-react)
- [ ] 颜色使用 `bg-blue-500/20 text-blue-400`

### S1.2: 2 列网格布局

**变更**: `grid-cols-3` → `grid-cols-2`

**验收标准**:
- [ ] 7 个选项均匀分布在 2 列网格中
- [ ] 最后一行单个选项居中或左对齐
- [ ] 触控目标足够大 (最小 44x44px)

---

## PBT Properties

### P1.1: 选项完整性
```
INVARIANT: DRINK_OPTIONS.length >= 7
FALSIFICATION: 删除任意选项后验证长度
```

### P1.2: 金额有效性
```
INVARIANT: ∀ option ∈ DRINK_OPTIONS: option.amount > 0 && option.amount <= 2000
FALSIFICATION: 注入 amount=0 或 amount=3000 的选项
```

### P1.3: 后端兼容性
```
INVARIANT: POST /api/v1/intakes { amount_ml: 30 } → 201 Created
FALSIFICATION: 发送 amount_ml: 30 验证不被拒绝
```

---

## Implementation Constraints

- 必须修改 `frontend/components/DrinkSelector.tsx`
- 保持现有选项的顺序和属性
- 不修改后端 API (已支持任意正整数)
