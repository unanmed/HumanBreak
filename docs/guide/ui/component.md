# 组件使用指南

2.B 内置了很多实用的组件，本节将会介绍一些常用组件的使用方式。

## 组件引入

组件都在 `packages-user/client-modules/src/render/components` 文件夹中，如果在 `ui` 文件夹下引用，注意路径关系，应该如下引入：

```ts
// 从 components 文件夹引入，注意路径关系
import { TextContent } from '../components';
```

## 组件与元素

一般情况下，组件会包含所有元素拥有的参数，例如 `loc` `alpha` `zIndex`，甚至是 `noevent` `cache` 等，也可以监听 `onClick` `onEnter` 这些交互事件。

除了元素的参数，组件自身可能还会包含一些参数和事件。

有些组件还提供了暴露接口，可以使用这些接口直接控制组件内部。

## 多行文本 TextContent

类似于 2.x 的 `drawTextContent`，可以用于多行文本，包含打字机功能。相比于 `drawTextContent` 的主要优势是支持了英文以及更好的性能表现。

### 显示文字

直接调用组件即可：

```tsx
import { TextContent } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 显示一段长文字
    const toShow = 'man what can i say '.repeat(10);

    return () => (
        <container>
            {/* 直接调用组件，其中宽度 width 必填，而 loc 中设定的宽度是无效的 */}
            <TextContent loc={[0, 0, 240, 200]} width={240} text={toShow} />
        </container>
    );
});
```

### 常用配置

| 配置          | 数据类型  | 说明                                       |
| ------------- | --------- | ------------------------------------------ |
| `font`        | `Font`    | 文字字体                                   |
| `interval`    | `number`  | 打字机效果每两个字之间的时间间隔，单位毫秒 |
| `lineHeight`  | `number`  | 行间距，单位像素                           |
| `fill`        | `boolean` | 是否填充文字，默认填充                     |
| `stroke`      | `boolean` | 是否描边文字，默认不描边                   |
| `fillStyle`   | `string`  | 文字填充样式                               |
| `strokeStyle` | `string`  | 文字描边样式                               |

使用示例：

:::code-group

```tsx [自定义字体]
import { Font } from '@motajs/style'; // [!code ++]
import { TextContent } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 显示一段长文字
    const toShow = 'man what can i say '.repeat(10);
    // 24px 大小的 Arial 字体
    const myFont = new Font('Arial', 24); // [!code ++]

    return () => (
        <container>
            <TextContent
                loc={[0, 0, 240, 200]}
                width={240}
                text={toShow}
                font={myFont} // 使用自定义字体 [!code ++]
            />
        </container>
    );
});
```

```tsx [修改字体颜色]
import { TextContent } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 显示一段长文字
    const toShow = 'man what can i say '.repeat(10);

    return () => (
        <container>
            <TextContent
                loc={[0, 0, 240, 200]}
                width={240}
                text={toShow}
                fill // 文字填充 [!code ++]
                stroke // 文字描边 [!code ++]
                fillStyle="yellow" // 文字填充为黄色 [!code ++]
                strokeStyle="cyan" // 文字描边为青色 [!code ++]
            />
        </container>
    );
});
```

```tsx [修改行间距]
import { TextContent } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 显示一段长文字
    const toShow = 'man what can i say '.repeat(10);

    return () => (
        <container>
            <TextContent
                loc={[0, 0, 240, 200]}
                width={240}
                text={toShow}
                lineHeight={8} // 行间距为 8px [!code ++]
            />
        </container>
    );
});
```

:::

### 自动调整高度

如果我们不知道这些文字显示的时候会有多高，那么我们可以使用 `autoHeight` 来让组件自动确定自身的高度，可以用于滚动条等场景。

```tsx
import { TextContent } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 显示一段长文字
    const toShow = 'man what can i say '.repeat(10);

    return () => (
        <container>
            <TextContent
                loc={[0, 0, 240, 200]}
                width={240}
                text={toShow}
                autoHeight // 使用 autoHeight，让组件自动确定自己的高度 [!code ++]
            />
        </container>
    );
});
```

### 转义字符

