# 类 AudioPlayer

渲染进程类，游戏进程不能直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例成员
    -   [`index`](#index)
    -   [`data`](#data)
    -   [`buffer`](#buffer)
    -   [`source`](#source)
    -   [`baseNode`](#basenode)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`update`](#update)
    -   [`getSource`](#getSource)
    -   [`play`](#play)
    -   [`ready`](#ready)
    -   [`getDestination`](#getdestination)
-   静态成员
    -   [`ac`](#ac)
    -   [`index`](#static-index)

## index

```ts
declare var index: number
```

## data

```ts
declare var data: ArrayBuffer
```

## buffer

```ts
declare var buffer: AudioBuffer | null
```

## source

```ts
declare var source: AudioBufferSourceNode | undefined
```

## baseNode

```ts
declare var baseNode: BaseNode[]
```

-   成员说明

    包含了音频在播放时经过的每个音频处理路由的根节点，参考[自定义音频路由](../../guide/audio.md#自定义音频路由)

-   接口 `BaseNode`

    ```ts
    interface BaseNode {
        node: AudioNode;
        channel?: number;
    }
    ```

    -   `node`: 路由节点
    -   `channel`: 连接至的音频入口（input channel）

## constructor()

```ts
interface AudioPlayer {
    new(data: ArrayBuffer): AudioPlayer
}
```

-   参数说明

    -   `data`: 音频的 `ArrayBuffer` 数据，一般是 xhr 请求的 response

## update()

```ts
declare function update(data: ArrayBuffer): Promise<void>
```

-   方法说明

    更新音频的 `ArrayBuffer` 数据，并解析为 `AudioBuffer`，赋值给 [`buffer`](#buffer) 属性

## getSource()

```ts
declare function getSource(): AudioBufferSourceNode
```

-   方法说明

    获取音频的源节点

## play()

```ts
declare function play(when?: number, offset?: number, duration?: number): void
```

-   参数说明

    -   `when`: 声音开始播放的时间，注意不是声音从哪开始播放。时间与 [`ac`](#ac) 共用一个时间轴，即在 `ac` 的何时播放这个音频，如果小于 `ac` 的 `currentTime`，那么会立刻开始播放，单位是秒
    -   `offset`: 从声音的何时开始播放，例如填 5 就是从声音的第 5 秒开始播放
    -   `duration`: 指定声音播放多长时间，单位为秒

## ready()

```ts
declare function ready(): void
```

-   方法说明

    准备音频路由，将源节点连接至各个音频路由根节点

## getDestination()

```ts
declare function getDestination(): AudioDestinationNode
```

-   方法说明

    获取音频目的地节点

## ac

```ts
declare var ac: AudioContext
```

-   静态成员说明

    音频处理上下文实例，所有的音频处理（bgm 除外）都是用它来实现的

## static index

```ts
declare var index: number
```

## play 事件

```ts
interface AudioPlayerEvent {
    play: (node: AudioBufferSourceNode) => void
}
```

## update 事件

```ts
interface AudioPlayerEvent {
    update: (audio: AudioBuffer) => void
}
```

## end 事件

```ts
interface AudioPlayerEvent {
    end: (node: AudioBufferSourceNode) => void
}
```
