# Scroll 滚动组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 组件特性

-   **虚拟滚动**：自动裁剪可视区域外元素
-   **双模式支持**：垂直/水平滚动（默认垂直）
-   **性能优化**：动态计算可视区域，支持万级元素流畅滚动
-   **编程控制**：支持精准定位滚动位置

---

## Props 属性说明

| 属性名     | 类型             | 默认值  | 描述                                              |
| ---------- | ---------------- | ------- | ------------------------------------------------- |
| `hor`      | `boolean`        | `false` | 启用水平滚动模式                                  |
| `noscroll` | `boolean`        | `false` | 是否不显示滚动条，可用于一些特殊场景              |
| `loc`      | `ElementLocator` | 必填    | 滚动容器定位配置                                  |
| `padEnd`   | `number`         | `0`     | 滚动到底部/右侧的额外留白（用于修正自动计算误差） |

---

## Exposed Methods 暴露方法

| 方法名            | 参数                              | 返回值   | 描述                                                |
| ----------------- | --------------------------------- | -------- | --------------------------------------------------- |
| `scrollTo`        | `position: number, time?: number` | `void`   | 滚动到指定位置（单位：像素），time 为过渡时间（ms） |
| `getScrollLength` | -                                 | `number` | 获取最大可滚动距离（单位：像素）                    |

---

## Slots 插槽说明

### `default`

接收滚动内容，**必须直接包含可渲染元素**  
⚠️ 禁止嵌套 container 包裹，推荐平铺结构：

```tsx
// ✅ 正确写法
<Scroll>
    <item />
    <item />
    <item />
</Scroll>;

// ❌ 错误写法（影响虚拟滚动计算）
<Scroll>
    <container>
        // 会导致整体被视为单个元素
        <item />
        <item />
    </container>
</Scroll>;
```

---

## 使用示例

### 基础垂直滚动

```tsx
import { defineComponent } from 'vue';

export const MyCom = defineComponent(() => {
    const list = Array(200).fill(0);

    return () => (
        <Scroll loc={[208, 208, 208, 208, 0.5, 0.5]}>
            {list.map((_, index) => (
                <text key={index} text={index.toString()} />
            ))}
        </Scroll>
    );
});
```

### 水平滚动 + 编程控制

```tsx
import { defineComponent, ref, onMounted } from 'vue';

export const MyCom = defineComponent(() => {
    const list = Array(200).fill(0);
    const scrollRef = ref<ScrollExpose>();

    // 滚动水平 100 像素位置，动画时长 500 毫秒
    onMounted(() => {
        scrollRef.value?.scrollTo(100, 500);
    });

    return () => (
        <Scroll hor loc={[208, 208, 208, 208, 0.5, 0.5]} ref={scrollRef}>
            {list.map((_, index) => (
                <text key={index} text={index.toString()} />
            ))}
        </Scroll>
    );
});
```

---

## 性能优化指南

### 1. 替代方案建议

⚠️ **当子元素数量 > 1000 时**，推荐改用分页组件：

```tsx
// 使用 Page 组件处理超大数据集
<Page pages={Math.ceil(data.length / 50)}>
    {page => renderChunk(data.slice(page * 50, (page + 1) * 50))}
</Page>
```
