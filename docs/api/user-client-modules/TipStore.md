# TipStore API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 类描述

`TipStore` 是提示框的集中管理器，提供全局访问和控制提示组件的能力。所有通过 `<Tip>` 组件注册的实例会自动加入静态 `list` 容器，支持通过 ID 精准控制特定提示框。

---

## 核心方法说明

### `TipStore.get`

```typescript
function get(id: string): TipStore | undefined;
```

**静态方法**：通过 ID 获取已注册的提示框控制器

| 参数 | 类型     | 必填 | 说明             |
| ---- | -------- | ---- | ---------------- |
| `id` | `string` | 是   | 提示框的唯一标识 |

**返回值**：找到返回实例，否则返回 `undefined`

---

### `TipStore.use`

```typescript
function use(id: string, data: TipExpose): TipStore;
```

**静态方法**：注册提示框实例到全局管理器（通常在组件内部使用）

| 参数   | 类型        | 必填 | 说明                    |
| ------ | ----------- | ---- | ----------------------- |
| `id`   | `string`    | 是   | 提示框的唯一标识        |
| `data` | `TipExpose` | 是   | 来自 Tip 组件的暴露接口 |

---

### `drawTip`

```typescript
function drawTip(text: string, icon?: AllIds | AllNumbers): void;
```

**显示提示内容**（支持带图标的提示）

| 参数   | 类型                   | 必填 | 说明                            |
| ------ | ---------------------- | ---- | ------------------------------- |
| `text` | `string`               | 是   | 提示文字内容                    |
| `icon` | `AllIds \| AllNumbers` | 否   | 图标资源 ID（字符串或数字形式） |

**特性**：

-   自动触发淡入动画
-   3 秒无操作后自动淡出
-   重复调用会重置计时器

---

## 使用示例

### 基础提示

```typescript
// 获取预先注册的提示框
const tip = TipStore.get('item-get-tip');

// 显示纯文本提示
tip?.drawTip('获得金币 x100');

// 显示带图标的提示
tip?.drawTip('获得 传说之剑', 'legend_sword');
```

### 全局广播提示

```typescript
// 向所有提示框发送通知
TipStore.list.forEach(store => {
    store.drawTip('系统将在5分钟后维护', 'warning');
});
```

### 动态内容提示

```typescript
// 组合动态内容
const showDamageTip = (damage: number) => {
    TipStore.get('combat-tip')?.drawTip(
        `造成 ${damage} 点伤害`,
        damage > 1000 ? 'critical_hit' : 'normal_hit'
    );
};
```

---

## 生命周期管理

### 组件注册流程

```tsx
// 在组件定义时注册实例
<Tip id="quest-tip" loc={[20, 20, 400, 40]}></Tip>;

// 在业务逻辑中调用
const showQuestComplete = () => {
    TipStore.get('quest-tip')?.drawTip('任务「勇者的试炼」完成！');
};
```

---

## 注意事项

1. **自动清理机制**  
   组件卸载时自动注销实例，跨场景访问时需确保目标组件已挂载

2. **错误处理**  
   建议封装安全访问方法：

    ```typescript
    const safeDrawTip = (id: string, text: string) => {
        const instance = TipStore.get(id);
        if (!instance) {
            console.error(`Tip ${id} not registered`);
            return;
        }
        instance.drawTip(text);
    };
    ```

3. **动画队列**  
   连续调用时会中断当前动画，建议重要提示添加延迟：
    ```typescript
    tip.drawTip('第一条提示');
    setTimeout(() => {
        tip.drawTip('第二条重要提示');
    }, 3200); // 等待淡出动画结束
    ```
