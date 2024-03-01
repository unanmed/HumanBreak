# 类 EventEmitter

渲染进程、游戏进程通用类

-   实例成员
    -   [`protected events`](#protected-events)
    -   [`protected emitter`](#protected-emitter)
-   实例方法
    -   [`on`](#on)
    -   [`off`](#off)
    -   [`once`](#once)
    -   [`emit`](#emit)
    -   [`setEmitter`](#setemitter)
    -   [`removeAllListeners`](#removealllisteners)

## protected events

```ts
declare var events: Record<string, Listener>
```

-   成员说明

    该成员描述了所有注册的被注册的监听事件，键表示事件名称，值表示监听信息

-   `Lienster` 类型

    该类型描述了一个监听事件，包含下列属性：

    -   `fn`: 监听函数
    -   `once`: 是否配置为 `once` 模式，即触发一次后自动删除
    -   `immediate`: 是否配置为 `immediate` 模式，即注册时立刻触发一次

## protected emitter

```ts
declare var emitter: Record<string, EmitFn>
```

-   成员说明

    该成员描述了所有的自定义触发器，键表示事件名称，值表示触发器函数

-   `EmitFn` 类型

    该类型是一个函数

    ```ts
    type EmitFn = (event: string, ...params: any[]) => any
    ```

    -   参数说明

        -   `event`: 触发的事件类型
        -   `params`: 传递给监听函数的参数

    -   返回值：`emit` 方法的返回值是该函数的返回值组成的数组

## on()

```ts
function on(
    event: string,
    fn: (...params: any) => any,
    options?: Partial<ListenerOptions>
): void
```

-   参数说明

    -   `event`: 要监听的事件
    -   `fn`: 事件触发时执行的函数
    -   `options`: 事件监听配置，配置内容包含：
        -   `once`: 是否在触发一次后自动删除
        -   `immediate`: 是否在监听时立刻触发一次，不传入任何参数

-   方法说明

    该方法用于监听事件，当事件被触发时，所有的监听函数都会被执行一次，同时传入相应的参数。

-   示例

    ```js
    const { EventEmitter } = Mota.requireAll('class');

    const myEmitter = new EventEmitter();
    myEmitter.on('event', () => console.log('event emitted!'));
    ```

## off()

```ts
function off(event: string, fn: (...params: any) => any): void
```

-   参数说明

    -   `event`: 要取消监听的事件
    -   `fn`: 要取消监听的函数，要求传入函数的引用

-   方法说明

    该方法用于取消监听一个事件，传入想要取消监听的函数的引用即可

-   示例

    ```js
    const fn = () => console.log('event emitted!');

    myEmitter.on('event', fn);
    myEmitter.off('event', fn); // 取消监听
    ```

## once()

```ts
function once(event: string, fn: (...params: any) => any): void
```

-   方法说明

    等价于 `on(event, fn, { once: true })`，传入的函数在触发一次后立刻删除

-   示例

    ```js
    myEmitter.once('event', () => console.log('only emit once!'));
    ```

## emit()

```ts
function emit(event: string, ...params: any[]): any[]
```

-   参数说明

    -   `event`: 要触发的事件名称
    -   `params`: 传递给事件的参数

-   返回值

    所有触发的监听函数的返回值组成的数组

-   方法说明

    用于触发一个类型的事件，执行某个事件所有监听器函数，并传入对应的参数

## setEmitter()

```ts
function setEmitter(
    event: string,
    fn: (event: Listener[], ...params: any) => any
): void
```

-   参数说明

    -   `event`: 要设置触发器函数的事件
    -   `fn`: 触发器函数，接受事件内容，以及 `emit` 函数传入的参数作为参数，返回任意类型的值，作为 `emit` 函数的返回值

-   方法说明

    用于设置一个事件在触发时执行的函数，将返回值组成数组作为 `emit` 函数的返回值

-   示例

    以下是一个监听函数的返回值是 `Promise`，同时对其解包的示例

    ```js
    myEmitter.setEmitter('event', async (event, ...params) => {
        const res = await Promise.all(event.map(v => v.fn()));
        return res;
    });
    ```

## removeAllListeners()

```ts
function removeAllListeners(event?: string): void
```

-   参数说明

    -   `event`: 填写时，表示移除指定事件的所有监听器，不填时，表示移除所有事件的所有监听器

-   方法说明

    该方法用于移除一个事件或者所有事件的所有监听器
