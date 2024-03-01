# 设置系统

新样板创建了一种新的设置系统，它允许你自定义设置列表，以及设置的编辑组件，它是 `MotaSetting` 类。

:::warning
系统自带的设置在系统设置物品内
:::

## 注册设置

想要添加你自己的设置，就需要注册一个设置。对于新样板的设置，全部在 `mainSetting` 变量里面，然后调用 `register` 函数即可注册：

```ts
function register(
    key: string,
    name: string,
    value: number | boolean | MotaSetting,
    com?: SettingComponent,
    step?: [min: number, max: number, step: number]
): this
```

参数说明：

-   `key`: 要注册的设置的 id，不能包含英文句号 `.`
-   `name`: 设置的显示名称
-   `value`: 设置的初始值
-   `com`: 设置的编辑组件，即打开 UI 设置界面后用户修改设置的值的组件
-   `step`: 数字型设置的步长信息，是一个数组，第一个元素表示最小值，第二个元素表示最大值，第三个元素表示设置步长

对于 `value` 参数，如果填入了一个新的 `MotaSetting` 实例，那么会被认为是级联设置，即子设置。例如：

```js
const { mainSetting } = Mota.requireAll('var');
const { MotaSetting } = Mota.requireAll('class');
const { createSettingComponent } = Mota.require('module', 'CustomComponents');

// 获取系统自带的设置编辑组件
const COM = createSettingComponent();

mainSetting
    .register('mySetting1', '设置1', false, COM.Boolean) // 添加一个布尔型设置
    .register('mySetting2', '设置2', 100, COM.Number, [0, 1000, 50]) // 添加一个数字型设置
    .register(
        'mySetting3',
        '级联设置1',
        new MotaSetting()
            .register('mySetting4', '设置4', true, COM.Boolean) // 在级联设置中添加一个布尔值设置
            .register(
                'mySetting5',
                '级联设置2',
                new MotaSetting() // 在级联设置中再加一个级联设置
                    .register('mySetting6', '设置6', 6, COM.Number, [0, 28, 1])
            )
    );
```

## 获取设置

使用 `getSetting` 和 `getValue` 函数可以通过类似于获取对象的值的方式获取设置及设置的值：

```ts
function getSetting(key: string): Readonly<any>
function getValue(key: string, defaultValue?: any): number | boolean
```

例如，对于上面我们注册的设置，可以通过这些方式获取：

```js
// 获取设置1
const setting1 = mainSetting.getSetting('mySetting1'); // 还可以读取这个设置的值，但是不建议修改
// 获取级联设置1
const setting3 = mainSetting.getSetting('mySetting3');
// 还可以继续对这个设置进行注册
setting3.value.register('mySetting7', '设置7', false, COM.Boolean);
// 获取级联设置中的设置，使用类似获取对象的值的方式进行获取，注意不能使用[]获取，只能使用点
const setting4 = mainSetting.getSetting('mySetting3.mySetting4');
// 获取二层级联设置中的设置
const setting5 = mainSetting.getSetting('mySetting3.mySetting5.mySetting6');
```

```js
// 获取设置1的值
const value1 = mainSetting.getValue('mySetting1');
// 获取设置2的值，同时标有默认值，即假如这个设置不存在，那么就会返回默认值
const value2 = mainSetting.getValue('mySetting2', 100);
// 获取级联设置中的值
const value4 = mainSetting.getValue('mySetting3.mySetting4'. true);
// 注意，如果获取到的是另一个设置实例（MotaSetting），那么会返回 undefined，或者是默认值
const value3 = mainSetting.getValue('mySetting3', true); // 最后会返回 true
```

::: tip
`getSetting` 函数的第一个参数是从当前级开始获取设置，如果从级联设置中获取其子设置，直接填写子设置的名称即可，不需要填写完整的名称，例如：

```js
const setting3 = mainSetting.getSetting('mySetting3').value;
const setting4 = setting3.getSetting('mySetting4');
```

:::

## 修改设置

一般我们不提倡在无关场景修改设置的值，因为这可能会违背玩家的意愿，但样板还是提供了修改设置的值的 api：

```ts
function setValue(key: string, value: number | boolean): void
function addValue(key: string, value: number): void
```

前者用于直接设置一个设置的值，后者用于增加或减少一个数字型设置的值

## 初始化设置

对于设置，我们不仅可以注册与游戏逻辑（录像）无关的，还可以注册与之有关的。对于无关的，可以在游戏加载时进行初始化，对于后者，可以在每次读档后进行初始化。但是值得注意的是，设置是一个渲染进程类，你不能直接用于游戏进程，如果想做出与录像有关的设置，需要 `flags`，以及对应的录像处理。

我们可以通过 `reset` 函数对设置进行初始化：

```ts
function reset(setting: Record<string, number | boolean>): void
```

