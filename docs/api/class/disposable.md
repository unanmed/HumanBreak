# 类 Disposable

渲染进程、游戏进程通用类，继承自 [`EventEmitter`](./event-emitter.md)

-   实例成员
    -   [`protected _data`](#protected-_data)
    -   [`protected activated`](#protected-activated)
    -   [`protected destroyed`](#protected-destroyed)
    -   [`set get data`](#set-get-data)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`active`](#active)
    -   [`dispose`](#dispose)
    -   [`destroy`](#destroy)
-   实例事件
    -   [`active`](#active-事件)
    -   [`dispose`](#dispose-事件)
    -   [`destroy`](#destroy-事件)

## protected \_data

```ts
declare var _data: any | undefined
```

## protected activated

```ts
declare var activated: boolean
```

-   成员说明

    表示该变量是否被激活

## protected destroyed

```ts
declare var destroyed: boolean
```

-   成员说明

    表示该变量是否已经被摧毁，摧毁后不可再调用

## set get data

```ts
interface Disposable {
    set data(value: any | null): void
    get data(): any | null
}
```

-   成员说明

    用于设置和获取变量的值，被摧毁后不可设置或者获取，被失效后可以设置，但获取会返回 `null`

## constructor()

```ts
interface Disposable {
    new(data: any): Disposable
}
```

-   构造器说明

    传入数据，返回 `Disposable` 实例，构造后变量处于失效状态

## active()

```ts
declare function active(): void
```

-   方法说明

    激活变量

## dispose()

```ts
declare function dispose(): void
```

-   方法说明

    使变量失效，失效后获取变量会返回 `null`

## destroy()

```ts
declare function destroy(): void
```

-   方法说明

    摧毁变量，摧毁后不可设置或获取变量

## active 事件

```ts
interface DisposableEvent {
    active: (value: any) => void
}
```

-   事件说明

    当变量被激活时触发，参数表示变量的值

## dispose 事件

```ts
interface DisposableEvent {
    dispose: (value: any) => void
}
```

-   事件说明

    当变量失效时触发，参数表示变量的值

## destroy 事件

```ts
interface DisposableEvent {
    destroy: () => void
}
```

-   事件说明

    当变量被摧毁时触发
