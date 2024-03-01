# 类 Hotkey

渲染进程类，在游戏进程不能直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例属性
    -   [`id`](#id)
    -   [`name`](#name)
    -   [`data`](#data)
    -   [`keyMap`](#keymap)
    -   [`groupName`](#groupname)
    -   [`groups`](#groups)
    -   [`enabled`](#enabled)
    -   [`conditionMap`](#conditionmap)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`register`](#register)
    -   [`realize`](#realize)
    -   [`use`](#use)
    -   [`dispose`](#dispose)
    -   [`set`](#set)
    -   [`emitKey`](#emitkey)
    -   [`group`](#group)
    -   [`enable`](#enable)
    -   [`disable`](#disable)
    -   [`when`](#when)
    -   [`toJSON`](#tojson)
    -   [`fromJSON`](#fromjson)
-   静态属性
    -   [`list`](#list)
-   静态方法
    -   [`get`](#get)
-   实例事件
    -   [`set`](#set-事件)
    -   [`emit`](#emit-事件)

## 部分接口与类型说明

```ts
interface AssistHotkey {
    ctrl: boolean
    shift: boolean
    alt: boolean
}
```

三个属性分别表示对应的按键是否按下，或者是否需要被按下

```ts
interface RegisteredHotkeyData extends Partial<AssistHotkey> {
    id: string
    name: string
    defaults: KeyCode
    type?: KeyEmitType
}
```

-   `id`: 注册的这个按键的 id，可以加后缀，参考[同 id 按键](../../guide/hotkey.md#同-id-按键)
-   `name`: 这个按键的名称，会显示在自定义快捷键界面中
-   `defaults`: 玩家不进行设置时，这个功能的默认按键
-   `type`: 占位属性，暂时无用
-   `ctrl` `shift` `alt`: 玩家不进行设置时，这个功能默认的辅助按键，按下辅助按键后按下默认按键才可触发功能

```ts
interface HotkeyData extends Required<RegisteredHotkeyData> {
    key: KeyCode
    func: Map<symbol, HotkeyFunc>
    group?: string
}
```

-   `key`: 当前这个功能的按键
-   `func`: 所有当前存在的作用域下，每个作用域触发时的执行函数
-   `group`: 这个按键所处的分组，参考 [按键分组](../../guide/hotkey.md#按键分组)

```ts
type HotkeyFunc = (id: string, code: KeyCode, ev: KeyboardEvent) => void;
```

表示按键的触发函数

-   `id`: 触发的按键的 id，包含数字后缀
-   `code`: 触发时按下的按键
-   `ev`: 触发时的 `KeyboardEvent`，对于虚拟键盘，会进行不完全拟真

## id

```ts
declare var id: string
```

## name

```ts
declare var name: string
```

## data

```ts
declare var data: Record<string, HotkeyData>
```

-   成员说明

    该成员存储了所有注册的按键信息，其中键表示按键的 id，值表示这个 id 对应的按键

## keyMap

```ts
declare var keyMap: Map<KeyCode, HotkeyData[]>
```

-   成员说明

    存储了每个按键可以触发的功能列表，例如 X 键打开怪物手册等

## groupName

```ts
declare var groupName: Record<string, string>
```

-   成员说明

    存储了每个分组对应的显示名称，键表示分组 id，值表示分组名称

## groups

```ts
declare var groups: Record<string, string[]>
```

-   成员说明

    存储了每个分组所包含的按键 id，键表示分组 id，值是一个数组，包含了所有的按键 id

## enabled

```ts
declare var enabled: boolean
```

-   成员说明

    表示当前按键实例是否被启用

## conditionMap

```ts
declare var conditionMap: Map<symbol, () => boolean>
```

-   成员说明

    描述了每个作用域下的按键启用条件，也就是 [`when`](#when) 函数的功能

## constructor()

```ts
interface Hotkey {
    new(id: string, name: string): Hotkey
}
```

## register()

```ts
declare function register(data: RegisterHotkeyData): this
```

-   方法说明

    注册一个按键，id 可以包含数字后缀，可以显示为同一个按键操作拥有多个按键可以触发

## realize()

```ts
declare function realize(id: string, func: HotkeyFunc): this
```

-   参数说明

    -   `id`: 要实现的按键 id，可以不包含数字后缀
    -   `func`: 按键被触发时执行的函数

-   方法说明

    实现一个按键按下时的操作

## use()

```ts
declare function use(symbol: symbol): this
```

-   方法说明

    使用一个 symbol 作为当前作用域，之后调用 [`realize`](#realize) 所实现的按键功能将会添加至此作用域

## dispose()

```ts
declare function dispose(symbol?: symbol): void
```

-   参数说明

    -   `symbol`: 要释放的作用域

-   方法说明

    释放一个作用域，释放后作用域将退回至删除的作用域的上一级

## set()

```ts
declare function set(id: string, key: KeyCode, assist: number): void
```

-   参数说明

    -   `id`: 要修改的按键的 id
    -   `key`: 要修改为的触发按键
    -   `assist`: 要修改为的辅助按键

-   方法说明

    设置一个按键信息

## emitKey()

```ts
declare function emitKey(
    key: KeyCode,
    assist: number,
    type: KeyEmitType,
    ev: KeyboardEvent
): boolean
```

-   参数说明

    -   `key`: 要触发的按键
    -   `assist`: 触发时的辅助按键
    -   `type`: 暂时为占位参数，填写 `up` 即可
    -   `ev`: 触发按键时的按键事件信息 `KeyboardEvent`，参考 dom 中的按键事件

-   方法说明

    触发一个按键

-   返回值

    是否成功触发至少一个按键

## group()

```ts
declare function group(id: string, name: string): this
```

-   参数说明

    -   `id`: 分组的 id
    -   `name`: 分组的显示名称

-   方法说明

    按键分组，分组后调用 [`register`](#register) 注册的按键会进入这个分组，参考[按键分组](../../guide/hotkey.md#按键分组)

## enable()

```ts
declare function enabled(): void
```

-   方法说明

    启用这个按键实例

## disable()

```ts
declare function disabled(): void
```

-   方法说明

    禁用这个按键实例

## when()

```ts
declare function when(fn: () => boolean): this
```

-   方法说明

    在当前作用域下，满足一定条件后启用按键功能

## toJSON()

```ts
declare function toJSON(): string
```

## fromJSON()

```ts
declare function fromJSON(data: string): void
```

## list

```ts
declare var list: Hotkey[]
```

-   静态成员说明

    存储了所有的按键实例

## get()

```ts
declare function get(id: string): Hotkey
```

-   静态方法说明

    根据 id 获取到对应的按键实例

## set 事件

```ts
interface HotkeyEvent {
    set: (id: string, key: KeyCode, assist: number) => void
}
```

-   参数说明

    -   `id`: 设置的按键的 id
    -   `key`: 设置为的触发按键
    -   `assist`: 设置为的辅助按键

-   事件说明

    当设置按键信息（执行`set`函数）时触发该事件

## emit 事件

```ts
interface HotkeyEvent {
    emit: (key: KeyCode, assist: number) => void
}
```

-   参数说明

    -   `key`: 触发的按键
    -   `assist`: 触发的辅助按键

-   事件说明

    当触发一个按键时触发该事件
