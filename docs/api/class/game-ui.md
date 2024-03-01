# 类 GameUi

渲染进程类，游戏进程不能直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例成员
    -   [`component`](#component)
    -   [`id`](#id)
    -   [`symbol`](#symbol)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`with`](#with)
-   静态成员
    -   [`uiList`](#uilist)
-   实例事件
    -   [`close`](#close-事件)
    -   [`open`](#open-事件)

## component

```ts
declare var component: Component
```

## id

```ts
declare var id: string
```

## symbol

```ts
declare var symbol: symbol
```

## constructor()

```ts
interface GameUi {
    new(id: string, component: Component): GameUi
}
```

-   参数说明
    -   `id`: UI 的名称，也就是 id
    -   `component`: UI 组件，一般是函数式组件或者导出组件

## with()

```ts
declare function with(vBind?: any, vOn?: any): ShowableGameUi
```

-   方法说明

    传入参数与监听事件，返回一个可显示 UI 对象

## uiList

```ts
declare var uiList: GameUi[]
```

-   静态成员说明

    包含了所有注册的 `GameUi` 实例

## close 事件

```ts
interface GameUiEvent {
    close: () => void
}
```

-   事件说明

    当这个 UI 被打开时触发该事件

## open 事件

```ts
interface GameUiEvent {
    open: () => void
}
```

-   事件说明

    当这个 UI 被关闭时触发该事件
