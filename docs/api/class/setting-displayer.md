# 类 SettingDisplayer

渲染进程类，游戏进程不可直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例属性
    -   [`setting`](#setting)
    -   [`selectStack`](#selectstack)
    -   [`displayInfo`](#displayinfo)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`add`](#add)
    -   [`cut`](#cut)
    -   [`updata`](#update)
-   实例事件
    -   [`update`](#update-事件)

## setting

```ts
declare var setting: MotaSetting
```

-   成员说明

    该成员描述了当前显示实例的设置

## selectStack

```ts
declare var selectStack: string[]
```

-   成员说明

    该成员描述了当前的设置选择栈，例如当选中了级联设置 `setting1.setting2` 时，选择栈就是 `['setting1', 'setting2']`

## displayInfo

```ts
declare var displayInfo: SettingDisplayInfo[]
```

-   成员说明

    该成员是响应式对象（`reactive`），描述了当前设置的所有显示信息，包含父设置（级联设置）的信息，一般情况下信息与选择栈同步。

-   接口 `SettingDisplayInfo`

    ```ts
    interface SettingDisplayInfo {
        item: MotaSettingItem | null;
        list: Record<string, MotaSettingItem>;
        text: string[];
    }
    ```

    -   详细说明
        -   `item`: 描述了当前设置的信息，当没有选择设置或选择的是级联设置的时候为 `null`
        -   `list`: 这个设置的选择栈
        -   `text`: 显示的文字信息，经由 `split` 处理，分割字符为 `\n`，可以经过 [`splitText`](../module/render-utils.md#splittext) 函数处理后直接显示

## constructor()

```ts
interface SettingDisplayer {
    new(setting: MotaSetting): SettingDisplayer
}
```

-   构造器说明

    传入要显示的设置实例，返回一个显示器实例

## add()

```ts
declare function add(key: string): void
```

-   方法说明

    该方法用于向选择栈里面添加一个选择项，例如现在我选择了 `setting2`，那么就应该调用 `add('setting2')`

## cut()

```ts
declare function cut(index: number, noUpdate: boolean = false): void
```

-   参数说明

    -   `index`: 从第几个元素开始剪切，即第一个剪切项的索引
    -   `noUpdate`: 是否不进行刷新

-   方法说明

    该方法用于剪切选择栈，例如我从选择支 `s1.s2.s3.s4` 切换至了 `s1.s6`，那么应该先调用 `cut(1)`，再调用 `add('s6')`

## update()

```ts
declare function update(): void
```

-   方法说明

    用于更新选择栈显示信息

## update 事件

```ts
interface SettingDisplayerEvent {
    update: (stack: string[], display: SettingDisplayInfo[]) => void
}
```

-   事件说明

    该事件会在选择栈更新时触发，传入的参数分别是当前的选择栈和当前选择栈显示信息
