# 类 IndexedEventEmitter

渲染进程、游戏进程通用类，继承自 [`EventEmitter`](./event-emitter.md)

-   示例方法
    -   [`onIndex`](#onindex)
    -   [`onceIndex`](#onceindex)
    -   [`offIndex`](#offindex)

## onIndex()

```ts
function onIndex(
    event: string,
    symbol: string | number | symbol,
    fn: (...params: any) => any,
    options?: Partial<ListenerOptions>
): void
```

-   参数说明

    -   `event`: 要监听的事件名称
    -   `symbol`: 监听函数的标识符
    -   `fn`: 监听函数，在事件被触发时执行
    -   `options`: 监听配置，见[`EventEmitter`](./event-emitter.md#on)

-   方法说明

    监听一个事件，同时为监听函数分配标识符，用于取消监听

## onceIndex()

```ts
function onceIndex(
    event: string,
    symbol: string | number | symbol,
    fn: (...params: any) => any
): void
```

-   方法说明

    等价于`on(event, symbol, fn, { once: true })`

## offIndex()

```ts
function offIndex(event: string, symbol: string | number | symbol): void
```

-   参数说明

    -   `event`: 要取消监听的事件
    -   `symbol`: 监听函数的标识符

-   方法说明

    根据监听函数的标识符取消监听
