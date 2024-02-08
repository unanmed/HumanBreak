# 按键系统

新样板提供了一个新的按键系统，允许你注册自己的按键，同时可以让玩家修改按键映射。

## 注册按键

一般情况下，我们建议直接将按键注册在游戏主按键变量 `gameKey` 上。注册按键使用 `register` 函数：

```ts
function register(data: RegisterHotkeyData): this
```

参数表明的是注册信息，一般我们会填写下列信息：

-   `id`: 按键 id
-   `name`: 按键的显示名称
-   `defaults`: 默认按键

对于按键，我们使用变量 `KeyCode` 来获取，它来自库 `monaco-editor`，也就是 VSCode 使用的编辑器。

```js
const { KeyCode, gameKey } = Mota.requireAll('var');

gameKey
    .register({
        id: 'myKey1', // 按键 id
        name: '按键1', // 按键显示名称
        defaults: KeyCode.KeyL // 默认 L 键触发
    })
    .register({
        id: 'myKey2',
        name: '按键2',
        defaults: KeyCode.Enter // 默认回车键触发
    })
```

## 同 id 按键

很多时候我们需要让多个按键触发同一个功能，例如样板里面的 `A` 和 `5`，都是读取自动存档按键，这时，我们可以给按键的 id 加上一个以下划线开头，后面紧跟数字的后缀，即可实现多个按键触发同一个功能：

```js
gameKey
    .register({
        id: 'myKey3_1',
        name: '按键_1', // 名称没有后缀也可以
        defaults: KeyCode.Digit1
    })
    .register({
        id: 'myKey3_2', // 后缀必须是全数字，不能包含其他字符
        name: '按键_2',
        defaults: KeyCode.KeyA
    })
```

## 实现按键功能

### 分配作用域

一般情况下，我们不希望一个按键在任何时刻都有作用。例如，当我们打开怪物手册时，必然不想让读取自动存档的按键起作用。这时，如果我们要实现按键功能，首先要为它分配作用域：

```ts
function use(symbol: symbol): this
```

其中的 `symbol` 表示的即是作用域的标识符，是一个 `symbol` 类型的变量。

```js
const myScope = Symbol(); // 创建 symbol

gameKey.use(myScope); // 使用 myScope 作为作用域
```

### 实现功能

接下来，我们可以使用 `realize` 函数来实现按键的功能了：

```ts
function realize(id: string, func: HotkeyFunc): this
```

其中 `id` 表示的是要实现的按键的 id，对于同 id 按键，不填数字后缀表示实现所有按键，填写数字后缀表示只实现那一个按键。第二个参数 `func` 表示的便是按键被触发时执行的函数了。

```js
gameKey
    .use(myScope) // 实现按键前要先分配作用域，除非你的按键是类似于怪物手册按键一样，在没有任何 UI 打开时触发
    .realize('myKey1', () => {
        // 按键被触发时执行这个函数，在控制台打印内容
        console.log('myKey1 emitted!');
    })
    // 触发函数还可以接受三个参数
    .realize('myKey2', (id, code, ev) => {
        // id: 包含数字后缀的按键id，可以依此来区分不同后缀的按键
        // code: 按键触发的 KeyCode，例如可能是 KeyCode.Enter
        // ev: 按键触发时的 KeyboardEvent
        console.log(id, code, ev);
    })
    .realize('myKey3', (id) => {
        // 对于同 id 按键，实现功能时不需要填写后缀
        console.log(id); // 输出 id，包含数字后缀
    })
```

### 释放作用域

在大部分情况下，按键都是用于 UI 的，每次打开 UI 的时候，我们为其分配一个新作用域，在关闭 UI 时，就必须把作用域释放，使用 `dispose` 函数：

```js
// 打开 UI 时
gameKey
    .use(myScope)
    // ... 实现代码

// 关闭 UI 时，也可以填写参数，表示将这个作用域之后的所有作用域都释放
gameKey.dispose();
```

::: tip
如果想要在任何 UI 都没有打开时实现按键，例如像打开怪物手册，或者是打开自己的 UI，直接在插件中经由渲染进程包裹注册及实现按键即可。
:::

## 按键分组

如果你打开样板的自定义按键的界面，会发现它会把按键分为 `ui界面` `功能按键` 等多个组别，这个功能是由按键分组实现的：

```ts
function group(id: string, name: string): this
```

