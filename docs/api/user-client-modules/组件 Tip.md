# Tip 组件 API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

## 参数说明（Props）

| 参数名   | 类型               | 默认值   | 说明                                     |
| -------- | ------------------ | -------- | ---------------------------------------- |
| `loc`    | `ElementLocator`   | 必填     | 容器基础定位参数 [x,y,width,height]      |
| `pad`    | `[number, number]` | `[4,4]`  | 图标与文字的边距配置 [水平边距,垂直边距] |
| `corner` | `number`           | `4`      | 圆角矩形的圆角半径                       |
| `id`     | `string`           | 自动生成 | 提示框唯一标识（需全局唯一）             |

## 暴露接口（Expose）

| 方法名    | 参数                                            | 返回值 | 说明                                                |
| --------- | ----------------------------------------------- | ------ | --------------------------------------------------- |
| `drawTip` | `text: string`<br>`icon?: AllIds \| AllNumbers` | `void` | 显示带图标的提示文本（图标支持字符串 ID 或数字 ID） |

## 使用示例

```tsx
import { defineComponent } from 'vue';
import { Tip } from './tip';

// 在游戏界面中定义提示组件
export const MyCom = defineComponent(() => {
    return () => (
        <container>
            <Tip
                loc={[32, 32, 280, 40]}
                pad={[8, 4]}
                corner={8}
                id="global-tip"
            ></Tip>
        </container>
    );
});

// 在业务代码中调用提示，使用 TipStore 类
const tip = TipStore.get('global-tip');
tip?.drawTip('宝箱已解锁！', 'chest_icon');
```

## 特性说明

1. **自动布局**：

    - 根据图标尺寸自动计算容器宽度
    - 文字垂直居中显示
    - 图标与文字间距自动适配

2. **动画效果**：

    - 默认带有 500ms 双曲正弦缓动的淡入动画
    - 3 秒无操作后自动淡出
    - 支持通过`alpha`参数自定义过渡效果

## 注意事项

1. **全局单例**：建议通过 `TipStore` 进行全局管理，避免重复创建
2. **ID 唯一性**：未指定 `id` 时会自动生成格式为 `@default-tip-数字` 的标识
3. **自动隐藏**：调用 `drawTip` 后 3 秒自动隐藏，连续调用会重置计时
4. **性能优化**：使用 `lodash` 的 `debounce` 进行隐藏操作防抖
5. **动画配置**：可通过修改 `hyper('sin', 'in-out')` 参数调整动画曲线
