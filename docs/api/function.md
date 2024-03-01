# 函数 API

此处列出所有的单个函数的 API，函数 API 使用 `Mota.requireAll('fn')` 获取

## getHeroStatusOn()

```ts
declare function getHeroStatusOn(name: 'all', floorId?: string): HeroStatus
declare function getHeroStatusOn(name: string, floorId?: string): any
declare function getHeroStatusOn(name: string[], floorId?: string): Partial<HeroStatus>
```

-   第一种用法

    获取勇士的所有真实属性

-   第二种用法

    获取勇士的单个真实属性

-   第三种用法

    获取勇士的指定真实属性

## getHeroStatusOf()

```ts
declare function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: 'all',
    floorId?: string
): HeroStatus
declare function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: string,
    floorId?: string
): any
declare function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: string[],
    floorId?: string
): Partial<HeroStatus>
```

三种用法与 [`getHeroStatusOn`](#getherostatuson) 类似，只不过多了一个部分指定勇士原始属性的参数

## getEnemy()

```ts
declare function getEnemy(
    x: number,
    y: number,
    floorId: string = core.status.floorId
): DamageEnemy
```

-   函数说明

    获取到指定楼层指定位置的怪物实例

## m()

```ts
declare function m(): MComponent
```

-   函数说明

    构造一个 `MComponent` 实例，等价于 `new MComponent()`

## unwrapBinary()

```ts
declare function unwrapBinary(bin: number): AssistHotkey
```

-   函数说明

    将一个三位二进制解析为辅助按键对象信息，表示三个辅助按键是否都被按下

-   接口 `AssistHotkey` 参考 [类 Hotkey](./class/hotkey.md#部分接口与类型说明)

-   示例

    ```ts
    unwrapBinary(0b111); // { ctrl: true, shift: true, alt: true }
    ```

## checkAssist()

```ts
declare function checkAssist(bin: number, key: KeyCode): boolean
```

-   函数说明

    判断一个三位二进制数据中指定按键是否被按下

-   示例

    ```ts
    checkAssist(0b000, KeyCode.Ctrl); // false
    ```

## isAssist()

```ts
declare function isAssist(key: KeyCode): boolean
```

-   函数说明

    判断一个按键是否是辅助按键

-   示例

    ```ts
    isAssist(KeyCode.KeyX); // false
    ```

## generateKeyboardEvent()

```ts
declare function generateKeyboardEvent(key: KeyCode, assist: number): KeyboardEvent
```

-   参数说明

    -   `key`: 占位参数，目前无用
    -   `assist`: 按下了哪些辅助按键

-   函数说明

    生成拟真的 `KeyboardEvent` 事件

## addAnimate()

```ts
declare function addAnimate(fn: (time: number) => void): void
```

-   参数说明

    -   `fn`: 每个动画帧（即怪物或者动画图块动一次）执行的函数

-   函数说明

    添加一个在每个动画帧，也就是每个怪物或者动画图块动一次的时候，执行的函数

## removeAnimate()

```ts
declare function removeAnimate(fn: (time: number) => void): void
```

-   函数说明

    删除一个由 [`addAnimate`](#addanimate) 添加的动画帧函数，注意要传入函数的引用
