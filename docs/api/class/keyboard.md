# 类 Keyboard

渲染进程类，不能直接在游戏进程使用，继承自[EventEmitter](./event-emitter.md)

-   实例成员
    -   [`id`](#id)
    -   [`keys`](#keys)
    -   [`assist`](#assist)
    -   [`fontSize`](#fontsize)
    -   [`scope`](#scope)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`add`](#add)
    -   [`remove`](#remove)
    -   [`withAssist`](#withassist)
    -   [`createScope`](#createscope)
    -   [`disposeScope`](#disposescope)
    -   [`extend`](#extend)
    -   [`emitKey`](#emitKey)
-   静态成员
    -   [`list`](#list)
-   静态方法
    -   [`get`](#get)
-   实例事件
    -   [`add`](#add-事件)
    -   [`remove`](#remove-事件)
    -   [`extend`](#extend-事件)
    -   [`emit`](#emit-事件)
    -   [`scopeCreate`](#scopecreate-事件)
    -   [`scopeDispose`](#scopedispose-事件)

## id

```ts
declare var id: string
```

-   成员说明

    这个虚拟键盘的 id

## keys

```ts
declare var keys: KeyboardItem[]
```

-   成员说明

    包含了所有被添加的按键

-   接口 `KeyboardItem`

    -   `key`: 枚举 `KeyCode` 成员，表示按下这个键后触发哪个按键
    -   `text`: 可选，表示按键的显示文字，兼容 html 标签
    -   `x`: 这个按键的横坐标
    -   `y`: 这个按键的纵坐标
    -   `width`: 这个按键的宽度
    -   `height`: 这个按键的高度

## assist

```ts
declare var assist: number
```

-   成员说明

    表示当前虚拟键盘按下的辅助按键（`ctrl` `shift` `alt`）

## fontSize

```ts
declare var fontSize: number
```

-   成员说明

    当前虚拟键盘的字体大小

## scope

```ts
declare var scope: symbol
```

-   成员说明

    当前虚拟键盘处在的作用域

## constructor()

```ts
interface Keyboard {
    new(id: string): Keyboard
}
```

## add()

```ts
declare function add(item: KeyboardItem): this
```

-   方法说明

    向这个虚拟键盘添加一个按键

## remove()

```ts
declare function remove(item: KeyboardItem): this
```

-   方法说明

    删除一个按键，参数表示要删除的按键的引用

## withAssist()

```ts
declare function withAssist(assist: number): symbol
```

-   参数说明

    -   `assist`: 初始状态下被触发的辅助按键，可以通过[`wrapAssist`](../function.md#wrapassist)函数来创建

-   方法说明

    创造一个在某些辅助按键已经按下的情况下的作用域，这些被按下的辅助按键还可以被玩家手动取消

-   返回值

    创建的作用域的`symbol`

## createScope()

```ts
declare function createScope(): symbol
```

-   方法说明

    创建一个全新的作用域，在这个作用域下不会影响到任何其他作用域，例如开关辅助按键等，监听事件也不会相冲突

-   返回值

    这个作用域对应的`symbol`

## disposeScope()

```ts
declare function disposeScope(): void
```

-   方法说明

    销毁上一次创建的作用域

## extend()

```ts
declare function extend(
    keyboard: Keyboard,
    offsetX: number = 0,
    offsetY: number = 0
): this
```

-   参数说明

    -   `keyboard`: 要继承的按键实例
    -   `offsetX`: 继承时所有按键的偏移横坐标
    -   `offsetY`: 继承时所有按键的偏移纵坐标

-   方法说明

    继承自一个其他的虚拟按键实例，例如主键盘可以由字母按键、数字按键等继承而来，同时指定偏移坐标

## emitKey()

```ts
declare function emitKey(key: KeyboardItem, index: number): void
```

-   参数说明

    -   `key`: 触发的按键信息，是按键的引用
    -   `index`: 这个按键在 [`keys`](#keys) 中的索引

-   方法说明

    触发一个虚拟按键

## list

```ts
declare var list: Keyboard[]
```

-   静态成员说明

    包含了所有的 `Keyboard` 实例

## get()

```ts
declare function get(id: string): Keyboard
```

-   方法说明

    根据虚拟按键实例的 id 获取到虚拟按键实例

-   系统自带虚拟按键

    -   `qwe`: 字母键盘，包含 A-Z
    -   `num`: 字母键盘上方的数字键盘，非小键盘，包含 0-9 及反引号键、减号键、等号键和退格键
    -   `char`: 符号键盘，包含 \[\]\\;',./
    -   `fn`: Fn 键盘，包含 F1-F12 及 Escape
    -   `assist`: 辅助按键键盘，包含 Tab、大写锁定、左右 Shift、左右 Ctrl、左右 Alt、左右 Meta（Windows 电脑的 Win 键，或是 Mac 电脑的 Command 键）、空格键、回车键
    -   `arrow`: 方向键，包含上下左右四个方向键
    -   `numpad`: 小键盘，包含小键盘的 0-9（与数字键盘的 0-9 不同）、小键盘锁（NumLock）、小键盘的+-\*/、小键盘的点、回车（与主键盘的回车相同）
    -   `media`: 媒体按键，包含播放/暂停、停止播放、上一首、下一首
    -   `tool`: 功能按键，包含 PageUp、PageDn、Insert、Delete、Home、End
    -   `main`: 主键盘，继承 `qwe` `num` `char` `fn` `assist`，无新增按键
    -   `toolArrow`: 方向键与功能键，继承 `arrow` `tool`，无新增按键
    -   `mini`: 小键盘，继承 `numpad`，无新增按键
    -   `full`: 全按键，继承 `main` `toolArrow` `mini` `media`，无新增按键

## add 事件

```ts
interface VirtualKeyboardEvent {
    add: (item: KeyboardItem) => void
}
```

-   事件说明

    当添加虚拟按键时触发事件

## remove 事件

```ts
interface VirtualKeyboardEvent {
    remove: (item: KeyboardItem) => void
}
```

-   事件说明

    当移除一个虚拟按键时触发

## extend 事件

```ts
interface VirtualKeyboardEvent {
    extend: (extended: Keyboard) => void
}
```

-   事件说明

    当继承其他虚拟键盘实例时触发

## emit 事件

```ts
interface VirtualKeyboardEvent {
    emit: (
        item: KeyboardItem,
        assist: number,
        index: number,
        ev: VirtualKeyEmit
    ) => void
}
```

-   参数说明

    -   `item`: 触发的按键信息
    -   `assist`: 触发时的辅助按键按下情况
    -   `index`: 按键信息处在的按键列表中的索引
    -   `ev`: 剩余内容，包含一些函数以供调用

-   接口 `VirtualKeyEmit`

    ```ts
    interface VirtualKeyEmit {
        preventDefault(): void
        preventAssist(): void
    }
    ```

    -   `preventDefault`: 阻止非辅助虚拟按键的默认行为。虚拟按键的默认行为为触发 `Hotkey` 在当前作用域下对应的按键，调用后即可阻止这一默认行为的发生
    -   `preventAssist`: 阻止辅助按键的默认行为。辅助按键的默认行为是开关对应的辅助按键开关状态，调用后可以阻止这一默认行为的发生

-   事件说明

    当触发一个虚拟按键时触发这个事件

-   示例

    以下是样板自带函数 `getVirtualKeyOnce` 的源代码实现，这个函数便依赖于这个事件。

    ```ts {10}
    export function getVitualKeyOnce(
        emitAssist: boolean = false,
        assist: number = 0,
        emittable: KeyCode[] = []
    ): Promise<KeyboardEmits> {
        return new Promise(res => {
            const key = Keyboard.get('full')!;
            key.withAssist(assist);
            const id = mainUi.open('virtualKey', { keyboard: key });
            key.on('emit', (item, assist, index, ev) => {
                ev.preventDefault();
                if (emitAssist) {
                    if (emittable.length === 0 || emittable.includes(item.key)) {
                        res({ key: item.key, assist: 0 });
                        key.disposeScope();
                        mainUi.close(id);
                    }
                } else {
                    if (
                        !isAssist(item.key) &&
                        (emittable.length === 0 || emittable.includes(item.key))
                    ) {
                        res({ key: item.key, assist });
                        key.disposeScope();
                        mainUi.close(id);
                    }
                }
            });
        });
    }
    ```

## scopeCreate 事件

```ts
interface VirtualKeyboardEvent {
    scopeCreate: (scope: symbol) => void
}
```

-   事件说明

    当创建一个作用域时触发这个事件

## scopeDispose 事件

```ts
interface VirtualKeyboardEvent {
    scopeDispose: (scope: symbol) => void
}
```

-   事件说明

    当释放一个作用域时触发这个事件