例如，对于上面我们注册的设置，可以这么初始化：

```js
mainSetting.reset({
    'mySetting1': false,
    'mySetting2': 100,
    'mySetting3.mySetting4': true,
    'mySetting3.mySetting5.mySetting6': 6
});
```

初始化设置一般会与游戏存储系统共同使用，参考[存储系统](./storage.md#与设置系统共用)

:::tip
建议新增一个插件，并在插件的顶层中（即插件最外层函数中）经过渲染进程包裹进行初始化
:::

## 设置说明

可以通过 `setDescription`设置一个设置的说明文字：

```ts
function setDescription(key: string, desc: string): this
```

```js
mainSetting
    .setDescription('mySetting1', `这是我注册的第一个设置！`) // 直接传入字符串即可
    .setDescription('mySetting2', `可以通过<br />换行`) // 换行符是html的 <br> 标签，<br> <br />都可以换行
    .setDescription('mySetting3.mySetting4', `
使用\n换行不会有效果。还可以使用html语法<span style="color: red">设置样式</span>
`) // 说明内容完全兼容 html 语法
```

## 样板内置设置

样板目前共有以下这些内置设置：

-   `screen`:
    -   `screen.fullscreen`: 是否全屏
    -   `screen.itemDetail`: 血瓶宝石显伤
    -   `screen.transition`: 是否启用 UI 开启与关闭动画
    -   `screen.antiAlias`: 抗锯齿
    -   `screen.fontSize`: 字体大小
    -   `screen.smoothView`: 大地图平滑移动镜头
    -   `screen.criticalGem`: 临界是否显示为宝石数
    -   `screen.keyScale`: 虚拟键盘缩放
-   `action`:
    -   `action.fixed`: 是否开启定点查看
    -   `action.hotkey`: 快捷键
    -   `action.toolbar`: 自定义工具栏
-   `audio`:
    -   `audio.bgmEnabled`: 是否开启背景音乐
    -   `audio.bgmVolume`: 背景音乐音量
    -   `audio.soundEnabled`: 是否开启音效
    -   `audio.soundVolume`: 音效音量
-   `utils`:
    -   `utils.autoScale`: 自动放缩
-   `fx`:
    -   `fx.frag`: 打怪特效
-   `ui`:
    -   `ui.mapScale`: 小地图楼传缩放

如果你想要在样板内置设置中新增，需要先通过 `mainSetting.getSetting` 获取到对应的级联配置，然后注册。

## 设置显示函数

如果你打开过样板的系统设置，并进入显示设置中看过，会发现临界显示一项的值会显示为 `宝石数` 或者 `攻击`，这个功能便是由设置显示函数完成的：

```ts
function setDisplayFunc(key: string, func: (value: number | boolean) => string): this
```

这个函数可以设置在显示的时候，显示什么内容，它的第二个参数即是显示函数，接受当前设置的值，输出一个字符串。例如，对于上面注册的设置，可以这么设置显示函数：

```js
mainSetting
    .setDisplayFunc('mySetting1', value => value ? '宝石数' : '攻击')
    .setDisplayFunc('mySetting2', value => `${value}%`)
```

## 创建你自己的编辑组件

设置的编辑组件实际上只是一种特殊的组件，它接收下面三个参数（`props`）

-   `item`: 这个设置的信息，一般只会用到 `value`，也就是这个设置的值，其他信息请参考[API 列表](../api/class.md)
-   `setting`: 根级设置实例，例如对于上面注册的设置，就是 `mainSetting`，而不是其任意一级的级联设置
-   `displayer`: 设置渲染控制器，一般情况下，当设置完值后，调用 `displayer.update` 即可

借助这三个参数，我们可以做出自己的编辑组件了。组件可以直接就是一个函数，函数接受 `props` 作为参数，返回 `VNode`，也可以是一个导出组件。考虑到函数式组件的方便性，我们更推荐使用函数式组件。如果使用导出组件，请注意要定义参数。

```js
const { MComponent } = Mota.require('class');
const { text, h } = Mota.require('module', 'MCGenerator');

// 这里以布尔值的编辑组件为例
function MySettingComponent(props) {
    const { setting, displayer, item } = props;
    const changeValue = () => {
        // 可以在这里写出你自己对设置的处理

        // 设置值，基本上是模式化的写法
        setting.setValue(displayer.selectStack.join('.'), !item.value);
        displayer.update();
    };

    // 返回 VNode，因此要经过 vNode 包裹，使用 vNodeS 也可以
    return MComponent.vNode([
        // 渲染一个按钮上去，使用 html 的 button 标签
        h('button', [text('修改设置')], {
            props: {
                // 当点击这个按钮时，将设置取反并设置
                onClick: () => changeValue()
            }
        })
    ]);
}

// 之后便可以在你注册的设置里面使用这个组件了，第四个参数传入组件即可
mainSetting.register('mySetting', '设置', true, MySettingComponent);
```

## 样板内置编辑组件

以下的 `COM` 指的是函数 `createSettingComponent` 的返回值，即[注册设置](#注册设置)中获取的系统自带设置编辑组件

-   `COM.Default`: 默认编辑组件，不会显示任何内容
-   `COM.Boolean`: 布尔值组件，拥有一个按钮来修改设置
-   `COM.Number`: 数字型设置组件，拥有一个输入框和两个按钮，输入框内也包含递增和递减按钮
-   `COM.Radio(items: string[])`:

    单选列表，在使用时调用并传入单选列表的名称即可，例如：

    ```js
    mainSetting.register('mySetting', '设置', COM.Radio(['第一个选项', '第二个选项']));
    ```

    注意这个组件是为数字型设置所用的，选择 `第一个选项` 时，这个设置的值就是 0，以此类推。

-   `COM.HotkeySetting`: 专为快捷键所用的设置组件
-   `COM.ToolbarEditor`: 专为自定义工具栏所用的组件

## 监听设置的修改事件

如果我们想要在一个设置被修改时执行一些代码，可以监听设置的修改事件，也就是 `valueChange` 事件：

```js
mainSetting.on('valueChange', (key, newValue, oldValue) => {
    // 这里的 key 表示被修改的设置的名称，newValue 表示的是设置为的值，oldValue 表示的是之前的值
    // 可以使用一个 switch 语句进行判断
    switch (key) {
        // 当设置名称为 mySetting1 时
        case 'mySetting1': {
            // 做一些处理，例如可以在控制台打印新值
            console.log(newValue);
            break;
        }
        case 'mySetting2.mySetting3': {
            // 对于级联设置也是如此
            break;
        }
    }
})
```

## 创建自己的设置

到目前为止，我们都是在样板默认的设置 `mainSetting` 上进行的。但这个设置系统能力不止如此，你还可以创建自己的设置，并通过设置 UI 显示出来。我们可以直接创建一个设置实例：

```js
const { MotaSetting } = Mota.requireAll('class');

// 创建你自己的设置
const mySetting = new MotaSetting()
    .register('mySetting1', '设置1', true, COM.Boolean)
    .register('mySetting2', '设置2', 10, COM.Number, [0, 100, 10])
```

然后，我们可以直接将这个设置作为参数传递给设置 UI，让它来渲染：

```js
const { mainUi } = Mota.requireAll('var');

// 这样，你就可以将你自己的设置显示出来了！
mainUi.open('settings', { info: mySetting });
```

## 创建自己的设置 UI

除此之外，样板还提供了能够用于创建自己的设置 UI 的 API，它是类 `SettingDisplayer`，你可以为你自己的 UI 创建一个其实例，从而辅助你去创建自己的显示 UI。

创建实例时，要求传入设置作为参数。你可以通过 `add` 来选择一个设置，通过 `cut` 来截断一个设置，最终呈现出来的选择栈会存储在属性 `selectStack` 中，要渲染的信息会存储在属性 `displayInfo` 中。当一个设置被更改时，可以通过 `update` 函数来刷新显示。这样，我们就可以写出自己的设置 UI 了。对于这些内容的详细说明，请参考[API 列表](../api/class.md)。下面是一个极度简易的设置 UI 示例，其中省略了非常多的部分。

```js
const { MotaSetting, SettingDisplayer, MComponent } = Mota.requireAll('class');
const { m } = Mota.requireAll('fn');
const { div, vfor, span, text, com, f } = Mota.require('module', 'MCGenerator');

const mySettingUI = m()
    .defineProps({
        info: MotaSetting
    })
    .setup((props, ctx) => {
        const displayer = new SettingDisplayer(props.info);

        const selected = computed(() => displayer.displayInfo.at(-1)?.item)

        // ... 选择设置等内容省略

        return () => {
            return MComponent.vNode([
                // 渲染每一级的级联设置
                vfor(displayer.displayInfo, (value) => {
                    return MComponent.vNodes(div([
                        // 每一级的级联设置中，渲染这个级联设置的内容
                        vfor(Object.entries(value.list), ([key, item]) => {
                            return MComponent.vNodeS(div(text(item.name)));
                        })
                    ]));
                }),
                // 渲染设置的信息
                div(selected.value ? [
                    // 设置说明
                    span(text(display.at(-1)?.text)),
                    // 设置编辑组件，使用动态组件
                    com(selected.value.controller, {
                        // 传入所需的三个参数
                        props: {
                            item: f(selected.value),
                            displayer: f(displayer),
                            setting: f(props.info)
                        }
                    })
                ] : [])
            ]);
        }
    })
    .export();
```
