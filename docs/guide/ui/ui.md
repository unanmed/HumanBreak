---
lang: zh-CN
---

# UI 编写

本文将介绍如何在 2.B 样板中编写 UI，以及如何优化 UI 性能。

## 创建 UI 文件

首先，我们打开 `packages-user/client-modules/render` 文件夹，这里是目前样板的 UI 目录（之后可能会修改），我们可以看到 `components` `ui` 等文件夹，其中 `component` 是组件文件夹，也就是所有 UI 都可能用到的组件，例如滚动条、分页、图标等，这些东西不会单独组成一个 UI，但是可以方便 UI 开发。`ui` 就是 UI 文件夹，这里面存放了所有的 UI，我们在此文件夹下创建一个文件 `myUI.tsx`。

## 编写 UI 模板

下面，我们需要编写 UI 模板，以怪物手册为例，模板如下，直接复制粘贴即可：

```tsx
import { defineComponent } from 'vue';
import { GameUI, UIComponentProps, DefaultProps } from '@motajs/system-ui';
import { SetupComponentOptions } from '../components';

export interface MyBookProps extends UIComponentProps, DefaultProps {}

const myBookProps = {
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<MyBookProps>;

export const MyBook = defineComponent<MyBookProps>(props => {
    return () => <container></container>;
}, myBookProps);

export const MyBookUI = new GameUI('my-book', MyBook);
```

然后打开 `index.ts`，增加如下代码：

```ts
export * from './myUI';
```

## 添加一些内容

新的 UI 使用 tsx 编写，即 `TypeScript JSX`，可以直接在 ts 文件中编写 XML，非常适合编写 UI。例如，我们想要把 UI 的位置设为水平竖直居中，位置在 240, 240，长宽为 480, 480，并显示一个文字，可以这么写：

```tsx
// ... 其他内容
// loc 参数表示这个元素的位置，六个数分别表示：
// 横纵坐标；长宽；水平竖直锚点，0.5 表示居中，1 表示靠右或靠下对齐，可以填不在 0-1 范围的数
// 每两项组成一组，这两项要么都填，要么都不填，例如长宽可以都不填，横纵坐标可以都不填
// 不填时会使用默认值，或是组件内部计算出的值
return () => (
    <container loc={[240, 240, 480, 480, 0.5, 0.5]}>
        {/* 文字元素会自动计算长宽，因此不能手动指定 */}
        <text text="这是一段文字" loc={[240, 240, void 0, void 0, 0.5, 0.5]} />
    </container>
);
```

## 显示 UI

我们编写完 UI 之后，这个 UI 并不会自己显示，需要手动打开。我们找到 `ui/main.tsx`，在 `MainScene` 这个根组件中调用 `mainUIController.open`：

```ts
// 在这添加引入
import { MyBookUI } from './ui';
// ... 其他内容
const MainScene = defineComponent(() => {
    // ... 其他内容
    // 在这添加一句话，打开 UI，第二个参数为传入 UI 的参数，后面会有讲解
    // 纵深设为 100 以保证可以显示出来，纵深越大，元素越靠上，会覆盖纵深低的元素
    mainUIController.open(MyBookUI, { zIndex: 100 }); // [!code ++]
    return () => (
        // ... 其他内容
    );
});
```

这样的话，我们就会在页面上显示一个新的 UI 了！不过这个 UI 会是常亮的 UI，没办法关闭，我们需要更精细的控制。我们可以在内部使用 `props.controller` 来获取到 UI 控制器实例，使用 `props.instance` 获取到当前 UI 实例，从而控制当前 UI 的状态：

```tsx
export const MyBook = defineComponent<MyBookProps>(props => {
    // 例如，我们可以让它在打开 10 秒钟后关闭：
    setTimeout(() => props.controller.close(props.instance), 10000); // [!code ++]
    return () => (
        // ... UI 内容
    );
}, myBookProps);
```

