# 事件触发系统

事件触发系统是一个可以监测游戏运行时的系统，通过这个系统，你可以在游戏运行的特定时刻执行一些函数，而因此可以大大减少复写的量，代码也会更加清晰。

事件触发系统依赖于两个类 `EventEmitter` 和 `IndexedEventEmitter`，这两个类在游戏进程和渲染进程都可以直接使用。本页面将会着重介绍这两个类的使用方法。

样板内置的所有包含事件触发功能的内容都基于 `EventEmitter` 类，而不基于 `IndexedEventEmitter`。

## 监听事件

通过 `on` 函数监听事件：

```ts
function on(event: string, fn: (...params: any) => any, config?: any): void
```

其中 `event` 参数表示要监听的事件类型，`fn` 是这个事件被触发时执行的函数，接受任意数量的参数，这取决于触发事件时传入了哪些参数。也可以有返回值，返回值可以被触发函数获取到。

例如，我想监听 UI 控制器的 `end` 事件，就可以这么写：

```js
const { mainUi } = Mota.requireAll('var');

// 监听的 end 事件无参数
mainUi.on('end', () => {
    console.log('event emitted!');
});
```

这时，如果 UI 控制器触发了 `end` 事件，那么传入的函数就会被执行，也就会在控制台打印 `event emitted!`。对于有参数的事件，可以这么写：

```js
// 监听 splice 事件，并在控制台打印所有被关闭的 UI 名称
mainUi.on('splice', (items) => {
    console.log(items.map(v => v.id));
});
```

对于 `IndexedEventEmitter`，还拥有 `onIndex` 函数，可以为这次监听的函数指定一个 id，从而在取消监听时可以通过这个 id 删除，不再需要传入原函数的引用。值得注意的是，样板内置的所有拥有事件触发功能的内容都基于 `EventEmitter`，也就是说它们不能使用 `onIndex` 函数。

```ts
function onIndex(
    event: string,
    symbol: string | number | symbol,
    fn: (...params: any) => any,
    config?: any
): void
```

这里的 `symbol` 便是指定的 `id`

```js
eventEmitter.onIndex('end', 'myListener', () => {
    console.log('emitted!');
});
```

## 取消监听

可以通过 `off` 函数来取消监听：

```ts
function off(event: string, fn: (...params: any) => any): void
```

示例

```js
const fn = () => console.log('event emitted!');

mainUi.on('end', fn);

// 取消监听，注意要求函数引用相同，内容一样是没用的！
mainUi.off('end', fn);
```

对于 `IndexedEventEmitter`，还可以通过 `offIndex` 来取消监听：

```js
// 传入监听时指定的 id 即可，不需要传入函数
eventEmitter.offIndex('end', 'myListener');
```

除此之外，对于两种事件触发器，都还可以通过 `removeAllListeners` 来取消监听所有事件，或者是一个事件的所有内容

```ts
function removeAllListeners(event?: string): void
```

当不传入 `event` 时，会将所有事件的所有监听器全部取消，这时所有的监听器都将失效。当传入 `event` 时，会将指定事件的所有监听器全部取消。

```js
// 取消监听 mainUi 上的所有内容
mainUi.removeAllListeners();
// 取消监听 mainUi 上的 end 事件
mainUi.removeAllListeners('end');
```

::: warning
不要对样板内置变量执行 `removeAllListeners` 函数，因为样板内置内容很多都基于事件触发。
:::

## 触发事件

可以通过 `emit` 函数触发事件：

```ts
function emit(event: string, ...params: any): any[]
```

这个函数的 `event` 参数表示的是要触发哪个事件，后面的参数表示的是要传递给监听器的参数。其返回值是每个监听器的返回值组成的数组，顺序不确定。除此之外，如果设置了[自定义触发器](#自定义触发器)，那么返回值也会跟随自定义触发器而改变。

例如，如果我想触发 `mainUi` 的 `end` 事件：

```js
mainUi.emit('end'); // 触发事件，无参数
mainUi.emit('end', 123, '123'); // 触发事件，有两个参数传入监听器，监听器可以通过参数获取
```

## 监听配置

对于 `on` 函数以及 `onIndex` 函数的最后一个参数，表示的是这个监听器的配置选项。在目前，它包含两个选项：

-   `once`: 表示这个监听器只会触发一次，触发一次后即自动删除
-   `immediate`: 当这个监听器被添加的时候，会立刻被触发一次，不传入任何参数

对于 `once` 配置项，还可以通过 `once` 函数来设置：

```ts
function once(event: string, fn: (...params: any) => any): void
function onceIndex(event: string, symbol: string | number | symbol, fn: (...params: any) => any): void
```

这样，我们就可以通过 `once` 函数来添加一个只会触发一次的监听器了：

```js
mainUi.once('end', () => {
    console.log('这个事件只会触发一次');
});
```

## 自定义触发器

你还可以通过 `setEmitter` 函数来自定义你的事件触发器：

```ts
function setEmitter(event: string, fn?: (event: any[], ...params: any) => any): void
```

其中 `event` 参数表示的是要设置的时间，`fn` 参数表示的是触发器函数，它接收事件信息作为第一个参数，之后的参数是事件触发时传入的参数。

示例

```js
eventEmitter.setEmitter('myEmitter', (event, ...params) => {
    const returns = [];
    for (const ev of event) {
        // 修改触发器的返回值，在后面加上'-myEmitter'字符串
        returns.push(ev.fn(...params) + '-myEmitter');
    }
    return returns;
})
```

## 样板中基于事件触发器的接口

类

-   `AudioPlayer`
-   `Disposable`
-   `IndexedEventEmitter`
-   `ShaderEffect`
-   `ResourceController`
-   `MotaSetting`
-   `SettingDisplayer`
-   `Hotkey`
-   `Keyboard`
-   `CustomToolbar`
-   `Focus`
-   `GameUi`

变量

-   `mainUi`
-   `fixedUi`
-   `bgm`
-   `sound`
-   `gameKey`
-   `mainSetting`
-   `hook`
-   `gameListener`
-   `loading`
