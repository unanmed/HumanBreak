# UI 系统

相比于[上一页](./ui.md)，本页主要注重于 UI 控制系统的说明，通过了解控制系统，你可以让你的 UI 以你想要的方式展现出来。

## mainUi 与 fixedUi

样板一个提供了两种类型的 UI 控制器，分别是 `mainUi` `fixedUi`，它们两个都能控制 UI 的显示，但是显示方式有所不同。

对于 `mainUi`，它主要注重于主要 UI 的显示，使用它所显示的 UI 会有明显的嵌套关系。例如，从怪物手册中打开怪物详细信息界面，从设置中打开快捷键设置界面等，这些都是由父 UI 又打开了一个子 UI，有嵌套关系。而同时，如果关闭了一个 UI，那么它的所有子级 UI 也会一并被关闭。

而对于 `fixedUi`，它所显示的 UI 不再拥有嵌套关系，所有 UI 的关系都是平等的，都会一并显示，关闭 UI 时也只会关闭当前 UI，不会关闭其他 UI。例如像状态栏、自定义工具栏、标记怪物等 UI 就是基于 `fixedUi` 的。

这两个 UI 都是 UI 控制器类 `UiController` 的实例。

下面我们来说明一下显示与控制 UI 的流程。

## 注册 UI

想要让 UI 控制器知道你想打开哪个 UI，首先就要注册 UI，使用 `register` 函数：

```ts
function register(...list: GameUi[]): void
```

注册的 UI 要求是一个 `GameUi` 实例，可以通过 `new` 来创建：

```ts
interface GameUi {
    new(id: string, ui: Component): GameUi
}
```

这里的 `id` 指这个 UI 的名称，`ui` 表示这个 UI 的内容，需要是一个导出组件，或者是函数式组件（参考 Vue 官方文档的渲染函数页面）。注册 UI 是一个模式化的方式，一般直接照葫芦画瓢即可：

```js
const { mainUi, fixedUi } = Mota.requireAll('var');
const { m } = Mota.requireAll('fn');
const { GameUi } = Mota.requireAll('class');

const myUI = m().export();
const myUI2 = m().export();

// 注册 UI
mainUi.register(new GameUi('myUI', myUI));
// 或者一次性注册多个
mainUi.register(
    new GameUi('myUI', myUI),
    new GameUi('myUI2', myUI2)
);
```

## 打开与关闭 UI

可以使用 `open` 函数来打开一个 UI：

```ts
function open(ui: string, vBind?: any, vOn?: any): number
```