除此之外，我们还可以在任意渲染端模块中引入 `ui/controller` 来获取到根组件的 UI 控制器。例如，我们可以在其他文件中控制这个 UI 的开启与关闭：

```ts
import { mainUIController, MyBookUI } from './ui';
import { IUIInstance } from '@motajs/system-ui';

let myBookInstance: IUIInstance;
export function openMyBook() {
    // 使用一个变量来记录打开的 UI 实例
    myBookInstance = mainUIController.open(MyBookUI, {});
}

export function closeMyBook() {
    // 传入 UI 实例，将会关闭此 UI 及其之后的 UI
    mainUIController.close(myBookInstance);
}
```

也可以使用 `Mota.require` 引入：

```ts
const { mainUIController } = Mota.require('@user/client-modules');
```

也可以通过 `UIController` 的接口获取其实例：

```ts
import { UIController } from '@motajs/system-ui';

const mainUIController = UIController.getController('main-ui');
```

关于 UI 打开与关闭的细节参考[此文档](./system.md#打开与关闭-ui)

更多的 UI 控制功能可以参考后续文档以及相关的 [UI 系统指南](./system.md) 或 [API 文档](../../api/motajs-system-ui/UIController)。

## 添加更多内容

既然我们要编写一个简易怪物手册，那么仅靠上面这些内容当然不够，我们需要更多的元素和组件才行，下面我们来介绍一些常用的元素及组件。

### 图标

既然是怪物手册，那么图标必然不能少，图标是 `<icon>` 元素，需要传入 `icon` 参数，例如：

```tsx
return () => (
    <container>
        {/* 显示绿史莱姆图标，位置在 (32, 32)，animate 表示循环播放动画 */}
        <icon icon="greenSlime" loc={[32, 32]} animate />
    </container>
);
```

### 字体

我们很多时候也会想要自定义字体，可以通过 `Font` 类来实现这个功能：

```tsx
import { Font, FontWeight } from '@motajs/render';

// 创建一个字体，包含五个参数，第一个是字体名称，第二个是字体大小，第三个是字体大小的单位，一般是 'px'
// 第四个是字体粗细，默认是 400，可以填 FontWeight.Bold，FontWeight.Light 或是数字，范围在 1-1000 之间
// 第五个是是否斜体。每个参数都是可选，不填则使用默认字体的样式。
const font = new Font('myFont', 24, 'px', FontWeight.Bold, false);
// 可以将这个字体设置为默认字体，之后的所有没有指定的都会使用此字体
Font.setDefaults(font);
// 如果需要使用默认字体，有两种写法
const font = new Font();
const font = Font.defaults();

return () => (
    <container>
        <icon icon="greenSlime" loc={[32, 32]} animate />
        <text
            text="绿史莱姆"
            // 使用上面定义的字体
            font={font}
            // 靠左对齐，上下居中对齐
            loc={[64, 48, void 0, void 0, 0, 0.5]}
        />
    </container>
);
```

更多的字体使用方法可以参考 [API 文档](../../api/motajs-render-style/Font)

### 圆角矩形

我们可以为怪物手册的一栏添加圆角矩形，写法如下：

```tsx
return () => (
    <container>
        <g-rectr
            // 圆角矩形的位置
            loc={[16, 16, 480 - 32, 480 - 32]}
            // 圆角矩形为仅描边
            stroke
            // 圆角半径，可以设置四个，具体参考圆角矩形的文档
            circle={[8]}
            // 描边样式，这里设为了金色
            strokeStyle="gold"
        />
    </container>
);
```

### 线段

我们也可以添加线段，作为怪物列表之间的分割线：

```tsx
return () => (
    <container>
        <g-line
            // 线段的起始位置和终止位置，不需要指定 loc 属性
            line={[16, 80, 480 - 16, 80]}
            // 线的端点为圆形
            lineCap="round"
            // 线宽为 1
            lineWidth={1}
            // 虚线样式，5 个像素为实，5 个像素为虚
            lineDash={[5, 5]}
        />
    </container>
);
```

### winskin 背景

我们可以为手册添加一个 winskin 背景，可以使用 `Background` 组件：

```tsx
// 从 components 文件夹中引入这个组件
import { Background } from '../components';

return () => (
    <container loc={[240, 240, 480, 480, 0.5, 0.5]}>
        <Background
            // 位置是相对于父元素的，因此从 (0, 0) 开始
            loc={[0, 0, 480, 480]}
            // 设置 winskin 的图片名称
            winskin="winskin.png"
        />
    </container>
);
```

### 滚动条

怪物多的话一页肯定显示不完，因此我们可以添加一个滚动条 `Scroll` 组件，用法如下：

```tsx
// 从 components 文件夹中引入这个组件
import { Scroll } from '../components';

return () => (
    // 使用滚动条组件替换 container 元素
    <Scroll loc={[240, 240, 480, 480, 0.5, 0.5]}> // [!code ++]
        <Background
            // 位置是相对于父元素的，因此从 (0, 0) 开始
            loc={[0, 0, 480, 480]}
            // 设置 winskin 的图片名称
            winskin="winskin.png"
        />
        {/* 其他内容 */}
    </Srcoll> // [!code ++]
);
```

在使用滚动条时，建议使用平铺式布局，将每个独立的内容平铺显示，而不是整体包裹为一个 `container`，这有助于提高性能表现。

### 循环

编写怪物手册的话，我们就必须用到循环，因为我们需要遍历当前怪物列表，然后每个怪物生成一个 `container`，在这个 `container` 里面显示内容。tsx 为我们提供了嵌入表达式的功能，因此我们可以通过 `map` 方法来遍历怪物列表，然后返回一个元素，组成元素数组，实现循环遍历的功能。示例如下：

```tsx
export const MyBook = defineComponent<MyBookProps>(props => {
    // 获取怪物列表，enemys 为 CurrenEnemy 数组，可以查看 package-user/data-fallback/src/battle.ts
    const enemys = core.getCurrentEnemys();
    // 工具函数，居中，靠右，靠左对齐文字
    const central = (x: number, y: number) => [x, y, void 0, void 0, 0.5, 0.5];
    const right = (x: number, y: number) => [x, y, void 0, void 0, 1, 0.5];
    const left = (x: number, y: number) => [x, y, void 0, void 0, 0, 0.5];

    return () => (
        <Scroll>
            {/* 写一个 map 循环，将一个容器元素返回，就可以显示了 */}
            {enemys.map((v, i) => {
                return (
                    <container loc={[0, 80 * i, 480, 80]}>
                        {/* 怪物图标与怪物名称 */}
                        <icon icon={v.enemy.id} loc={[32, 16, 32, 32]} />
                        <text text={v.enemy.enemy.name} loc={central(48, 64)} />
                        {/* 显示怪物的属性 */}
                        <text text="生命" loc={right(96, 20)} />
                        <text text={v.enemy.info.hp} loc={left(108, 20)} />
                        {/* 其他的属性，例如攻击，防御等 */}
                    </container>
                );
            })}
        </Scroll>
    );
}, myBookProps);
```

### 条件判断

可以在表达式中使用三元表达式或者立即执行函数来实现条件判断：

```tsx
return () => (
    <Scroll>
        {enemys.length === 0 ? (
            // 无怪物时，显示没有剩余怪物
            <text text="没有剩余怪物" loc={central(240. 240)} font={new Font('Verdana', 48)} /> // [!code ++]
        ) : (
            enemys.map(v => {
                // 有怪物时
            })
        )}
    </Scroll>
);
```

## 响应式

使用新的 UI 系统时，最大的优势就是响应式了，它可以让 UI 在数据发生变动时自动更改显示内容，而不需要手动重绘。本 UI 系统完全兼容 `vue` 的响应式系统，非常方便。

### 基础用法

例如，我想要给我的怪物手册添加一个楼层 id 的参数，首先我们先定义这个参数：

```tsx
import { computed } from 'vue';

export interface MyBookProps extends UIComponentProps {
    // 定义 floorId 参数
    floorId: FloorIds;
}

const myBookProps = {
    // 这里也要修改
    props: ['controller', 'instance', 'floorId']
} satisfies SetupComponentOptions<MyBookProps>;
```

然后我们需要在这个参数发生变动时修改怪物列表，可以这么写：

```tsx
export const MyBook = defineComponent<MyBookProps>(props => {
    // 使用 computed，这样的话就会自动追踪到 props.floorId 参数，更新怪物列表，并更新显示内容
    const enemys = computed(() => core.getCurrentEnemys(props.floorId)); // [!code ++]

    return () => (
        <Scroll>
            {/* 需要使用 enemys.value 属性，不能直接使用 enemys.length */}
            {enemys.value.length === 0 ? ( // [!code ++]
                <text text="没有剩余怪物" loc={central(240. 240)} font={new Font('Verdana', 48)} />
            ) : (
                // 同上，需要 value 属性
                enemys.value.map(v => {}) // [!code ++]
            )}
        </Scroll>
    );
}, myBookProps);
```

### 什么样的变量能使用响应式

其实，我们用一般的方式编写的变量或常量都是不能使用响应式的，例如这些都不行：

```ts
let num = 10;
let str = '123';

const num2 = computed(() => num * 2);
const str2 = computed(() => parseInt(str));
```

这么写的话，是没有响应式效果的，这是因为 `num` 和 `str` 并不是响应式变量，不能追踪到。对于 `string` `number` `boolean` 这些字面量类型的变量，我们需要使用 `ref` 函数包裹才可以：

```tsx
import { ref } from 'vue';

// 使用 ref 函数包裹
const num = ref(10);
// 使用 num.value 属性调用
const num2 = computed(() => num.value * 2);
// 使用 num.value 修改值
num.value = 20;

// 这样的话就有响应式效果了
<text text={num2.value.toString()} />;
```

对于对象类型来说，需要使用 `reactive` 函数包裹，这个函数会把对象变成深层响应式，任何一级发生更改都会触发响应式更新，例如：

```tsx
const obj = reactive({ obj1: { num: 10 } });

// 这个就不需要使用 value 属性了，只有 ref 函数包裹的需要
obj.obj1.num = 20;

// 直接调用即可，当值更改时内容也会自动更新
<text text={obj.obj1.num.toString()} />;
```

数组也可以使用 `reactive` 方法来实现响应式：

```tsx
// 传入一个泛型来指定这个变量的类型，这里使用数字数组作为示例
const array = reactive<number[]>([]);

// 可以使用数组自身的方法添加或修改元素
array.push(100);

<container>
    {/* 直接对数组遍历，数组修改后这段内容也会自动更新 */}
    {array.map(v => (
        <text text={v.toString()} />
    ))}
</container>;
```

如果对象比较大，只想让第一层变为响应式，深层的不变，可以使用 `shallowReactive` 或 `shallowRef`，或使用 `markRaw` 手动标记不需要响应式的部分：

```ts
// 这样的话，当 obj1.obj1.num 修改时，就不会触发响应式，而 obj1.obj1 修改时会触发
const obj1 = shallowReactive({ obj1: { num: 10 } });
// 使用 shallowRef，也可以变成浅层响应式
const obj2 = shallowRef({ obj1: { num: 10 } });
// 或者手动标记为不需要响应式
const obj3 = reactive({ obj1: markRaw({ num: 10 }) });
```

响应式不仅可以用在 `computed` 或者是渲染元素中，还可以使用 `watch` 监听。不过该方法有一定的限制，那就是尽量不要在组件顶层之外使用。下面是一些例子：

::: code-group

```ts [ref]
const num1 = ref(10);
const num2 = ref(20);

watch(num1, (newValue, oldValue) => {
    // 当 num1 的值发生变化时，在控制台输出新值和旧值
    console.log(newValue, oldValue);

    // 这里就不是组件顶层，不要使用 watch。如果需要条件判断的话，可以在监听函数内部判断，而不是外部
    watch(num2, () => {});
});
```

```ts [reactive]
const obj = reactive({
    num: 10,
    obj1: {
        num2: 20
    }
});

// 监听 obj.num
watch(
    () => obj.num,
    (newValue, oldValue) => {
        console.log(newValue, oldValue);
    }
);
// 监听 obj 整体
watch(obj, () => {
    console.log(obj.num);
});
```

:::

::: info
传入组件的 `props` 参数也是响应式的，可以通过 `watch` 监听，或使用 `computed` 追踪。
:::

关于更多 `vue` 响应式的知识，可以查看 [Vue 官方文档](https://cn.vuejs.org/)

## 鼠标与触摸交互事件

### 监听鼠标或触摸

通过上面这些内容，我们已经可以搭出来一个完整的怪物手册页面了，不过现在这个页面是死的，还没办法交互，我们需要让它有办法交互，允许用户点击和按键操作。UI 系统提供了丰富方便的接口来实现交互动作的监听，例如监听点击可以使用 `onClick`：

```tsx
const click = () => {
    console.log('clicked!');
};

// 直接将函数传入 onClick 属性即可
<container onClick={click}>{/* 渲染内容 */}</container>;
```

可以使用 `cursor` 属性来指定鼠标移动到该元素上时的指针样式，如下例所示，鼠标移动到这个容器上时就会变成小手的形状：

```tsx
<container cursor="pointer" />
```

鼠标与触摸事件的触发包括两个阶段，从根节点捕获，然后一路传递到最下层，然后从最下层冒泡，然后一路再传递回根节点，一般情况下我们使用冒泡阶段的监听即可，也就是 `onXxx`，例如 `onClick` 等，不过如果我们需要监听捕获阶段的事件，也可以使用 `onXxxCapture` 的方法来监听：

```tsx
const clickCapture = () => {
    console.log('click capture.');
};
const click = () => {
    console.log('click bubble.');
};

<container onClick={click} onClickCapture={clickCapture} />;
```

当点击这个容器时，就会先触发 `clickCapture` 事件，再触发 `click` 事件。

### 监听事件的类型

鼠标和触摸交互包含如下类型：

- `click`: 当按下与抬起都发生在这个元素上时触发，冒泡阶段
- `clickCapture`: 同上，捕获阶段
- `down`: 当在这个元素上按下时触发，冒泡阶段
- `downCapture`: 同上，捕获阶段
- `up`: 当在这个元素上抬起时触发，冒泡阶段
- `upCapture`: 同上，捕获阶段
- `move`: 当在这个元素上移动时触发，冒泡阶段
- `moveCapture`: 同上，捕获阶段
- `enter`: 当进入这个元素时触发，顺序不固定，没有捕获阶段与冒泡阶段的分类
- `leave`: 当离开这个元素时触发，顺序不固定，没有捕获阶段与冒泡阶段的分类
- `wheel`: 当在这个元素上滚轮时触发，冒泡阶段
- `wheelCapture`: 同上，捕获阶段

触发顺序如下，滚轮单独列出，不在下述顺序中：

1. `downCapture`，按下捕获
2. `down`: 按下冒泡
3. `moveCapture`: 移动捕获
4. `move`: 移动冒泡
5. `leave`: 离开元素
6. `enter`: 进入元素
7. `upCapture`: 抬起捕获
8. `up`: 抬起冒泡
9. `clickCapture`: 点击捕获
10. `click`: 点击冒泡

### 阻止事件传播

有时候我们需要阻止交互事件的继续传播，例如按钮套按钮时，我们不希望点击内部按钮时也触发外部按钮，这时候我们需要在内部按钮中阻止冒泡的继续传播。每个交互事件都可以接受一个参数，调用这个参数的 `stopPropagation` 方法即可阻止冒泡或捕获的继续传播：

```tsx
import { IActionEvent } from '@motajs/render';

const click1 = (e: IActionEvent) => {
    // 调用以阻止冒泡的继续传播
    e.stopPropagation();
    console.log('click1');
};
const click2 = () => {
    console.log('click2');
};

<container onClick={click2}>
    <container onClick={click1}></container>
</container>;
```

在上面这个例子中，当我们点击内层的容器时，只会触发 `click1`，而不会触发 `click2`，只有当我们点击外层容器时，才会触发 `click2`，这样就成功避免了内外两个按钮同时触发的场景。

### 事件对象的属性

事件包含很多属性，它们定义如下，其中 `IActionEventBase` 是 `enter` `leave` 的事件对象，`IActionEvent` 是按下、抬起、移动、点击的事件对象，`IWheelEvent` 是滚轮的事件对象。

::: code-group

```ts [IActionEventBase]
interface IActionEventBase {
    /** 当前事件是监听的哪个元素 */
    target: RenderItem;
    /** 是触摸操作还是鼠标操作 */
    touch: boolean;
    /**
     * 触发的按键种类，会出现在点击、按下、抬起三个事件中，而其他的如移动等该值只会是 {@link MouseType.None}，
     * 电脑端可以有左键、中键、右键等，手机只会触发左键，每一项的值参考 {@link MouseType}
     */
    type: MouseType;
    /**
     * 当前按下了哪些按键。该值是一个数字，可以通过位运算判断是否按下了某个按键。
     * 例如通过 `buttons & MouseType.Left` 来判断是否按下了左键。
     * 注意在鼠标抬起或鼠标点击事件中，并不会包含触发的那个按键
     */
    buttons: number;
    /** 触发时是否按下了 alt 键 */
    altKey: boolean;
    /** 触发时是否按下了 shift 键 */
    shiftKey: boolean;
    /** 触发时是否按下了 ctrl 键 */
    ctrlKey: boolean;
    /** 触发时是否按下了 Windows(Windows) / Command(Mac) 键 */
    metaKey: boolean;
}
```

```ts [IActionEvent]
export interface IActionEvent extends IActionEventBase {
    /** 这次操作的标识符，在按下、移动、抬起阶段中保持不变 */
    identifier: number;
    /** 相对于触发元素左上角的横坐标 */
    offsetX: number;
    /** 相对于触发元素左上角的纵坐标 */
    offsetY: number;
    /** 相对于整个画布左上角的横坐标 */
    absoluteX: number;
    /** 相对于整个画布左上角的纵坐标 */
    absoluteY: number;

    /**
     * 调用后将停止事件的继续传播。
     * 在捕获阶段，将会阻止捕获的进一步进行，在冒泡阶段，将会阻止冒泡的进一步进行。
     * 如果当前元素有很多监听器，该方法并不会阻止其他监听器的执行。
     */
    stopPropagation(): void;
}
```

```ts [IWheelEvent]
export interface IWheelEvent extends IActionEvent {
    /** 滚轮事件的鼠标横向滚动量 */
    wheelX: number;
    /** 滚轮事件的鼠标纵向滚动量 */
    wheelY: number;
    /** 滚轮事件的鼠标垂直屏幕的滚动量 */
    wheelZ: number;
    /** 滚轮事件的滚轮类型，表示了对应值的单位 */
    wheelType: WheelType;
}
```

:::

需要特别说明的是 `identifier` 属性，这个属性在移动端的表现没有异议，但是在电脑端，我们完全可以按下鼠标左键后，再按下鼠标右键，再按下鼠标侧键，抬起鼠标右键，抬起鼠标左键，再抬起鼠标侧键，这种情况下，我们必须单独定义 `identifier` 应该指代的是哪个。它遵循如下原则：

1. 按下、抬起、点击**永远**保持为同一个 `identifier`
2. 移动过程中，使用最后一个按下的按键的 `identifier` 作为移动事件的 `identifier`
3. 如果移动过程中，最后一个按下的按键抬起，那么依然会维持**原先的** `identifer`，**不会**回退至上一个按下的按键

除此之外，滚轮事件中的 `identifier` 永远为 -1。

## 监听按键操作

### 注册按键命令

首先，我们应该注册一个按键命令，我们从 `@motajs/system-action` 中引入 `gameKey` 常量，在模块顶层注册一个按键命令：

```ts
import { gameKey } from '@motajs/system-action';
import { KeyCode } from '@motajs/client-base';

gameKey
    // 将后面注册的内容形成一个组，在修改快捷键时比较直观
    // 命名建议为 @ui_[UI 名称]
    .group('@ui_mybook', '示例怪物手册')
    .register({
        // 命名时，建议使用 @ui_[UI 名称]_[按键名称] 的格式
        id: '@ui_mybook_moveUp',
        // 在自定义快捷键界面显示的名称
        name: '上移一个怪物',
        // 默认按键
        defaults: KeyCode.ArrowUp
    })
    // 可以继续注册其他的，这里不再演示
    .register({});
```

### 实现按键操作

然后，我们需要从 `@motajs/render` 中引入 `useKey` 函数，然后在组件顶层这么使用：

```tsx
import { useKey } from '@motajs/render';

export const MyBook = defineComponent<MyBookProps>(props => {
    // 第一个参数是按键实例，第二个参数是按键作用域，一般用不到
    const [key, scope] = useKey();

    return () => <container />;
});
```

最后，实现按键操作，使用 `key.realize` 方法：

```tsx
import { clamp } from 'lodash-es';

export const MyBook = defineComponent<MyBookProps>(props => {
    const selected = ref(0); // [!code ++]
    const [key, scope] = useKey();

    // 实现按键操作，让选中的怪物索引减一 // [!code ++]
    key.realize('@ui_mybook_moveUp', () => {
        // clamp 函数是 lodash 库中的函数，可以将值限定在指定范围内 // [!code ++]
        selected.value = clamp(0, enemys.value.length - 1, selected.value - 1); // [!code ++]
    });

    return () => <container />;
});
```

## 绘制选择框与动画

### 定义选择框动画

下面我们来把选择框加上，当按下方向键时，选择框会移动，当按下确定键时，会打开这个怪物的详细信息。首先，我们使用一个描边格式的 `g-rectr` 圆角矩形元素作为选择框：

```tsx
<Scroll>
    <g-rectr loc={[16, 16, 480 - 32, 480 - 32]} stroke strokeStyle="gold" />
</Scroll>
```

接下来，我们需要让它能够移动，当用户按下按键时，选择框会平滑移动到目标位置。这时候，我们可以使用动画接口 `transitioned` 来实现平滑移动。我们需要先用它定义一个动画对象：

```ts
// 这个函数在用户代码里面，直接引入
import { transitioned } from '../use';
// 从高级动画库中引入双曲速率曲线，该曲线视角效果相对较好
import { hyper } from 'mutate-animate';

// 创建一个纵坐标动画对象，初始值为 0（第一个参数），动画时长 150ms（第二个参数）
// 曲线为 慢-快-慢 的双曲正弦曲线（第三个参数）
const rectY = transitioned(0, 150, hyper('sin', 'in-out'));
```

然后，我们需要通过 `computed` 方法来动态生成圆角矩形的位置：

```ts
const rectLoc = computed(() => [
    16,
    // 使用 rectY.ref.value 获取到动画对象的响应式变量
    rectY.ref.value,
    480 - 32,
    480 - 32
]);
```

最后，我们把圆角矩形的 `loc` 属性设为 `computed` 值：

```tsx
<Scroll>
    <g-rectr loc={rectLoc.value} stroke strokeStyle="gold" />
</Scroll>
```

### 执行动画

接下来，我们需要监听当前选中怪物，然后根据当前怪物来设置元素位置，使用 `watch` 监听 `selected` 变量：

```ts
watch(selected, value => {
    // 使用 set 方法来动画至目标值
    rectY.set(16 + value * 80);
});
```

除此之外，我们还可以添加当鼠标移动至怪物元素上时，选择框也移动至目标，我们需要监听 `onEnter` 事件：

```tsx
const onEnter = (index: number) => {
    // 前面已经监听过 selected 了，这里直接设置即可，不需要再调用 rectY.set
    // 不过调用了也不会有什么影响，动画会智能处理这种情况
    selected.value = index;
};

<Scroll>
    {/* 把圆角矩形的纵深调大，防止被怪物容器遮挡 */}
    <g-rectr loc={rectLoc.value} stroke strokeStyle="gold" zIndex={10} />
    {enemys.map((v, i) => {
        // 元素内容不再展示。监听时，需要传入一个函数，因此需要使用匿名箭头函数包裹，
        // 添加 void 关键字是为了防止返回值泄漏，不过在这里并不是必要，因为 onEnter 没有返回值
        return <container onEnter={() => void onEnter(i)}></container>;
    })}
</Scroll>;
```

### 处理重叠

如果你去尝试着使用上面这个方法来实现动画，并给每个怪物添加了一个点击事件，你会发现你可能无法触发选中怪物的点击事件，这是因为 `g-rectr` 的纵深 `zIndex` 较高，交互事件会传播至此元素，而不会传播至下层元素，于是就不会触发点击事件。样板自然也考虑到了这种情况，我们只需要给圆角矩形添加一个 `noevent` 标识，即可让交互事件不会受到此元素的影响，不过相应地，这个元素上的交互事件也将会无法触发。示例如下：

```tsx
<Scroll>
    <g-rectr
        loc={rectLoc.value}
        stroke
        strokeStyle="gold"
        zIndex={10}
        // 添加 noevent 标识，事件就不会传播至此元素
        noevent // [!code ++]
    />
    {enemys.map((v, i) => {
        return <container onEnter={() => void onEnter(i)}></container>;
    })}
</Scroll>
```

## 调用 Scroll 组件接口

我们现在已经实现了按键操作，但是移动时并不能同时修改滚动条的位置，这会导致当前选中的怪物跑到画面之外，这时候我们需要自动滚动到目标位置，可以使用 `Scroll` 组件暴露出的接口来实现。我们使用 `ref` 属性来获取其接口：

```tsx
import { ScrollExpose } from './components';

const scrollExpose = ref<ScrollExpose>();

<Scroll ref={scrollExpose}></Scroll>;
```

然后，我们可以调用其 `scrollTo` 方法来滚动至目标位置：

```tsx
import { ScrollExpose } from './components';

const scrollExpose = ref<ScrollExpose>();

watch(selected, () => {
    // 滚动到选中怪物上下居中的位置，组件内部会自动处理滚动条边缘，因此不需要担心为负值
    scrollExpose.value.scrollTo(selected.value * 80 - 240);
});

<Scroll ref={scrollExpose}></Scroll>;
```

## 修改 UI 参数

在打开 UI 时，我们可以传入参数，默认情况下，可以传入所有的 `BaseProps`，也就是所有元素通用属性，以及自己定义的 UI 参数。`BaseProps` 内容较多，可以参考 [API 文档](../../api/motajs-render-core/RenderItem.md)。除此之外，我们还为这个自定义怪物手册添加了 `floorId` 参数，它也可以在打开 UI 时传入。如果需要打开的 UI 参数具有响应式，例如可以动态修改楼层 id，可以使用 `reactive` 方法。示例如下：

```ts
import { MyBookProps, MyBookUI } from './myUI';

const props = reactive<MyBookProps>({
    floorId: 'MT0',
    zIndex: 100
});

mainUIController.open(MyBookUI, props);
```

我们可以监听状态栏更新来实时更新参数：

```ts
import { hook } from '@user/data-base';

// 监听状态栏更新事件
hook.on('updateStatusBar', () => {
    // 状态栏更新时，修改怪物手册的楼层为当前楼层 id
    props.floorId = core.status.floorId,
});
```

## 总结

通过以上的学习，你已经可以做出一个自己的怪物手册了！试着做一下吧！
