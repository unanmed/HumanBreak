# FloorSelector 楼层选择器组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 组件描述

楼层选择器组件用于在地图浏览或地图选择场景中切换不同楼层，其尺寸与内置状态栏组件匹配，适合在地图浏览时将状态栏替换为此组件。

---

## Props 属性说明

| 属性名   | 类型         | 默认值 | 描述                 |
| -------- | ------------ | ------ | -------------------- |
| `floors` | `FloorIds[]` | 必填   | 可选择的楼层 ID 数组 |
| `now`    | `number`     | -      | 当前选中的楼层索引   |

---

## Events 事件说明

| 事件名       | 参数类型                             | 触发时机               |
| ------------ | ------------------------------------ | ---------------------- |
| `close`      | -                                    | 点击关闭按钮时触发     |
| `update`     | `(floor: number, floorId: FloorIds)` | 当选中的楼层改变时触发 |
| `update:now` | `(value: number)`                    | v-model 双向绑定事件   |

---

## Slots 插槽说明

无插槽

---

## Exposed Methods 暴露方法

无暴露方法

---

## 使用示例

### 基础用法 - 地图浏览界面

```tsx
import { defineComponent, ref } from 'vue';
import { FloorSelector, STATUS_BAR_HEIGHT } from '@user/client-modules';

export const MapBrowserCom = defineComponent(() => {
    const currentFloor = ref(0);

    // 可用的楼层列表
    const availableFloors = core.floorIds;

    const handleFloorChange = (floorIndex: number, floorId: string) => {
        console.log(`切换到楼层: ${floorId} (索引: ${floorIndex})`);
        // 这里可以执行切换楼层的逻辑
    };

    const handleClose = () => {
        console.log('关闭楼层选择器');
        // 返回主界面或执行其他关闭逻辑
    };

    return () => (
        <FloorSelector
            loc={[0, 0, 180, STATUS_BAR_HEIGHT]}
            floors={availableFloors}
            v-model:now={currentFloor.value}
            onUpdate={handleFloorChange}
            onClose={handleClose}
        />
    );
});
```

---

## 注意事项

1. **尺寸匹配**: 组件设计为与内置状态栏尺寸匹配，可直接替换
2. **索引基准**: 楼层索引从 0 开始
3. **内置集成**: 通常不需要直接使用，因为样板已内置完整的地图浏览界面
4. **倒序排列**: 楼层列表会自动倒序排列
