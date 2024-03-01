# 类 SoundController

渲染进程类，游戏进程不能直接使用，继承自 [`ResourceController`](./resource-controller.md)

-   实例方法
    -   [`add`](#add)
    -   [`play`](#play)
    -   [`stop`](#stop)
    -   [`stopById`](#stopbyid)
    -   [`stopAll`](#stopall)
    -   [`get`](#get)
    -   [`getPlaying`](#getplaying)

## add()

```ts
declare function add(uri: string, data: ArrayBuffer): void
```

-   参数说明

    -   `uri`: 音频的 uri，由于音频也是一种资源，因此格式为`sounds.xxx`
    -   `data`: 音频的 ArrayBuffer 信息，会被解析为 AudioBuffer

-   方法说明

    添加一个新的音频

## play()

```ts
declare function play(sound: string, end?: () => void): number
```

-   参数说明

    -   `sound`: 音频名称，直接填写名称即可，不需填写 `sounds.xxx`
    -   `end`: 当任意一个同名音效播放完毕后执行的函数

-   方法说明

    播放一个音频

-   返回值

    本次播放的唯一标识符

## stop()

```ts
declare function stop(id: number): void
```

-   参数说明

    -   `id`: 要停止播放的音效的唯一标识符

-   方法说明

    根据音效的唯一标识符停止播放一个音效

## stopById()

```ts
declare function stopById(id: string): void
```

-   参数说明

    -   `id`: 要停止播放的音效的名称

-   方法说明

    根据音效的名称停止播放所有对应的音效

## stopAll()

```ts
declare function stopAll(): void
```

-   方法说明

    停止播放所有音效

## get()

```ts
declare function get(id: string): void
```

-   参数说明

    -   `id`: 音效名称，注意不是 uri

-   方法说明

    根据音效名称获取音效实例

## getPlaying()

```ts
declare function getPlaying(): string[]
```

-   方法说明

    获取所有正在播放的音效名称
