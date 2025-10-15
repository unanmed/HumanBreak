# List 列表组件 API 文档

本文档由 `DeepSeek` 生成并微调。

## 组件描述

列表组件用于展示可选择的项目列表，内置滚动条功能和选中项高亮效果。适用于菜单选择、内容导航、设置选项等场景。

---

## Props 属性说明

| 属性名       | 类型                 | 默认值 | 描述                            |
| ------------ | -------------------- | ------ | ------------------------------- |
| `list`       | `[string, string][]` | 必填   | 列表内容，[id, 显示文本] 的数组 |
| `selected`   | `string`             | 必填   | 当前选中的项 ID                 |
| `loc`        | `ElementLocator`     | 必填   | 列表的位置和尺寸                |
| `lineHeight` | `number`             | `18`   | 每行的高度                      |
| `font`       | `Font`               | -      | 列表项的字体样式                |
| `winskin`    | `ImageIds`           | -      | 使用 winskin 作为光标背景       |
| `color`      | `CanvasStyle`        | -      | 使用指定样式作为光标背景        |
| `border`     | `CanvasStyle`        | -      | 使用指定样式作为光标边框        |
| `alphaRange` | `[number, number]`   | -      | 选择图标的不透明度范围          |

---

## Events 事件说明

| 事件名            | 参数类型          | 触发时机               |
| ----------------- | ----------------- | ---------------------- |
| `update`          | `(key: string)`   | 当用户选中某一项时触发 |
| `update:selected` | `(value: string)` | v-model 双向绑定事件   |

---

## Slots 插槽说明

无插槽

---

## Exposed Methods 暴露方法

无暴露方法

---

## 使用示例

### 基础用法 - 简单列表

```tsx
import { defineComponent, ref } from 'vue';
import { List } from '@user/client-modules';

export const MyCom = defineComponent(() => {
    const selectedItem = ref('item1');

    // 列表数据：[id, 显示文本]
    const listData = [
        ['item1', '第一项'],
        ['item2', '第二项'],
        ['item3', '第三项'],
        ['item4', '第四项']
    ];

    const handleSelect = (key: string) => {
        console.log('选中项:', key);
        selectedItem.value = key;
    };

    return () => (
        <List
            list={listData}
            v-model:selected={selectedItem.value}
            loc={[0, 0, 100, 300, 0, 0]}
            selected={selectedItem.value}
            onUpdate={handleSelect}
        />
    );
});
```

### 带样式的列表

```tsx
import { defineComponent, ref } from 'vue';
import { List } from '@user/client-modules';

export const StyledListCom = defineComponent(() => {
    const selected = ref('opt2');

    const options = [
        ['opt1', '开始游戏'],
        ['opt2', '游戏设置'],
        ['opt3', '帮助文档'],
        ['opt4', '关于我们']
    ];

    return () => (
        <List
            list={options}
            v-model:selected={selected.value}
            loc={[0, 0, 100, 300, 0, 0]}
            lineHeight={24}
            color="#e3f2fd"
            border="#2196f3"
            borderWidth={1}
        />
    );
});
```

### 使用皮肤图片的列表

```tsx
import { defineComponent, ref } from 'vue';
import { List } from '@user/client-modules';

export const SkinnedListCom = defineComponent(() => {
    const currentSelection = ref('cat');

    const animalList = [
        ['cat', '猫咪'],
        ['dog', '小狗'],
        ['bird', '小鸟'],
        ['fish', '小鱼']
    ];

    const handleUpdate = key => {
        const item = animalList.find(item => item[0] === key)?.[1];
        currentSelection.value = key;
        console.log('选择了:', item);
    };

    return () => (
        <List
            list={animalList}
            selected={currentSelection.value}
            loc={[0, 0, 100, 300, 0, 0]}
            winskin="winskin.png"
            lineHeight={20}
            onUpdate={handleUpdate}
        />
    );
});
```

### 长列表滚动示例

```tsx
import { defineComponent, ref } from 'vue';
import { List } from '@user/client-modules';

export const ScrollListCom = defineComponent(() => {
    const selected = ref('item5');

    // 创建长列表数据
    const longList = Array.from({ length: 20 }, (_, i) => [
        `item${i + 1}`,
        `列表项 ${i + 1}`
    ]);

    return () => (
        <List
            list={longList}
            v-model:selected={selected.value}
            loc={[0, 0, 100, 300, 0, 0]}
            lineHeight={20}
            color="#fff3e0"
            border="#ff9800"
        />
    );
});
```

---

## 注意事项

1. **数据格式**: `list` 属性需要 `[id, text]` 格式的二维数组
2. **选中状态**: `selected` 需要与列表项中的 id 匹配
3. **滚动支持**: 自动显示滚动条
4. **样式优先级**: 如果设置了 `winskin`，则 `color` 和 `border` 设置将失效
