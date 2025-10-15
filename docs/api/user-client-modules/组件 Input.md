# Input 输入框组件 API 文档

本文档由 `DeepSeek` 生成并微调。

## 组件描述

输入框组件用于接收用户的文本输入，支持单行和多行模式，提供边框样式自定义和实时/确认两种值变化事件。

---

## Props 属性说明

| 属性名                    | 类型                | 默认值  | 描述                                                  |
| ------------------------- | ------------------- | ------- | ----------------------------------------------------- |
| `placeholder`             | `string`            | -       | 输入框的提示内容                                      |
| `value`                   | `string`            | -       | 输入框的值                                            |
| `multiline`               | `boolean`           | `false` | 是否是多行输入，多行输入时允许换行                    |
| `border`                  | `string`            | -       | 边框颜色                                              |
| `circle`                  | `RectRCircleParams` | -       | 边框圆角                                              |
| `borderWidth`             | `number`            | -       | 边框宽度                                              |
| `pad`                     | `number`            | -       | 内边距                                                |
| 继承自 `TextContentProps` | -                   | -       | [查看完整属性](./组件%20TextContent#Props%20属性说明) |

---

## Events 事件说明

| 事件名         | 参数类型          | 触发时机                                 |
| -------------- | ----------------- | ---------------------------------------- |
| `change`       | `(value: string)` | 当输入框的值被确认时触发，例如失焦时     |
| `input`        | `(value: string)` | 当输入框的值发生改变时触发，例如实时输入 |
| `update:value` | `(value: string)` | v-model 双向绑定事件                     |

---

## Slots 插槽说明

无插槽

---

## Exposed Methods 暴露方法

无暴露方法

---

## 使用示例

### 基础用法 - 单行输入框

```tsx
import { defineComponent, ref } from 'vue';
import { Input } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    const inputValue = ref('');

    const handleChange = (value: string) => {
        console.log('输入确认:', value);
    };

    const handleInput = (value: string) => {
        console.log('实时输入:', value);
    };

    return () => (
        <Input
            placeholder="请输入文本"
            v-model={inputValue.value}
            onChange={handleChange}
            onInput={handleInput}
            loc={[208, 208, 300, 40, 0.5, 0.5]}
            border="#ccc"
            borderWidth={1}
            circle={[4]}
            pad={8}
        />
    );
});
```

### 多行文本输入

```tsx
import { defineComponent, ref } from 'vue';
import { Input } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    const multilineValue = ref('');

    return () => (
        <Input
            multiline
            placeholder="请输入多行文本..."
            v-model={multilineValue.value}
            loc={[208, 208, 300, 120, 0.5, 0.5]}
            border="#007acc"
            borderWidth={2}
            circle={[8]}
            pad={12}
        />
    );
});
```

---

## 注意事项

1. **事件区别**：`input` 事件在每次输入时触发，`change` 事件在失焦或确认时触发
2. **多行模式**：启用 `multiline` 后支持换行输入，高度需要足够容纳多行文本
3. **样式继承**：支持从 `TextContentProps` 继承文本相关样式属性
