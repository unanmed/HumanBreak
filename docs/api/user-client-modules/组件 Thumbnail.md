# Thumbnail 地图缩略图组件 API 文档

本文档由 `DeepSeek` 生成并微调。

## 组件描述

地图缩略图组件用于在游戏界面中显示当前楼层的迷你地图，可展示地图布局、角色位置、伤害区域等信息。适用于小地图显示、地图预览等场景。

---

## Props 属性说明

| 属性名     | 类型             | 默认值 | 描述                                   |
| ---------- | ---------------- | ------ | -------------------------------------- |
| `loc`      | `ElementLocator` | 必填   | 缩略图的位置和尺寸                     |
| `floorId`  | `FloorIds`       | 必填   | 楼层 ID                                |
| `padStyle` | `CanvasStyle`    | -      | 缩略图填充样式                         |
| `map`      | `Block[]`        | -      | 楼层信息                               |
| `hero`     | `HeroStatus`     | -      | 角色信息                               |
| `damage`   | `boolean`        | -      | 是否显示地图伤害                       |
| `all`      | `boolean`        | -      | 是否完全展示地图（false 时只显示部分） |
| `noHD`     | `boolean`        | -      | 是否使用高清模式                       |
| `size`     | `number`         | -      | 缩略图的比例（1 表示与实际地图一致）   |

---

## Events 事件说明

无事件

---

## Slots 插槽说明

无插槽

---

## Exposed Methods 暴露方法

无暴露方法

---

## 使用示例

### 基础用法 - 显示当前楼层缩略图

```tsx
import { defineComponent } from 'vue';
import { Thumbnail } from '@user/client-modules';

export const MiniMapCom = defineComponent(() => {
    return () => (
        <Thumbnail
            loc={[400, 50, 120, 120, 1, 0]}
            floorId="main_floor"
            padStyle="#2c3e50"
            size={0.1}
        />
    );
});
```

### 带角色位置的小地图

```tsx
import { defineComponent } from 'vue';
import { Thumbnail } from '@user/client-modules';

export const GameHUDCom = defineComponent(props => {
    const heroStatus: HeroStatus = {
        // 角色状态信息
        loc: { x: 100, y: 150 }
        // ... 其他角色属性
    };

    return () => (
        <container loc={[400, 50, 150, 150, 1, 0]}>
            <Thumbnail
                loc={[0, 0, 150, 150, 0.5, 0.5]}
                floorId="dungeon_1"
                hero={heroStatus}
                padStyle="#34495e"
                damage
                size={0.08}
            />
            <text text="小地图" loc={[0, 0]} />
        </container>
    );
});
```

### 完整地图预览

```tsx
import { defineComponent } from 'vue';
import { Thumbnail } from '@user/client-modules';

export const MapPreviewCom = defineComponent(() => {
    return () => (
        <Thumbnail
            loc={[240, 240, 300, 300, 0.5, 0.5]}
            floorId="boss_arena"
            all
            padStyle="#1a1a1a"
            size={0.3}
        />
    );
});
```

---

## 注意事项

1. **楼层标识**: `floorId` 必须与游戏中的楼层标识匹配
2. **比例控制**: `size` 参数控制缩略图与实际地图的比例关系
3. **显示范围**: `all` 为 false 时，大地图只会显示当前可视区域
