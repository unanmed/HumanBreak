# GraphicBaseProps API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 接口定义

```typescript
interface GraphicBaseProps extends BaseProps {
    /** 是否填充（默认 false） */
    fill?: boolean;
    /** 是否描边（默认 false） */
    stroke?: boolean;
    /** 强制先描边后填充（优先级最高，默认 false） */
    strokeAndFill?: boolean;
    /** 填充规则（默认 "evenodd"） */
    fillRule?: CanvasFillRule;
    /** 填充样式（颜色/渐变/图案） */
    fillStyle?: CanvasStyle;
    /** 描边样式（颜色/渐变/图案） */
    strokeStyle?: CanvasStyle;
    /** 交互时是否仅检测描边区域（默认 false） */
    actionStroke?: boolean;
}
```

---

## 核心属性说明

| 属性            | 类型                                            | 默认值      | 说明                                                           |
| --------------- | ----------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `fill`          | `boolean`                                       | `false`     | 启用填充（需设置 `fillStyle`）                                 |
| `stroke`        | `boolean`                                       | `false`     | 启用描边（需设置 `strokeStyle` 和 `strokeWidth`）              |
| `strokeAndFill` | `boolean`                                       | `false`     | 强制先描边后填充（覆盖 `fill` 和 `stroke` 的设置）             |
| `fillRule`      | `"nonzero"` \| `"evenodd"`                      | `"evenodd"` | 填充路径计算规则（影响复杂图形的镂空效果）                     |
| `fillStyle`     | `string` \| `CanvasGradient` \| `CanvasPattern` | -           | 填充样式（支持 CSS 颜色、渐变对象等）                          |
| `strokeStyle`   | `string` \| `CanvasGradient` \| `CanvasPattern` | -           | 描边样式                                                       |
| `actionStroke`  | `boolean`                                       | `false`     | 设为 `true` 时，交互事件仅响应描边区域（需配合 `stroke` 使用） |

---

## 使用示例（以矩形为例）

### 示例 1：仅填充模式

```tsx
<g-rect
    loc={[100, 100, 200, 150]} // x,y,width,height
    fill
    fillStyle="#fff"
/>
```

**效果**：

-   200x150 矩形
-   无描边效果

---

### 示例 2：仅描边模式

```tsx
<g-rect
    loc={[400, 200, 180, 120]}
    stroke
    strokeStyle="rgba(0,0,0,0.8)"
    strokeWidth={4}
    actionStroke // 点击时仅描边区域响应
/>
```

**交互特性**：

-   4px 黑色半透明描边
-   鼠标悬停在描边区域才会触发事件

---

### 示例 3：填充 + 描边（默认顺序）

```tsx
<g-rect
    loc={[50, 300, 150, 100]}
    fill
    stroke
    fillStyle="#ffe66d"
    strokeStyle="#2d3436"
    strokeWidth={2}
/>
```

**渲染顺序**：

1. 填充黄色背景
2. 在填充层上绘制黑色描边

---

### 示例 4：强制先描边后填充

```tsx
<g-rect
    loc={[300, 400, 200, 200]}
    strokeAndFill
    fillStyle="#a29bfe"
    strokeStyle="#6c5ce7"
    strokeWidth={8}
/>
```

**渲染顺序**：

1. 绘制紫色描边
2. 在描边层上填充浅紫色  
   **视觉效果**：描边被填充色覆盖一部分

---

## 最佳实践

### 交互增强技巧

```tsx
import { ref } from 'vue';

// 高亮描边交互反馈
const hovered = ref(false);
// 使用 void 关键字屏蔽返回值，避免返回值泄漏
const enter = () => void (hovered.value = true);
const leave = () => void (hovered.value = false);

<g-rect
    loc={[100, 100, 200, 80]}
    fill
    fillStyle="#ffffff"
    stroke={hovered.value}
    strokeStyle="#e84393"
    strokeWidth={3}
    onEnter={enter}
    onLeave={leave}
/>;
```

---

## 注意事项

1. **样式覆盖顺序**：  
   `strokeAndFill` 会强制按 **描边 → 填充** 顺序渲染，忽略 `fill` 和 `stroke` 的独立设置。

2. **路径闭合规则**：  
   `fillRule="evenodd"` 适用于以下场景：

    ```tsx
    // 五角星镂空效果
    <path
        fill={true}
        fillRule="evenodd"
        path={starPath} // 交替重叠的路径
    />
    ```

3. **性能问题**：
   多数情况下，图形的性能很好，不需要单独优化，但是如果你使用 `path` 标签，且内容复杂，建议添加 `cache` 属性来启用缓存，避免频繁的复杂图形绘制。