这个函数调用后，在其之后注册的按键会被分类至 `id` 组，`name` 参数表示这个组的显示名称。

```js
gameKey
    .group('myGroup1', '分组1')
    // 这时注册的按键会被分类至 myGroup1 组
    .register({
        id: 'myKey4',
        name: '按键4',
        defaults: KeyCode.KeyA
    })
    .group('myGroup2', '分组2')
    // z这时注册的按键会被分类至 myGroup2 组
    .register({
        id: 'myKey5',
        name: '按键5',
        defaults: KeyCode.KeyB
    });
```

## 按键控制

你可以通过 `when` `enable` `disable` 三个函数来控制按键什么时候有效：

```js
gameKey
    .use(myScope)
    .when(() => Math.random() > 0.5) // 在当前作用域下，满足条件时按键才有效
    .disable() // 全面禁止按键操作，不单单是当前作用域
    .enable(); // 全面启用按键操作
```

## 样板内置按键

下面是样板内置的按键及分组，你可以通过 `realize` 函数覆盖其功能

-   `ui` 组（ui 界面）
    -   `book`: 怪物手册
    -   `save`: 存档界面
    -   `load`: 读档界面
    -   `toolbox`: 道具栏
    -   `equipbox`: 装备栏
    -   `fly`: 楼层传送
    -   `menu`: 菜单
    -   `replay`: 录像回放
    -   `shop`: 全局商店
    -   `statictics`: 统计信息
    -   `viewMap_1` / `viewMap_2`: 浏览地图
-   `function` 组（功能按键）
    -   `undo_1` / `undo_2`: 回退（读取自动存档）
    -   `redo_1` / `redo_2`: 恢复（撤销读取自动存档）
    -   `turn`: 勇士转向
    -   `getNext_1` / `getNext_2`: 轻按
    -   `num1`: 破墙镐
    -   `num2`: 炸弹
    -   `num3`: 飞行器
    -   `num4`: 其他道具
    -   `mark`: 标记怪物
    -   `special`: 鼠标位置怪物属性
    -   `critical`: 鼠标位置怪物临界
    -   `quickEquip_1` / `quickEquip_2` / ... / `quickEquip_9` / `quickEquip_0`: 快捷换装（暂未实现）
-   `system` 组（系统按键）
    -   `restart`: 回到开始界面
    -   `comment`: 评论区
-   `general` 组（通用按键）
    -   `exit_1` / `exit_2`: 退出 ui 界面
    -   `confirm_1` / `confirm_2` / `confirm_3`: 确认
-   `@ui_book` 组（怪物手册）
    -   `@book_up`: 上移光标
    -   `@book_down`: 下移光标
    -   `@book_pageDown_1` / `@book_pageDown_2`: 下移 5 个怪物
    -   `@book_pageUp_1` / `@book_pageUp_2`: 上移 5 个怪物
-   `@ui_toolbox` 组（道具栏）
    -   `@toolbox_right`: 光标右移
    -   `@toolbox_left`: 光标左移
    -   `@toolbox_up`: 光标上移
    -   `@toolbox_down`: 光标下移
-   `@ui_shop` 组（商店）
    -   `@shop_up`: 上移光标
    -   `@shop_down`: 下移光标
    -   `@shop_add`: 增加购买量
    -   `@shop_min`: 减少购买量
-   `@ui_fly` 组（楼层传送）
    -   `@fly_left`: 左移地图
    -   `@fly_right`: 右移地图
    -   `@fly_up`: 上移地图
    -   `@fly_down`: 下移地图
    -   `@fly_last`: 上一张地图
    -   `@fly_next`: 下一张地图
-   `@ui_fly_tradition` 组（楼层传送-传统按键）
    -   `@fly_down_t`: 上一张地图
    -   `@fly_up_t`: 下一张地图
    -   `@fly_left_t_1` / `@fly_left_t_2`: 前 10 张地图
    -   `@fly_right_t_1` / `@fly_right_t_2`: 后 10 张地图

## 默认辅助按键

你可以在注册的时候为按键添加辅助按键 `ctrl` `alt` `shift`:

```js
// 注册一个要按下 Ctrl + Shift + Alt + X 才能触发的按键！
gameKey.register({
    id: 'myKey',
    name: '按键',
    defaults: KeyCode.KeyX,
    ctrl: true,
    shift: true,
    alt: true
});
```
