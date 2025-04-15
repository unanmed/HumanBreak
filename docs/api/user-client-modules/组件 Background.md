# Background 背景组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 核心特性

-   **双样式模式**：支持图片皮肤或纯色填充
-   **精准定位**：像素级坐标控制
-   **静态呈现**：无内置动画的稳定背景层

---

## Props 属性说明

| 属性名    | 类型             | 默认值   | 描述                          |
| --------- | ---------------- | -------- | ----------------------------- |
| `loc`     | `ElementLocator` | **必填** | 背景定位                      |
| `winskin` | `ImageIds`       | -        | 皮肤图片资源 ID（优先级最高） |
| `color`   | `CanvasStyle`    | `"#333"` | 填充颜色（无皮肤时生效）      |
| `border`  | `CanvasStyle`    | `"#666"` | 边框颜色（无皮肤时生效）      |

---

## 使用示例

### 图片皮肤模式

```tsx
// 使用预加载的UI背景图
<Background loc={[0, 0, 416, 416]} winskin="winskin.png" />
```

### 纯色模式

```tsx
// 自定义颜色背景
<Background
    loc={[20, 20, 760, 560]}
    color="gold"
    border="rgba(255,255,255,0.2)"
/>
```

### 对话框组合

```tsx
// 对话框容器
<container loc={[200, 100, 400, 300]}>
    <Background loc={[0, 0, 400, 300]} winskin="winskin.png" />
    <text loc={[20, 20]} content="系统提示" font={titleFont} />
    <text loc={[30, 60]} content="确认要离开吗？" font={contentFont} />
</container>
```

---

## 注意事项

1. **样式优先级**  
   同时指定参数时的生效顺序：

    ```tsx
    // 以下配置仅生效 winskin
    <Background winskin="bg_wood" color="#FF0000" />
    ```

2. **默认边框**  
   未指定 border 时的行为：

    ```tsx
    // 无边框（指定为透明色）
    <Background color="#222" border="transparent" />;

    // 默认白色边框（当未指定任何参数时）
    <Background />;
    ```
