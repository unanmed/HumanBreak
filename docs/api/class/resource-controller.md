# 抽象类 ReousrceController

渲染进程类，游戏进程不能直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例成员
    -   [`list`](#list)
-   实例方法
    -   [`abstract add`](#abstract-add)
    -   [`remove`](#remove)
-   实例事件
    -   [`add`](#add-事件)
    -   [`remove`](#remove-事件)

## list

```ts
declare var list: Record<string, any>
```

-   成员说明

    存储了每个资源的信息，键为资源的 uri，值为资源的数据

## abstract add()

```ts
declare function add(uri: string, data: any): void
```

-   参数说明

    -   `uri`: 资源的唯一标识符（Unique Resource Identifier）
    -   `data`: 资源数据

-   方法说明

    添加一个资源

## remove()

```ts
declare function remove(uri: string): void
```

-   方法说明

    根据 uri 删除一个资源

## add 事件

```ts
interface ResourceControllerEvent {
    add: (uri: string, data: D) => void
}
```

## remove 事件

```ts
interface ResourceControllerEvent {
    delete: (uri: string, content: T) => void
}
```
