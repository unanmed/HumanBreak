# 类 BgmController

渲染进程类，游戏进程不能直接使用，继承自 [`ResourceController`](./resource-controller.md)

-   实例成员
    -   [`stack`](#stack)
    -   [`redoStack`](#redostack)
    -   [`now`](#now)
    -   [`transitionTime`](#transitiontime)
    -   [`transitionCurve`](#transitioncurve)
    -   [`volume`](#volume)
    -   [`disable`](#disable)
    -   [`playing`](#playing)
-   实例方法
    -   [`add`](#add)
    -   [`load`](#load)
    -   [`changeTo`](#changeto)
    -   [`pause`](#pause)
    -   [`resume`](#resume)
    -   [`play`](#play)
    -   [`undo`](#undo)
    -   [`redo`](#redo)
    -   [`setTransition`](#settransition)
    -   [`get`](#get)
-   实例事件
    -   [`changeBgm`](#changebgm-事件)
    -   [`pause`](#pause-事件)
    -   [`resume`](#resume-事件)

## 部分接口说明

```ts
interface BgmEmits {
    preventDefault: () => void
}
```

事件监听参数，用于阻止默认行为，例如切歌、暂停、继续

## stack

```ts
declare var stack: string[]
```

-   成员说明

    播放栈，存储了之前播放的最多 10 个 bgm

## redoStack

```ts
declare var redoStack: string[]
```

-   成员说明

    恢复栈，undo 操作之后会存入这里，从而可以被 redo

## now

```ts
declare var now: string | undefined
```

-   成员说明

    当前正在播放的 bgm

## transitionTime

```ts
declare var transitionTime: number
```

-   成员说明

    切歌或者暂停等操作的音乐渐变时长

## transitionCurve

```ts
declare var transitionCurve: TimingFn
```

-   成员说明

    切歌或者暂停等操作的音乐音量渐变曲线

## volume

```ts
declare var volume: number
```

-   成员说明

    当前的音乐音量

## disable

```ts
declare var disable: boolean
```

-   成员说明

    是否关闭了音乐

## playing

```ts
declare var playing: boolean
```

-   成员说明

    是否正在播放音乐

## add()

```ts
declare function add(uri: string, data: HTMLAudioElement): void
```

-   参数说明

    -   `id`: bgm 的`uri`，由于 bgm 是一类资源，因此`uri`为`bgms.xxx`的形式
    -   `data`: bgm 音频元素

-   方法说明

    添加一个音乐

## load()

```ts
declare function load(id: string): void
```

-   方法说明

    预先加载一个音乐，从而在播放音乐的时候不会产生卡顿

## changeTo()

```ts
declare function changeTo(id: string, when: number = -1, noStack: boolean = false): void
```

-   参考[切换音乐](../../guide/audio.md#切换-bgm)

## pause()

```ts
declare function pause(transition: boolean = true): void
```

-   方法说明

    暂停音乐播放，继续播放时将会延续暂停的时刻

## resume()

```ts
declare function resume(transition: boolean = true): void
```

-   方法说明

    继续当前 bgm 的播放，从上一次暂停的时刻开始播放

## play()

```ts
declare function play(id: string, when: number = 0, noStack: boolean = false): void
```

-   参考[切换音乐](../../guide/audio.md#切换-bgm)

## undo()

```ts
declare function undo(): void
```

-   方法说明

    撤销当前播放，改为播放前一个 bgm

## redo()

```ts
declare function redo(): void
```

-   方法说明

    取消上一次的撤销，改为播放上一次撤销的 bgm

## setTransition()

```ts
declare function setTransition(time?: number, curve?: TimingFn): void
```

-   方法说明

    修改切歌的渐变信息，参考[设置渐变参数](../../guide/audio.md#设置渐变参数)

## get()

```ts
declare function get(id: string): HTMLAudioElement
```

-   参数说明

    -   `id`: 音乐的名称，不是 uri

-   方法说明

    根据音乐的名称获取到对应的音频元素

## changeBgm 事件

```ts
interface BgmControllerEvent {
    changeBgm: (ev: BgmEmits, id: string, before: string) => void
}
```

-   事件说明

    当歌曲发生切换时触发，包括但不限于直接切歌、撤销、恢复。默认行为为切歌

## pause 事件

```ts
interface BgmControllerEvent {
    pause: (ev: BgmEmits, id: string) => void
}
```

-   事件说明

    当音乐暂停时触发，默认行为为暂停

## resume 事件

```ts
interface BgmControllerEvent {
    resume: (ev: BgmEmits, id: string) => void
}
```

-   事件说明

    当音乐继续播放时触发，默认行为为继续播放
