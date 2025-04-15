# Progress 组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 核心特性

-   **动态进度显示**：支持 0.0~1.0 范围的进度可视化
-   **双色样式分离**：可分别定制已完成/未完成部分样式
-   **精准定位**：支持像素级坐标控制
-   **平滑过渡**：数值变化自动触发重绘

---

## Props 属性说明

| 属性名       | 类型             | 默认值   | 描述                  |
| ------------ | ---------------- | -------- | --------------------- |
| `loc`        | `ElementLocator` | **必填** | 进度条容器坐标        |
| `progress`   | `number`         | **必填** | 当前进度值（0.0~1.0） |
| `success`    | `CanvasStyle`    | `green`  | 已完成部分填充样式    |
| `background` | `CanvasStyle`    | `gray`   | 未完成部分填充样式    |
| `lineWidth`  | `number`         | `2`      | 进度条线宽（像素）    |

---

## 使用示例

### 基础用法

```tsx
import { defineComponent, ref } from 'vue';
import { Progress } from '@user/client-modules';
import { onTick } from '@motajs/render';

export const MyCom = defineComponent(() => {
    // 创建响应式进度值
    const loadingProgress = ref(0);

    // 模拟进度更新
    onTick(() => {
        if (loadingProgress.value < 1) {
            loadingProgress.value += 0.002;
        }
    });

    return () => (
        <Progress
            loc={[20, 20, 200, 8]} // x=20, y=20, 宽200px, 高8px
            progress={loadingProgress.value}
        />
    );
});
```

### 自定义样式

```tsx
// 自定义进度条的已完成和未完成部分的样式
<Progress
    loc={[50, 100, 300, 12]}
    progress={0.65}
    success="rgb(54, 255, 201)"
    background="rgba(255,255,255,0.2)"
    lineWidth={6}
/>
```

### 垂直进度条

```tsx
// 通过旋转容器实现垂直效果，注意锚点的使用
<container rotation={-Math.PI / 2} loc={[100, 200, 150, 8, 0.5, 0.5]}>
    <Progress loc={[0, 0, 150, 8]} progress={0.8} success="#FF5722" />
</container>
```

---

## 动画效果实现

### 平滑过渡示例

```tsx
import { transitioned } from '@user/client-modules';
import { pow } from 'mutate-animate';

const progressValue = transitioned(0, 2000, pow(2, 'out'));
progressValue.set(1); // 2秒内完成二次曲线平滑过渡

return () => (
    <Progress loc={[0, 0, 400, 10]} progress={progressValue.ref.value} />
);
```

---

## 注意事项

1. **坐标系统**  
   实际渲染高度由 `loc[3]` 参数控制，会自动上下居中：

    ```tsx
    // 情况1：显式指定高度为8px
    <Progress loc={[0, 0, 200, 8]} />
    ```
