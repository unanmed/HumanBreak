# UI 编写

新样板对 UI 系统进行了完全性重构，构建了一种新的 UI 系统。当然，你还可以继续使用旧的`createCanvas`流程进行 UI 编写，但是在新版 UI 的加持下，你可以更方便地管理多级 UI 以及内嵌 UI。同时，新版 UI 系统也提供了画布 API，你依然可以通过画布进行 UI 绘制及交互处理。

注意，本页所说内容全部基于[渲染进程](./system.md#进程分离)，请注意进程分离。

本页面注重于 UI 编写的指引，如果你想了解新版 UI 系统，请查看[UI 系统](./ui-control.md)

## VNode

新版 UI 系统基于 Vue 的 `h` 函数，它用于生成出 `VNode`，当显示时可以直接渲染到页面上。而对于新版 UI，可以认为是一种 `VNode` 生成器，用于生成出模板化的 `VNode`，从而简化了 API，避免写出冗长的 `h` 函数链。因此，应当注意区分 `VNode` 与新版 UI 系统。

## MComponent

对于新版 UI，应当使用系统提供的类 `MComponent` 进行编写。它的类型过于复杂，这里不再列出。下面我们将会以怪物手册为例，一步步做出一个属于你自己的怪物手册。

## 创建组件

想要写出一个 UI，就要先创建一个组件，我们可以直接构造`MComponent`类，也可以通过函数`m`进行创建：

```js
const MComponent = Mota.require('class', 'MComponent');
const m = Mota.require('fn', 'm');

const myUI = new MComponent();
// 等价于
const myUI = m();
```

因此，方便起见，我们更多地使用`m`函数创建组件。

## 编写 UI

创建组件之后，我们就可以编写 UI 了。我们首先来看下面这些基础函数：

```ts
// 在 MComponent 类上，也就是创建的组件上
function div(children?: any | any[], config?: any): this
function span(children?: any | any[], config?: any): this
function canvas(config?: any): this
function text(text: string | (() => string), config?: any): this
```

这些函数都是渲染单独内容的，分别是渲染 `div` `span` `canvas` 和文字。例如，我想在 UI 上渲染出一个画布，和一句话，可以写么写：

```js
myUI
    .canvas()
    .text('这是要渲染的内容');
```

这便是这四个函数的最基础的用法。除此之外，文字还可以传入一个函数，每次渲染 UI 的时候都会获取其返回值作为渲染内容，也就可以实现单个组件在不同条件下渲染内容不同了。例如：

```js
let cnt = 0;
core.registerAnimationFrame('example', true, () => {
    cnt++; // 每帧让 cnt 加一
});
myUi.text(() => cnt.toString()); // 显示文字，文字是一个函数，返回cnt
// 其效果便是每次显示这个组件的时候，都会显示出cnt的值，注意并不会实时更新，因为cnt不是一个响应式变量
// 如果想要实时更新，请了解vue的响应式机制
```

对于 `div` 和 `span`，还可以添加子内容，例如可以在 `div` 里面套一个 `div`，再套一个 `span`，再套一个 `canvas`。每个子内容都可以是一个 `MComponent` 组件，或其数组：

```js
myUi
    .div(
        m()
            .div(
                m()
                    .span(
                        m().canvas()
                    )
            )
    );
```

这样，我们就实现了元素的嵌套功能，布局也能够更加灵活。对于 `config` 参数，由于其非常复杂，请参考本页之后的内容。

## 导出并渲染 UI

当我们将 UI 编写完毕后，我们并不能直接渲染在页面上，我们需要将它导出，使用 `export` 函数：

```js
const show = myUI.export();
```

然后我们需要将其注册为一个 `GameUi`。这里都是模式化的编写方式，直接照葫芦画瓢即可，一般不需要理解很多。详见[UI 系统](./ui-control.md)

```js
// 这里 mainUi 指的是有优先级的 UI，例如怪物手册及怪物详细信息
// 而 fixedUi 指的是没有优先级的 UI，例如状态栏与自定义工具栏，多个自定义工具栏等
const { mainUi, fixedUi } = Mota.requireAll('var');
const { GameUi } = Mota.requireAll('class');

// 注册使用 register 函数
// 这里的 'myUI' 指的是 UI 名称，而第二个参数指的是 UI 内容。
mainUi.register(new GameUi('myUI', myUI));
// fixedUi 注册也是同样，mainUi 与 fixedUi 间可以重名
fixedUi.register(new GameUi('myUI', myUI));
```

下面我们可以来打开这个 UI 了：

```js
// 直接调用 open 函数即可打开 UI
mainUi.open('myUI');
```

::: tip
UI 的导出具有顺序无关性，也就是说，如果导出后继续新增内容，新增的内容不需要重新导出也可以显示。
:::

## 列表渲染

我们可以对一个列表进行渲染，例如我们要渲染怪物手册，就需要获取每个怪物信息，这时，我们就需要用到列表渲染了：

```ts
function vfor(items: any[] | (() => any[]), map: (value: any, index: number) => VNode): this
```

函数要求传入两个参数：

-   `items`: 要渲染的列表，是一个数组，或者是一个返回数组的函数。
-   `map`: 渲染函数，接受列表项与索引作为参数，返回 `VNode`，注意不是 `MComponent` 组件。

除此之外，我们还会用到 `MComponent` 上的静态函数 `vNodeS`：

```ts
function vNodeS(mc: MotaComponent, mount?: number): VNode
```

这个函数用于将单个渲染内容生成为单个的 `VNode`。

为了生成单个渲染内容，我们需要获取到模块 `MCGenerator`，使用它上面的函数，`MComponent` 上的函数也是基于它的。

例如，我获取了所有怪物的信息，需要渲染每个怪物的名称，就可以这么写：

```js
// 首先获取渲染内容生成器，用于生成渲染内容
const { text, div } = Mota.require('module', 'MCGenerator');
// 定义渲染列表，例如这里我们就要渲染当前楼层的所有怪物
// 由于当前楼层id会随着游戏进行而变化，因此是一个动态列表，因此需要函数包裹，这样可以确保每次获取的都是正确的楼层
const enemys = () => core.getCurrentEnemys();

myUI.vfor(enemys, (value, index) => {
    // 要求返回一个 VNode，因此需要经过 MComponent.vNodeS 的包裹
    return MComponent.vNodeS(
        // 输出内容，是一个由div包裹的文字显示
        div(text(value.enemy.enemy.name))
    );
})
```

这样，我们就把每个怪物的名称渲染出来了！相比于直接使用 `canvas` 绘制，是不是简便了很多。

## 渲染组件

假如我们在很多组件里面需要共用一部分内容，每个组件里面都写一遍显然很麻烦，因此我们可以把这部分组件单独拿出来，然后做成一个组件，供其他组件使用。而这也是 `Vue` 组件一个相当强大的功能，在 `MComponent` 组件中也有相应的功能。

例如，我们先编写一个组件，内容是显示 `lhjnb`：

```js
const lhjnb = m()
    .div(
        m().text('lhjnb')
    )
    .export();
```

然后，我们可以通过调用 `com` 函数来渲染组件。`com` 函数用法如下：

```ts
function com(component: any, config?: any): this
```

我们就可以将这个组件添加到我们的 UI 中了：

```js
// 传入 lbjnb 组件
myUI.com(lhjnb);
```

对于传入的组件，也可以是一个 `MComponent` 未导出组件，这样的话，这个未导出组件会被视为与当前组件在同一级，对于组件分级，请查看[组件嵌套关系](#组件嵌套关系)

## 内置组件

样板还内置了部分组件，以及一些包装好的函数可以使用。你甚至还可以把样板自带的 UI 渲染到你的 UI 上，当然由于样式的改变，效果可能会不尽人意。例如，样板就内置了一个渲染图标的组件，它使用 `canvas` 逐帧绘制实现：

```ts
// 在模块 MCGenerator 中
function icon(
    id: string,
    width?: number,
    height?: number,
    noBoarder?: number // 怪物图标是否设置为无边框无背景形式
): VNode
```

例如，这个时候我就可以给怪物手册中添加一个图标了：

```js {8-9}
const { text, div, icon } = Mota.require('module', 'MCGenerator');
const enemys = () => core.getCurrentEnemys();

myUI.vfor(enemys, (value, index) => {
    return MComponent.vNodeS(
        // 输出先由一个 div 包裹，参数可以填数组，因此这里直接填入了数组作为 children
        div([
            // 渲染图标
            icon(value.enemy.id),
            // 渲染怪物名称
            text(value.enemy.enemy.name)
        ])
    );
})
```

## 组件嵌套关系

对于任何组件，其子组件都不应该影响父组件本身，而在这里也是如此。除非你使用全局变量作为桥梁，任何子组件都不会影响父组件的渲染与参数等。

在渲染子组件时，我们可以选择子组件是否经过 `export`，而经不经过导出处理，最终结果是不一样的。具体表现如下：

-   如果子组件经过了 `export` 处理，那么子组件会被视为新一级的组件
-   而如果没有经过 `export` 处理，则会视为当前级组件
-   组件是否为当前级影响着画布的获取，一个组件在接口中只能获取到当前级的画布，而不能获取其子级画布

获取画布接口请参考[钩子](#钩子)

如果不使用 `MComponent` 进行渲染，直接调用 `MComponent.vNode` 等函数生成 `VNode`，依然会被视为一级新的组件。

## 条件渲染

很多时候我们会根据一些条件去判断一个内容是否渲染，样板同样有相关的接口。接口在 `config` 参数中：

```ts
interface Config {
    vif: () => boolean
    velse: boolean
}
```

其中`vif`表示渲染条件，不填时视为永远满足，当满足这个条件的时候渲染内容，`velse`表示是否是否则选项，当`velse`与`vif`同时出现时，效果等同于`else if`。于是，我们便可以依此来判断怪物的特殊属性，如果没有特殊属性，那么就渲染为`无属性`，否则渲染怪物的属性列表。

```js {16-25}
const { text, div, icon, vfor, span } = Mota.require('module', 'MCGenerator');
const enemys = () => core.getCurrentEnemys();
// 用于获取怪物应该显示在手册上的信息的函数
const { getDetailedEnemy } = Mota.require('module', 'UITools').fixed;

myUI.vfor(enemys, (value, index) => {
    // 首先要获取怪物的详细信息
    const detail = getDetailedEnemy(value.enemy);
    return MComponent.vNodeS(
        // 输出先由一个 div 包裹，参数可以填数组，因此这里直接填入了数组作为 children
        div([
            // 渲染图标
            icon(value.enemy.id),
            // 渲染怪物名称
            text(value.enemy.enemy.name),
            // 当怪物拥有特殊属性时
            div([
                // 渲染怪物的特殊属性，还需要一层 for 嵌套
                vfor(detail.special, ([name, desc, color], index) => {
                    // 这里的special是一个数组，第一项表示名称，第二项表示说明，第三项表示名称颜色
                    // 这里我们只渲染名称
                    return span(text(name))
                })
            ], { vif: () => detail.special.length > 0 }), // 当怪物拥有特殊属性时
            div(span(text('无属性')), { velse: true }) // 否则渲染无属性
        ])
    );
})
```

## 传递参数

我们会发现，`icon` 函数可以将怪物 id 传入组件中并显示出来，这种行为叫做传递`props`，在这里我们也称为传递参数。拥有了传递参数的功能，我们可以接收来自父组件的参数，同时根据父组件的意愿渲染出对应的内容。

例如，就拿样板内置的 `BoxAnimate` 组件为例，也就是 `icon` 函数渲染的组件，我们可以通过 `config` 传递参数。对于每个 `props`，都要求是一个函数，其返回值作为真正传递的参数。如果想要传递函数，那么就需要是一个返回函数的函数。如果只想传递一个常量，又不想写一个函数，那么可以使用 `MCGenerator` 提供的 `f` 函数。

```js
const { BoxAnimate } = Mota.require('module', 'UIComponents');
const { f } = Mota.require('module', 'MCGenerator');

myUI.com(BoxAnimate, { props: { id: f('redSlime') } });
// 这个就等效于使用 icon 函数：
myUI.h(icon('redSlime'));
```

## 定义参数

如果我们想给自己的组件定义一些参数，可以使用 `defineProps` 函数：

```ts
function defineProps(props: Record<string, any>): this
```

这个函数传入一个对象，其键表示参数名称，值表示参数类型，例如：

```js
const com = m().defineProps({
    id: String, // 对于字符串、数字、布尔值，类型表示为String, Number, Boolean
    num: Number,
    ui: GameUi // 对于对象，可以表示为 Object 或者类名
})
```

这样，我们就可以向这个组件传递参数了，如果参数类型不正确，或者传递的参数并没有定义，依然可以正确运行，不过会在控制台输出警告。例如：

```js
const { f } = Mota.require('module', 'MCGenerator');
// 传入lhjnb作为参数，但是由于还有两个参数没有传递，会在控制台有报错，不过依然可以正确运行
myUI.com(com, { props: { id: f('lhjnb') } });
```

对于如何获取传入的参数，请参考[钩子](#钩子)

## 传递 Attribute

我们还可以向浏览器的 DOM 元素中添加信息，只要我们将值传递给 `props` 即可，例如我们可以给一个 `span` 元素添加 id，设置样式等。就拿上面的怪物特殊属性举例，我们如果想要让不同的属性显示出对应的颜色，那么可以这么写：

```js {15-18}
const { text, div, icon, vfor, span } = Mota.require('module', 'MCGenerator');
const enemys = () => core.getCurrentEnemys();
const { getDetailedEnemy } = Mota.require('module', 'UITools').fixed;

myUI.vfor(enemys, (value, index) => {
    const detail = getDetailedEnemy(value.enemy);
    return MComponent.vNodeS(
        div([
            // 渲染图标
            icon(value.enemy.id),
            // 渲染怪物名称
            text(value.enemy.enemy.name),
            // 当怪物拥有特殊属性时
            div([
                vfor(detail.special, ([name, desc, color], index) => {
                    // 将 style 作为 props 传入即可，这样颜色就能正确显示出来了
                    return span(text(name), { props: { style: f(`color: ${color}`) } });
                })
            ], { vif: () => detail.special.length > 0 }), // 当怪物拥有特殊属性时
            div(span(text('无属性')), { velse: true }) // 否则渲染无属性
        ])
    );
})
```

## 监听事件与 emits

对于 `props`，有一类特殊的属性，由 `on` 开头，然后紧跟着大写字母，这种形式的 `props` 会被视为监听函数。例如，我想监听一个 `div` 的点击事件，当玩家点击这个 `div` 时，在控制台输出 `clicked!`，那么可以这么写：

```js
myUI.div(
    [], // 没有子元素，填空数组
    {
        props: {
            onClick: f((e) => {
                // 当点击时，输出 clicked! 与点击位置相对于浏览器左上角的坐标
                console.log('clicked!', e.clientX, e.clientY);
            })
        }
    }
)
```

对于自定义组件，依然可以使用同样的方法监听其 `emits`，`emits` 可以认为是组件的事件，可以在组件内部触发。例如，对于样板自带的 `Column` 组件，它有一个 `close` 事件，我们便可以用这种方式进行监听：

```js
const { Column } = Mota.require('module', 'UIComponents');

myUI.com(
    Column,
    {
        props: {
            // 监听close事件，所以名为 onClose
            onClose: f(() => {
                // 当 close 事件触发时，会在控制台输出 close emitted!
                console.log('close emitted!');
            })
        }
    }
)
```

你也可以为自己的组件定义自己的 `emits`，通过 `defineEmits` 函数：

```js
myUI.defineEmits(['myEmit']); // 传入一个字符串数组，表示组件的 emits 名称列表
```

这样，你就可以在其他地方监听这个组件的 `emits` 了

## 渲染函数

`MComponent` 上也有一个名为 `h` 的渲染函数，但是它与 `Vue` 的渲染函数不同。在这里，`h` 函数的用法如下：

```ts
function h(type: any, children?: any | any[], config?: any): this
```

上面用到的所有函数，包括 `div` `span` `canvas` `text` `com` 在内的函数都基于这个函数。借助于这个函数，我们可以更加灵活地编写我们的 UI。

对于第一个参数，它可以填写这些内容：

-   `text`: 表示渲染文字，等价于 `text` 函数，需要填写 `config` 参数的 `innerText` 属性
-   `component`: 表示渲染组件，需要在 `config` 参数中填写 `component` 属性或 `dComponent` 属性，详见[动态组件](#动态组件)
-   任何 DOM 元素的名称，例如 `span` `li` `input` 等，表示渲染 DOM 元素
-   任何 `MComponent` 组件，表示渲染组件，等价于填写 `component`，然后填写对应的 `config` 属性，也等价于 `com` 函数
-   任何导出后的组件，或者是样板自带组件，与填写 `MComponent` 时类似

例如：

```js
myUI
    .h('div')
    // 注意，如果你确保递归调用组件没问题，那么你可以按下面这样递归调用自身作为组件，否则出问题概不负责！
    .h('component', [], { component: myUI })
    .h('text', [], { innerText: 'lhjnb' });
```

## 动态组件

当 `h` 函数传入 `component` 作为类型时，可以作为动态组件使用，要求填写 `config` 参数的 `component` 属性或者 `dComponent` 属性。填写 `component` 属性时，等价于 `com` 函数，这里不再赘述，下面我们来看填写 `dComponent` 属性时的情况。

这个属性要求传入一个函数，函数返回一个导出组件，注意不能是 `MComponent` 组件，也不能是 `VNode`。例如：

```js
const randomComponent = [BoxAnimate, Box, Column];
// 随机渲染一个组件上去！
myUI.h(
    'component',
    [],
    { dComponent: () => randomComponent[Math.floor(Math.random() * 3)] }
);
```

## 传递插槽

插槽的功能是向子组件中渲染内容，在目前样板中，没有提供定义插槽的方法，只能向子组件中传递插槽。这也意味着，你只能向样板内置组件或者 `Vue` 内置组件中传递插槽。不过，在[自定义 setup](#自定义-setup)中，提供了另一种方式可以渲染插槽（定义插槽）

你可以通过 `config` 参数的 `slots` 属性传递插槽，每个插槽都是一个函数，要求返回一个 `VNode` 或其数组用于渲染。例如，对于滚动条组件 `Scroll`，它有一个默认插槽 `default`，你可以这样传递插槽：

```js
const { icon, div } = Mota.require('module', 'MCGenerator');
myUI.com(Scroll, [], {
    slots: {
        // 传递默认插槽
        default: () => {
            // 返回 VNode，使用 MComponent 上的静态函数 vNode，它可以将 MCGenerator 生成的渲染内容生成为 vNode
            return MComponent.vNode([
                div(icon('greenSlime')),
                div(icon('redSlime'))
            ]);
        }
    }
})
```

## 钩子

下面是样板提供的几个钩子接口。什么是钩子呢？就是在组件渲染的不同时刻执行传入的函数。目前样板中，提供了两个接口，分别是：

-   `onSetup`: 当组件开始渲染时，这时组件内容还没有挂载到页面上
-   `onMounted`: 当组件渲染完毕时，这时组件已经完全渲染到了页面上

这两个函数都会接收两个参数，分别是 `props` 和 `ctx`。

-   `props`: 表示父组件传递过来的参数（`props`）
-   `ctx`: `setup` 上下文，用于触发 `emits`，渲染插槽（定义插槽）等，不过在这里渲染插槽没有用处

例如：

```js
myUI.onSetup((props, ctx) => {
    // 输出父组件传递的参数
    console.log(props);
    // 触发名为 close 的 emits，同时将 123 作为数据输出，数据可以由父组件的监听函数的参数中获取
    ctx.emits('close', 123);
});
```

对于 `onMounted` 函数，还会另外多一个参数，描述的是当前级组件（不包括子组件，但包括 `MComponent` 未导出组件，详见[组件嵌套关系](#组件嵌套关系)）中所有的画布。例如：

```js
myUI
    // 创建一个 id 为 my-canvas 的画布
    .canvas({ props: { id: f('my-canvas') } })
    // 当组件渲染完毕时
    .onMounted((props, ctx, canvas) => {
        const myCanvas = canvas[0];
        if (myCanvas?.id === 'my-canvas') {
            // 获取画布的绘制上下文
            const ctx = myCanvas.getContext('2d');
            // 绘制一条线，也可以使用样板的 core.drawLine 等 api 绘制
            ctx.moveTo(0, 0);
            ctx.lineTo(200, 200);
            ctx.stroke();
        }
    });
```

## 自定义 setup

自定义 `setup` 允许你完全控制组件的渲染内容，并在组件渲染时执行脚本。它包含两个接口：

-   `ret`: 设置 `setup` 的返回值，即组件的最终渲染函数
-   `setup`: 完全重写设置组件的 `setup` 函数，让组件完全自定义

`setup` 的含义是，这个组件被渲染的时候，执行的函数

例如，你可以通过 `ret` 接口来修改你的组件的渲染内容，而由于可以直接操作渲染内容，你便可以做到渲染插槽（定义插槽）

```js
const { icon, div, span, text } = Mota.require('module', 'MCGenerator');
myUI.ret((props, ctx) => {
    // 函数要求返回 VNode，因此要有 vNode 函数包裹
    // 注意在这里请尽量避免使用导出组件直接作为返回值，这会对性能造成一定的影响
    return MComponent.vNode([
        span(text('lhjnb')),
        div(icon('greenSlime')),
        ctx.slots.defaults(), // 渲染插槽（定义插槽）
    ]);
})
```

还可以通过 `setup` 函数完全重写组件。对于稍微复杂点的组件，我们都需要使用这个功能。

::: tip
重写 setup 函数后，应当重新 export 组件，否则内容不会变化
:::

```js
// 这里就需要获取 vue 的函数了，还可以使用 ref 实现响应式布局
const { onMounted, ref } = Mota.Package.require('vue');

myUI.setup((props, ctx) => {
    // 当组件渲染完毕时
    onMounted(() => {
        console.log('mounted!');
    });

    const cnt = ref(0);

    // setup 函数要返回一个函数，函数返回值为 VNode
    return () => {
        return MComponent.vNode([
            span(text('lhjnb')),
            div(icon('greenSlime')),
            span(text(cnt.value)) // 使用响应式变量cnt，当其更改时，渲染内容也会随之更改
        ]);
    }
})
```

实际上，样板自带的 `setup` 函数也是使用它来实现的：

```ts
const setup = (props, ctx) => {
    const mountNum = MComponent.mountNum++;
    this.onSetupFn?.(props, ctx);

    onMounted(() => {
        this.onMountedFn?.(
            props,
            ctx,
            Array.from(
                document.getElementsByClassName(
                    `--mota-component-canvas-${mountNum}`
                ) as HTMLCollectionOf<HTMLCanvasElement>
            )
        );
    });

    if (this.retFn) return () => this.retFn!(props, ctx);
    else {
        return () => {
            const vNodes = MComponent.vNode(
                this.content,
                mountNum
            );
            return vNodes;
        };
    }
}
```

## 怪物手册示例

下面我们将做一个简易的怪物手册作为 UI 示例。在这里，我们使用样板组件 `Column` 进行编写，它可以让一个 UI 分为两栏，同时还可以设置大小，及左右栏占比，对于制作说明式的 UI 非常有用。示例中包含了按键操作的说明，详见[按键系统](./hotkey.md)

内容较长，可以复制到编辑器内查看。

```js
// 首先引入需要的接口，注意以下所有内容均基于渲染进程
const { MComponent, GameUi } = Mota.requireAll('class');
const { getDetailedEnemy } = Mota.require('module', 'UITools').fixed;
const { Column } = Mota.require('module' ,'UIComponents');
const { com, div, span, text, icon, f, vfor } = Mota.require('module', 'MCGenerator');
const { mainUi, gameKey } = Mota.requireAll('var');
const { m } = Mota.requireAll('fn');
const { ref, computed, onUnmounted } = Mota.Package.require('vue');

// 怪物手册属于较为复杂的内容，必须要完全重写 setup
const myBook = m().setup((props, ctx) => {
    const close = () => {
        // 对于每个直接由 UI 系统打开的 UI，都会有一个 num 参数，表示这个 UI 的标识符
        // 这个标识符可以用于关闭 UI，例如下面就是关闭这个 UI
        // 更多内容请查阅 UI 系统章节
        mainUi.close(props.num);
    }

    onUnmounted(() => {
        // 当关闭 UI 时，跳出当前层按键作用域
        // 注意由于 UI 可能是被其他原因被关闭的，不会执行 close 函数，因此要使用 onUnmounted 钩子
        gameKey.dispose(props.ui.symbol);
    });

    const enemys = core.getCurrentEnemys();

    // 对于 number string boolean，要做响应式需要 ref，对于对象，需要 reactive，更多信息请了解 vue 的响应式
    const selected = ref(0);
    // computed 会自动追踪用到的响应式变量，同时在响应式变量更改时更改 enemy 的值
    const enemy = computed(() => enemys[selected.value]);

    // 按键系统，首先创建新作用域，然后实现按键操作
    gameKey
        .use(props.ui.symbol)
        // 上移一位
        .realize('@book_up', () => {
            if (selected.value > 0) selected.value--;
        })
        // 下移一位
        .realize('@book_down', () => {
            if (selected.value < enemys.length - 1) selected.value++;
        })
        // 下移5位
        .realize('@book_pageDown', () => {
            if (selected.value >= enemys.length - 5) {
                selected.value = enemys.length - 1;
            } else {
                selected.value += 5;
            }
        })
        // 上移5位
        .realize('@book_pageUp', () => {
            if (selected.value <= 4) {
                selected.value = 0;
            } else {
                selected.value -= 5;
            }
        })
        // 退出
        .realize('exit', () => {
            close();
        });

    // 要渲染的怪物属性
    const status = [
        ['hp', '生命', 'lightgreen']
        ['atk', '攻击', 'lightcoral'],
        ['def', '防御', 'lightblue'],
        ['exp', '经验', 'lightgreen'],
        ['gold', '金币', 'lightyellow']
    ];

    // 简写数据格式化
    const format = core.formatBigNumber;

    // 属性样式，由于多次用到在这里声明为一个常量
    const statusStyle = {
        props: {
            style: f(`
                display: flex;
                flex-direction: row;
                color: ${color};
            `)
        }
    };
    const statusSpanStyle = {
        props: {
            style: f(`
                flex-basis: 30%;
                text-align: right;
                margin-right: 5%;
            `)
        }
    }

    return () => {
        // 要求返回 VNode。对于大部分情况，如果你不确定是否要包裹 vNode 的话，包裹一层不会有任何副作用
        return MComponent.vNode([
            com(Column, {
                // Column 组件共有四个参数，分别是宽高，与左右占比，单位都是百分比
                // 宽高作为百分比时描述的一般是相对于父组件宽高的占比，对于根组件自然就是屏幕的占比了
                props: {
                    width: f(70),
                    height: f(70),
                    left: f(30),
                    right: f(70),
                    onClose: f(close) // Column 组件自带关闭的功能，监听 close 事件即可，然后将 close 函数传入
                },
                // Column 组件包含名为 left 和 right 的插槽，向其中传入要渲染的内容即可
                // 在这里，左侧渲染怪物列表，右侧渲染怪物信息
                slots: {
                    // 左侧内容，为当前楼层的怪物列表
                    left: () => {
                        return MComponent.vNode([
                            // 列表渲染，遍历函数要返回单个 VNode
                            vfor(enemys, (value, index) => {
                                return MComponent.vNodeS(
                                    div(
                                        [
                                            // 渲染怪物的图标，设置为无边框与背景
                                            icon(value.enemy.id, void 0, void 0, true),
                                            // 然后是怪物名称
                                            span(text(value.enemy.enemy.name))
                                        ],
                                        {
                                            props: {
                                                // selectable 是样板内置的样式类，选中时会有选中动画
                                                class: f('selectable'),
                                                // selected 属性表示是否选中
                                                selected: () => selected.value === index,
                                                style: f(`
                                                    margin: 0 0 4px 0;
                                                    display: flex;
                                                    flex-direction: row;
                                                    align-items: center;
                                                `)
                                            },
                                            // 当点击这个怪物时
                                            onClick: f(() => {
                                                selected.value = index;
                                            })
                                        }
                                    )
                                );
                            });
                        ]);
                    },
                    // 右侧内容，显示怪物的详细信息
                    right: () => {
                        return MComponent.vNode([
                            // 顶部，渲染怪物图标与名称
                            div([
                                // 没有边框
                                icon(enemy.value.enemy.id, void 0, void 0, true);
                                span(text(enemy.value.enemy.enemy.name), {
                                    props: {
                                        // 注意所有的文字尽量使用百分比进行大小限定，这样可以被设置所更改
                                        style: f(`font-size: 200%`)
                                    }
                                })
                            ],
                            {
                                props: {
                                    // 顶部样式
                                    style: f(`
                                        display: flex;
                                        flex-direction: row;
                                        align-items: center;
                                        justify-content: space-around;
                                        padding-bottom: 5%;
                                        border-bottom: dashed 1px #ddd8;
                                    `)
                                }
                            }),
                            // 然后是下面的部分，包括怪物的详细信息
                            // 首先是怪物的基础属性
                            div(
                                [
                                    // 使用列表渲染，对上面定义的怪物属性进行渲染
                                    vfor(status, ([key, name, color]) => {
                                        return MComponent.vNodeS(
                                            div([
                                                // 怪物属性名称，右对齐
                                                span(text(name), statusSpanStyle),
                                                span(text(format(enemy.value.enemy.info[key])))
                                            ], statusStyle)
                                        );
                                    }),
                                    // 然后是伤害、临界
                                    div([
                                        span(text('伤害'), statusSpanStyle),
                                        span(text(format(enemy.value.damage)))
                                    ], statusStyle),
                                    div([
                                        span(text('临界'), statusSpanStyle),
                                        span(text(format(enemy.value.critical)))
                                    ], statusStyle),
                                    div([
                                        span(text('临界减伤'), statusSpanStyle),
                                        span(text(format(enemy.value.criticalDam)))
                                    ], statusStyle),
                                    div([
                                        span(text(core.status.thisMap.ratio + '防'), statusSpanStyle),
                                        span(text(format(enemy.value.defDam)))
                                    ], statusStyle),
                                    // 下面是特殊属性，依然要用列表渲染
                                    vfor(enemy.value.showSpecial, ([name, desc, color]) => {
                                        return MComponent.vNodeS(div(
                                            span(text(name), { props: { styles: f(`color: ${color}`) } }),
                                            span(text(': ')),
                                            span(text(desc))
                                        ));
                                    })
                                ],
                                {
                                    props: {
                                        style: f(`
                                            display: flex;
                                            flex-direction: column;
                                            width: 100%;
                                        `)
                                    }
                                }
                            )
                        ]);
                    }
                }
            });
        ]);
    }
})
    // 由 UI 系统直接打开的 UI 都需要包含这两个参数
    .defineProps({
        num: Number,
        ui: GameUi
    })
    .export();

// 注册 UI
mainUi.register(new GameUi('myBook', myBook));
```
