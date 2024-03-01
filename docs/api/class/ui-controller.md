# 类 UiController

渲染进程类，游戏进程无法直接使用，继承自 [`Focus`](./focus.md)

-   实例成员
    -   [`list`](#list)
    -   [`num`](#num)
    -   [`show`](#show)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`showEnd`](#showend)
    -   [`showAll`](#showall)
    -   [`get`](#get)
    -   [`holdOn`](#holdon)
    -   [`close`](#close)
    -   [`closeByName`](#closebyname)
    -   [`open`](#open)
    -   [`register`](#register)
    -   [`unregister`](#unregister)
    -   [`focusByNum`](#focusbynum)
    -   [`getByNum`](#getbynum)
    -   [`hasName`](#hasname)
-   静态成员
    -   [`list`](#static-list)
-   实例事件
    -   [`start`](#start-事件)
    -   [`end`](#end-事件)

## list

```ts
declare var list: Record<string, GameUi>
```

## num

```ts
declare var num: number
```

## show

```ts
declare var show: 'end' | 'all'
```

## constructor()

```ts
interface UiController {
    new(equal?: boolean): UiController
}
```

## showEnd()

```ts
declare function showEnd(): void
```

-   方法说明

    设置为只显示最后一个 ui

## showAll()

```ts
declare function showAll(): void
```

-   方法说明

    设置为显示所有 ui

## get()

```ts
declare function get(id: string): GameUi
```

-   方法说明

    通过 ui 的 id 获取到注册的 `GameUi` 实例

## holdOn()

```ts
declare function holdOn(): { end(): void }
```

-   方法说明

    暂时保持下一次 ui 关闭不会引起闪烁现象，参考[防闪烁处理](../../guide/ui-control.md#防闪烁处理)

-   返回值

    返回值是一个对象，包含一个 `end` 方法，用于结束此次的防闪烁处理，如果没有 ui 已经打开，那么会立刻关闭 ui 界面

## close()

```ts
declare function close(num: number): void
```

-   方法说明

    根据 ui 的唯一标识符关闭一个 ui，如果这个控制器是非平等控制器，那么会同时关闭之后的所有 ui

## closeByName()

```ts
declare function closeByName(id: string): void
```

-   方法说明

    根据 ui 的名称（id）关闭一个 ui，如果是非平等控制器，在第一个匹配的 ui 后的所有 ui 也会一同关闭

## open()

```ts
declare function open(id: string, vBind?: any, vOn?: any): number
```

-   参数说明

    -   `id`: 要打开的 ui 的名称（id）
    -   `vBind`: 要传递给 ui 的参数（props）
    -   `vOn`: 要监听 ui 的事件（emits）

-   方法说明

    打开一个指定的 ui，同时可以为其指定参数与监听的事件，返回打开的 ui 的唯一标识符

-   返回值

    打开的 ui 的唯一标识符，可以用来关闭这个 ui

## register()

```ts
declare function register(...ui: GameUi[]): void
```

-   方法说明

    注册若干个 ui，每个 ui 都是一个 `GameUi` 实例，对于同名（id 相同）的 ui，会直接覆盖

-   示例

    ```js
    myUi.register(new GameUi('ui1', ui1), new GameUi('ui2', ui2));
    ```

## unregister()

```ts
declare function unregister(...id: string[]): void
```

-   方法说明

    用于取消注册若干个 ui，传入 ui 的名称（id）作为参数

## focusByNum()

```ts
declare function focusByNum(num: number): void
```

-   方法说明

    根据 ui 的唯一标识符聚焦 ui

## getByNum()

```ts
declare function getByNum(num: number): IndexedGameUi | undefined
```

## hasName()

```ts
declare function hasName(id: string): boolean
```

-   方法说明

    根据 ui 的名称（id）判断一个 ui 是否被开启

## static list

```ts
declare var list: UiController[]
```

-   静态成员说明

    描述了所有被创建过的 ui 控制器实例

## start 事件

```ts
interface UiControllerEvent {
    start: () => void
}
```

-   事件说明

    当 ui 界面被打开，也就是当被打开的 ui 个数从 0 变为 1 时，触发该事件

## end 事件

```ts
interface UiControllerEvent {
    end: () => void
}
```

-   事件说明

    当 ui 界面被关闭，也就是当被打开的 ui 个数从 1 变为 0 时，触发该事件。如果当前处于防闪烁状态，那么不会触发
