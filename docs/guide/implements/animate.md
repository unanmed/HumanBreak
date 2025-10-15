# 动画效果

2.B 提供了专门的动画接口，允许你用短短几行就可以做出一个效果不错的动画。本节主要讲述的是 UI 中的动画。

:::warning
`mutate-animate` 库在未来会重构，可能会修改引入方式，但整体逻辑不会怎么变。
:::

## 定义动画属性

我们以一个自定义 UI 为例，来讲述如何编写一段动画。自定义 UI 参考[此指南](./new-ui.md)和[此教程](../../guide/ui/ui.md)。

假设自定义 UI 在 `packages-user/client-modules/src/render/ui` 文件夹下，我们需要引入 `transitioned` 接口，并调用它定义动画属性：

```tsx {8-13}
// 引入接口，如果文件夹不同，注意路径关系
import { transitioned } from '../use';
// 从 mutate-animate 库中引入速率曲线函数
import { hyper } from 'mutate-animate';

// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(() => {
    // 定义动画属性
    const value = transitioned(
        1, // 初始值是 1
        500, // 动画时长 500ms
        hyper('sin', 'out') // 速率曲线是双曲正弦函数（此曲线观感较好）
    )!;
    // 上一行的感叹号为非空断言，因为此接口在组件或 UI 外调用会返回 null，
    // 而我们在 UI 内，因此我们需要断言其不可能为 null

    return () => <container></container>;
});
```

注意 `transitioned` 只能在 UI 或组件的顶层调用，不能在 UI 的函数内调用，也不可在 UI 外调用，在其他地方调用会返回 `null`！

## 添加到元素属性

定义属性后，我们需要把属性添加到元素上，直接使用 `value.ref.value` 即可，这里以不透明度 `alpha` 属性为例：

```tsx {9}
// UI 模板及如何编写 UI 参考 “新增 UI” 需求指南，这里只给出必要的修改部分，模板部分不再给出
export const MyCom = defineComponent(() => {
    // 定义动画属性
    const value = transitioned(1, 500, hyper('sin', 'out'))!;

    return () => (
        <container>
            {/* 将 value.ref.value 赋值给 alpha 属性 */}
            <g-rect rect={[0, 0, 100, 100]} alpha={value.ref.value} />
        </container>
    );
});
```

## 执行动画

最后，在我们需要的时候执行动画即可，使用 `value.set`：

```tsx
export const MyCom = defineComponent(() => {
    // 定义动画属性
    const value = transitioned(1, 500, hyper('sin', 'out'))!;

    // 例如在 UI 挂载完毕后执行
    onMounted(() => {
        // 动画属性调成 0，效果就是矩形逐渐从不透明变成完全透明
        value.set(0);
    });

    return () => (
        <container>
            <g-rect rect={[0, 0, 100, 100]} alpha={value.ref.value} />
        </container>
    );
});
```

## 拓展-颜色动画

除了一般数值的动画外，样板还支持颜色动画，使用 `transitionedColor` 接口，用法与 `transitioned` 基本一致：

```tsx {23}
// 引入接口，如果文件夹不同，注意路径关系
import { transitionedColor } from '../use'; // [!code ++]
// 从 mutate-animate 库中引入速率曲线函数
import { hyper } from 'mutate-animate';

export const MyCom = defineComponent(() => {
    // 定义颜色动画
    const color = transitionedColor(
        '#fff', // 初始颜色，设定为白色 // [!code ++]
        1000, // 动画时长 1s
        hyper('sin', 'out') // 动画速率曲线
    )!;

    // 例如在 UI 挂载完毕后执行
    onMounted(() => {
        // 颜色调成纯黑
        color.set('#000'); // [!code ++]
    });

    return () => (
        <container>
            {/* 将 fillStyle 赋值为 color.ref.value */}
            <g-rect rect={[0, 0, 100, 100]} fillStyle={color.ref.value} />
        </container>
    );
});
```

颜色目前仅支持输入 `#RGB` `#RGBA` `#RRGGBB` `#RRGGBBAA` `rgb(r,g,b)` `rgba(r,g,b,a)` 几种格式的字符串。

## 拓展-配合交互

我们可以配合交互实现以下几种功能：

### 鼠标移入移出

当鼠标移入时高亮，当移出时恢复：

```tsx {8-11,19-20}
import { transitionedColor } from '../use';
import { hyper } from 'mutate-animate';

export const MyCom = defineComponent(() => {
    // 初始颜色为灰色
    const color = transitionedColor('#aaa', 200, hyper('sin', 'out'))!;

    /** 鼠标移入时变成白色 */
    const enter = () => color.set('#fff');
    /** 鼠标移出时恢复为灰色 */
    const leave = () => color.set('#aaa');

    return () => (
        <container>
            <g-rect
                rect={[0, 0, 100, 100]}
                fillStyle={color.ref.value}
                // 监听 enter 和 leave 事件
                onEnter={enter}
                onLeave={leave}
            />
        </container>
    );
});
```

### 点击切换状态

鼠标点击或触碰点击后高亮，再次点击恢复：

```tsx {8-15,23}
import { transitionedColor } from '../use';
import { hyper } from 'mutate-animate';

export const MyCom = defineComponent(() => {
    // 初始颜色为灰色
    const color = transitionedColor('#aaa', 200, hyper('sin', 'out'))!;

    let highlight = false;
    /** 点击时触发 */
    const click = () => {
        // 如果已经高亮，那么恢复为灰色，否则高亮为白色
        color.set(highlight ? '#aaa' : '#fff');
        // 切换状态
        highlight = !highlight;
    };

    return () => (
        <container>
            <g-rect
                rect={[0, 0, 100, 100]}
                fillStyle={color.ref.value}
                // 监听 click 事件
                onClick={click}
            />
        </container>
    );
});
```

## 拓展-API 参考

参考[此 API 文档](../../api/user-client-modules/functions.md#transitioned)。