其中 `ui` 参数表示要打开的 UI，后面两个参数请参考[传递参数与监听](#传递参数与监听)。该函数会返回一个数字，表示被打开的 UI 的唯一标识符，注意每次打开 UI 都会生成一个新的标识符，即使打开的 UI 是同一个 UI。

```js
// 打开刚刚注册的 UI
const num = mainUi.open('myUI');
```

如果想要关闭 UI，可以使用下面这两个函数：

```ts
function close(num: number): void
function closeByName(name: string): void
```

前者是根据 UI 的标识符关闭 UI，后者是根据 UI 名称关闭 UI，对于后者，会将所有名称匹配的 UI 都关闭，如果是 `mainUi` 上，第一个匹配的 UI 之后的所有 UI 也会全部关闭。

```js
mainUi.close(num);
mainUi.closeByName('myUI');
```

## 传递参数与监听

与在 UI 编写页面中传递参数与监听事件类似，打开 UI 的时候也可以传递参数或监听事件，通过 `open` 函数的后两个参数实现。

-   `vBind`参数：向 UI 传递参数
-   `vOn`参数：监听 UI 的 `emits`

这两个参数都要求传入一个对象，对于 `vBind`，键表示参数（`props`）名称，值表示其值，与 UI 编写不同的是不再需要传入函数。而对于 `vOn`，键表示名称，不再包含 `on` 作为前缀，直接填写 `emits` 的名称即可，值是一个函数，表示事件触发时执行的内容。

对于 `vBind`，一定会包括下面两个参数:

-   `num`: 本次打开的 UI 的标识符
-   `ui`: UI 实例，类型是 `GameUi`

```js
const myUI = m()
    .defineProps({
        id: String,
        // 直接由 UI 控制系统打开的 UI 必须拥有这两个参数
        num: Number,
        ui: GameUi
    })
    .defineEmits(['myEmits'])
    .export();
// ...此处省略注册
mainUi.open(
    'myUi',
    {
        id: 'redSlime' // 传入 id 参数，值为 'redSlime'，直接是值即可，不需要是函数
    },
    {
        // 监听 myEmits 事件，触发时在控制台打印 'emitted!'
        myEmits: () => {
            console.log('emitted!');
        }
    }
)
```

## 显示方式

对于 `mainUi`，有两种显示方式，分别是全部显示与仅显示最后一个 UI，可以通过下面两个函数设置：

```ts
function showAll(): void
function showEnd(): void
```

其中前者是设置为全部显示，后者是只显示最后一个。在大部分时刻，`mainUi` 都是处于全部显示的状态。

```js
mainUi.showAll();
mainUi.open('myUI');
mainUi.open('myUI2'); // 此时 myUI 与 myUI2 都会显示

mainUi.showEnd(); // 此时只会显示 myUI2，因为它是最后一个打开的
```

## 防闪烁处理

如果你把所有 UI 全部关闭，然后立刻打开一个新的 UI，会出现闪烁现象，观感很差，于是样板提供了下面这个函数用于防闪烁处理：

```ts
function holdOn(): { end(): void }
```

它的作用是暂时维持下一次 UI 全部关闭时不会引起闪烁现象，之后便失效（注意只会触发一次）。该功能的原理是在调用后，如果 UI 全部关闭，那么维持 UI 根组件不会关闭，从而防止了闪烁现象。如果调用之后一直没有新的 UI 打开，那么会引起一直处于 UI 根组件打开状态，导致 UI 假死，请注意避免这种情况。

对于返回值，它是一个对象，包含一个 `end` 方法，调用后可以立刻关闭 UI，即结束这一次的维持。

```js
const num = mainUi.open('myUI');

// 防闪烁
const { end } = mainUi.holdOn();
mainUi.close(num);
// 这时 UI 整体不会被关闭，除非调用 end，或者打开新的 UI
mainUi.open('myUI2');
// 此时防闪烁功能便会失效
```

## 高级用法

### 获取 GameUi 实例

可以使用 `get` 函数获取已经注册的 `GameUi` 实例：

```ts
function get(id: string): GameUi
```

例如，我们注册了 `myUI` 这个 UI，可以这样获取：

```js
const myUI = mainUi.get('myUI');
```

### 事件监听

`GameUi` 和 `UiController` 都继承自 `EventEmitter`（详见[事件触发系统](./event-emitter.md)）。

对于 `GameUi`，它有下列事件可以被监听：

-   `open()`: 这个 UI 被打开时触发，无参数
-   `close()`: 这个 UI 被关闭时触发，无参数

对于 `UiController`，它有下列事件可以被监听：

-   `focus(before, after)`: 当 UI 被聚焦时触发，`before` 参数表示之前聚焦的内容，也可能不存在被聚焦的内容，会是 `null`，`after` 参数表示聚焦至哪一个 UI。该事件会在 `mainUi.focusByNum` 或者 `mainUi.focus` 函数执行后触发，这两个函数在样板中没有调用案例，如果需要可以自行调用。该事件继承自类 [`Focus`](../api/class.md#Focus) 的事件。
-   `unfocus(before)`: 取消任何聚焦时触发，与 `focus` 事件类似。该事件继承自类 [`Focus`](../api/class.md#Focus) 的事件。
-   `add(item)`: 打开新 UI 时触发，参数是打开的 UI，是 `GameUi` 实例。该事件继承自类 [`Focus`](../api/class.md#Focus) 的事件。
-   `pop(item)`: 弹出最后一个 UI 时触发，参数是被弹出的 `GameUi` 实例。注意关闭 UI 不会触发此事件，因为关闭 UI 会使用 `splice` 而不是 `pop`。该事件继承自类 [`Focus`](../api/class.md#Focus) 的事件。
-   `splice(spliced)`: 当 UI 被截断（关闭）时触发，参数是被关闭的 UI 数组。该事件继承自类 [`Focus`](../api/class.md#Focus) 的事件。
-   `start()`: 当 UI 根组件被打开时触发。当 UI 控制器从没有任何 UI 变成有至少一个 UI 被显示时，也即当没有 UI 打开的情况下任何 UI 被打开时，会触发此事件。无参数。
-   `end()`: 当 UI 根组件被关闭时触发，即当所有 UI 都被关闭时触发。无参数。