与 2.x 类似，2.B 的 `TextContent` 也允许转义字符。具体请参考[此文档](../../api/user-client-modules/TextContentParser.md#转义字符语法说明)。

### API 参考

`TextContent` 还有很多功能和特性，这里只做最基础的教学，如果需要其他功能，请参考[API 文档](../../api/user-client-modules/组件%20TextContent.md)

## 滚动条 Scroll

`Scroll` 是滚动条组件，如果内容在一个界面大小内显示不下，可以使用滚动条组件，这样玩家可以使用鼠标滚轮或点击拖动来滚动内容。

### 基本使用

直接调用组件，然后填写组件内容即可：

```tsx {7-10}
import { Scroll } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        // loc 必填，表示组件位置
        <Scroll loc={[0, 0, 416, 416]}>
            <text text="text1" />
            {/* 省略更多内容 */}
        </Scroll>
    );
});
```

### 平铺布局

在使用 `Scroll` 组件时，我们推荐使用平铺式布局，即所有内容平铺在 `Scroll` 组件中，而不是将整体用一个 `container` 将它包起来，这非常有助于提高滚动条组件的性能。

例如下面这种格式就是**好的写法**：

```tsx {8-10}
import { Scroll } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        <Scroll loc={[0, 0, 416, 416]}>
            {/* 平铺内容，性能表现更好 */}
            <text text="text1" />
            <text text="text2" />
            <text text="text3" />
            {/* 省略更多内容 */}
        </Scroll>
    );
});
```

而下面这种就是**不好的写法**：

```tsx {8-12}
import { Scroll } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        <Scroll loc={[0, 0, 416, 416]}>
            {/* 用一个 container 包裹，性能表现不好 */}
            <container>
                <text text="text1" />
                <text text="text2" />
                <text text="text3" />
            </container>
        </Scroll>
    );
});
```

### 横向滚动条

添加 `hor` 标记，即可使滚动条变为横向。暂时没有既可以横向又可以纵向的滚动条。

```tsx {7}
import { Scroll } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        // 添加 hor 标记，变为横向
        <Scroll loc={[0, 0, 416, 416]} hor>
            <text text="text1" />
            {/* 省略更多内容 */}
        </Scroll>
    );
});
```

### 隐藏滚动条

有时候可能需要隐藏滚动条（例如样板的浏览地图界面中左侧的楼层列表），可以使用 `noscroll` 标记实现：

```tsx {7}
import { Scroll } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        // 添加 noscroll 标记，隐藏滚动条
        <Scroll loc={[0, 0, 416, 416]} noscroll>
            <text text="text1" />
            {/* 省略更多内容 */}
        </Scroll>
    );
});
```

### 布局补偿

有时候我们需要在滚动条滚动到最后时填充一些空白内容，可以使用 `padEnd` 来实现：

```tsx {7}
import { Scroll } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        // 使用 padEnd 在滚动条最后填充空白内容，单位像素
        <Scroll loc={[0, 0, 416, 416]} padEnd={120}>
            <text text="text1" />
            {/* 省略更多内容 */}
        </Scroll>
    );
});
```

### 代码控制滚动条

可以使用 `Scroll` 提供的接口来用代码控制滚动条：

```tsx {5-12,15-16}
import { Scroll, ScrollExpose } from '../components'; // [!code ++]
import { vue } from 'vue'; // [!code ++]

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 使用响应式变量定义 scroll 引用
    const scrollRef = ref<ScrollExpose>();

    onMounted(() => {
        // 滚动至 100 像素的位置，动画时长 500ms
        scrollRef.value?.scrollTo(100, 500);
    });

    return () => (
        // 将 ref 属性设为 scrollRef 来获取 Scroll 的接口
        <Scroll loc={[0, 0, 416, 416]} ref={scrollRef}>
            <text text="text1" />
            {/* 省略更多内容 */}
        </Scroll>
    );
});
```

### API 参考

API 参考[此文档](../../api/user-client-modules/组件%20Scroll.md)。

## 图标组件

在 `components/icons.tsx` 中内置了一些图标，可以直接使用。

### 基本使用

以箭头图标为例：

```tsx {8}
import { ArrowDownTailless } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        <container>
            {/* 调用图标组件 */}
            <ArrowDownTailless loc={[0, 0, 48, 48]} />
        </container>
    );
});
```

所有图标都可以填写图形元素的参数，例如 `fill` `stroke` `strokeStyle` `lineWidth` 等。大部分图标默认都是描边样式，如果使用填充可能会导致效果不好。例如修改描边样式和线宽：

```tsx {8}
import { ArrowDownTailless } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        <container>
            <ArrowDownTailless
                loc={[0, 0, 48, 48]}
                strokeStyle="cyan" // 描边使用青色
                lineWidth={2} // 线宽为 2px
            />
        </container>
    );
});
```

### 图标列表

目前样板包含这些图标：

- `RollbackIcon`: 回退图标
- `RetweenIcon`: 回收图标
- `ViewMapIcon`: 浏览地图图标
- `DanmakuIcon`: 弹幕图标
- `ReplayIcon`: 回放图标
- `numpadIcon`: 数字键盘图标
- `PlayIcon`: 开始播放图标
- `PauseIcon`: 暂停播放图标
- `DoubleArrow`: 双箭头图标（向右）
- `StepForward`: 单步向前图标
- `SoundVolume`: 音量图标
- `Fullscreen`: 全屏图标
- `ExitFullscreen`: 退出全屏图标
- `ArrowLeftTailless`: 无尾巴左箭头图标
- `ArrowRightTailless`: 无尾巴右箭头图标
- `ArrowUpTailless`: 无尾巴上箭头图标
- `ArrowDownTailless`: 无尾巴下箭头图标

### API 及参数参考

参数参考[此文档](../../api/motajs-render-vue/GraphicBaseProps.md)。

API 参考[此文档](../../api/user-client-modules/图标组件.md)

## 分页 Page

分页可以用来展示大量内容，在极端情况下，其性能要比 `Scroll` 更好，但交互手感与易用性不如滚动条。

### 基本使用

`Page` 组件需要传入两个必填参数 `pages` 和 `loc`，`pages` 代表总页数，`loc` 代表位置。

每个页面的内容使用插槽形式传入，接收 `page` 作为参数，代表当前是第几页。你可能不理解这句话，用代码写的话就是这样：

```tsx {6-17}
import { Page } from '../components';

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    return () => (
        <Page
            loc={[0, 0, 416, 416]} // 位置
            pages={10} // 总页码数
        >
            {/* 插槽内容，传入一个函数，参数代表当前是第几页 */}
            {(page: number) => (
                <container>
                    {/* 这里面填写当前页显示的内容，例如添加一个文字显示当前第几页 */}
                    <text text={page.toString()} />
                </container>
            )}
        </Page>
    );
});
```

### 第一种设置与获取当前页

可以通过 `v-model` 指令来创建双向数据绑定，从而达到设置与获取当前页码的功能。

这种方式一般情况下相对来说没有下一节提到的方式更好，因此相对不推荐。使用示例如下：

```tsx {7-13}
import { Page } from '../components';
// 从 vue 引入 ref 响应式函数
import { ref, watch } from 'vue'; // [!code ++]

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 定义响应式变量
    const nowPage = ref(0);

    // 监听当且页码的变化，需要的时候直接用 nowPage.value 获取也可
    watch(nowPage, value => core.drawTip(`切换至${value}页！`));
    /** 设置当前页码 */
    const changePage = (value: number) => void (nowPage.value = value);

    return () => (
        <Page
            loc={[0, 0, 416, 416]}
            pages={10}
            // 使用 v-model 指令创建双向数据绑定
            v-model:page={nowPage.value} // [!code ++]
        >
            {(page: number) => (
                <container>
                    <text text={page.toString()} />
                </container>
            )}
        </Page>
    );
});
```

### 第二种设置与获取当前页方式

相比于上一种方式，我们更推荐使用下面这种方式来设置与获取当前页。

可以使用 `Page` 组件提供的 `changePage` 和 `movePage` 来切换页码，其中前者是直接切换至某一页，后者是在当前页的基础上移动页码数。

可以使用 `now` 来获取当前页。

二者的示例如下：

:::code-group

```tsx [切换页码] {6-16,19-20}
import { Page, PageExpose } from '../components'; // [!code ++]
import { vue } from 'vue'; // [!code ++]

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 使用响应式变量定义 Page 引用
    const pageRef = ref<PageExpose>();

    onMounted(() => {
        // 切换至第五页
        pageRef.value?.changePage(5);
        // 在当前页的基础上增加两页，也就是切换到第七页
        pageRef.value?.movePage(2);
        // 在当前页的基础上减少两页，也就是切换回第五页
        pageRef.value?.movePage(-2);
    });

    return () => (
        // 将 ref 属性赋值为 pageRef 来获取其接口
        <Page loc={[0, 0, 416, 416]} pages={10} ref={pageRef}>
            {(page: number) => (
                <container>
                    <text text={page.toString()} />
                </container>
            )}
        </Page>
    );
});
```

```tsx [获取页码] {6-12,15-16}
import { Page, PageExpose } from '../components'; // [!code ++]
import { vue } from 'vue'; // [!code ++]

// 不再展示完整 UI 模板，只展示核心部分
export const MyCom = defineComponent(() => {
    // 使用响应式变量定义 Page 引用
    const pageRef = ref<PageExpose>();

    onMounted(() => {
        const page = pageRef.value?.now();
        core.drawTip(`当前是第${page}页！`);
    });

    return () => (
        // 将 ref 属性赋值为 pageRef 来获取其接口
        <Page loc={[0, 0, 416, 416]} pages={10} ref={pageRef}>
            {(page: number) => (
                <container>
                    <text text={page.toString()} />
                </container>
            )}
        </Page>
    );
});
```

:::

## 更多组件

本文只简单讲解了部分常用的组件，样板还有很多内置的组件。以下是所有内置组件的 API 参考：

- [ConfirmBox](../../api/user-client-modules/组件%20ConfirmBox.md)：确认框，一般使用 `getConfirm` 接口，不直接使用组件。
- [Choices](../../api/user-client-modules/组件%20Choices.md)：选择框，一般使用 `getChoice` 接口，不直接使用组件。
- [FloorSelector](../../api/user-client-modules/组件%20FloorSelector.md)：楼层选择组件，浏览地图左侧的楼层选择就是使用的本组件。
- [图标组件](../../api/user-client-modules/图标组件.md)：一些常用图标。
- [Input](../../api/user-client-modules/组件%20Input.md)：输入组件，可以放到组件内部，可以用于搜索栏等。
- [InputBox](../../api/user-client-modules/组件%20InputBox.md)：输入框组件，类似于确认框，一般使用 `getInput` 或 `getInputNumber` 接口，不使用本组件。
- [List](../../api/user-client-modules/组件%20List.md)：列表组件，可以用于展示一列内容。
- [ListPage](../../api/user-client-modules/组件%20ListPage.md)：左侧是列表，右侧是当前选项对应的详情页，可以用于游戏机制说明等。
- [Progress](../../api/user-client-modules/组件%20Progress.md)：进度条组件，播放录像时右下角的进度条就是本组件。
- [Arrow](../../api/user-client-modules/组件%20Arrow.md)：箭头组件，画一个箭头。
- [ScrollText](../../api/user-client-modules/组件%20ScrollText.md)：滚动文本组件，可以用于长剧情或是 staff 表等。
- [Selection](../../api/user-client-modules/组件%20Selection.md)：选择光标，列表组件的选择光标就是使用的本组件。
- [Background](../../api/user-client-modules/组件%20Background.md)：背景组件，可以设置为纯色或 `winskin`。
- [WaitBox](../../api/user-client-modules/组件%20WaitBox.md)：等待框，一般使用 `waitbox` 接口，不直接使用组件。
- [Page](../../api/user-client-modules/组件%20Page.md)：分页组件，本文已经详细讲解。
- [Scroll](../../api/user-client-modules/组件%20Scroll.md)：滚动条组件，本文已经详细讲解。
- [TextContent](../../api/user-client-modules/组件%20TextContent.md)：多行文本组件，本文已经详细讲解。
- [Textbox](../../api/user-client-modules/组件%20Textbox.md)：文本框组件，就是事件的显示文字，一般不会直接用。
- [Thumbnail](../../api/user-client-modules/组件%20Thumbnail.md)：缩略图组件，用于展示某个地图的缩略图。
- [Tip](../../api/user-client-modules/组件%20Tip.md)：提示组件，就是左上角的提示，一般不会直接使用。
