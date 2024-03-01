# 类 Focus

渲染进程类，在游戏进程中不可直接使用，继承自 [`EventEmitter`](./event-emitter.md)

-   实例属性
    -   [`stack`](#stack)
    -   [`focused`](#focused)
    -   [`readonly equal`](#readonly-equal)
-   实例方法
    -   构造器[`constructor`](#constructor)
    -   [`focus`](#focus)
    -   [`unfocus`](#unfocus)
    -   [`add`](#add)
    -   [`pop`](#pop)
    -   [`splice`](#splice)
    -   [`spliceIndex`](#spliceindex)
-   实例事件
    -   [`focus`](#focus-事件)
    -   [`unfocus`](#unfocus-事件)
    -   [`add`](#add-事件)
    -   [`pop`](#pop-事件)
    -   [`splice`](#splice-事件)

## stack

```ts
declare var stack: any[]
```

-   成员说明

    该成员描述了当前列表的显示栈

## focused

```ts
declare var focused: any | null
```

-   成员说明

    该成员描述了当聚焦于的元素

## readonly equal

```ts
declare const equal: boolean
```

-   成员说明

    该成员描述了不同元素间的关系，当该项为 `true` 时，表示成员间为平等关系，删除任意一项不会影响其他项，而为 `false` 时，删除一项后会将其之后的所有项一并删除

## consturctor()

```ts
interface Focus {
    new(react: boolean = false, equal: boolean = false): Focus
}
```

-   参数说明
    -   `react`: 显示栈是否设置为浅层响应式（`shallowReactive`）变量
    -   `equal`: 成员关系是否为平等关系

## focus()

```ts
declare function focus(target: any, add: boolean = false): void
```

-   参数说明

    -   `target`: 聚焦目标，是聚焦目标的引用，而非索引
    -   `add`: 当聚焦目标不存在时，是否自动追加到显示栈末尾

-   方法说明

    该方法用于聚焦于一个显示元素

## unfocus()

```ts
declare function unfocus(): void
```

-   方法说明

    该方法用于取消聚焦显示元素

## add()

```ts
declare function add(item: any): void
```

-   方法说明

    该方法用于在显示栈末尾追加一个元素

## pop()

```ts
declare function pop(): any | null
```

-   方法说明

    弹出显示栈末尾的元素

## splice()

```ts
declare function splice(item: any): void
```

-   方法说明

    方法用于裁切显示栈，对于平等模式，只会删除对应元素，而对于非平等模式，其之后的所有元素都会被删除

## spliceIndex()

```ts
declare function spliceIndex(index: number): void
```

-   方法说明

    根据索引裁切显示栈，与 [`splice`](#splice) 方法类似

## focus 事件

```ts
interface FocusEvent {
    focus: (before: any | null, after: any) => void
}
```

-   事件说明

    当聚焦于一个元素时，该事件会被触发，传入之前聚焦的元素以及当前聚焦的元素作为参数

## unfocus 事件

```ts
interface FocusEvent {
    unfocus: (before: any | null) => void
}
```

-   事件说明

    当取消聚焦元素时，该事件被触发，传入之前聚焦于的元素作为参数

## add 事件

```ts
interface FocusEvent {
    add: (item: any) => void
}
```

-   事件说明

    当向显示栈内添加内容时，该事件被触发，传入添加的元素作为参数

## pop 事件

```ts
interface FocusEvent {
    pop: (item: any | null) => void
}
```

-   事件说明

    当弹出显示栈的末尾元素时，该事件被触发，传入弹出的元素作为参数

## splice 事件

```ts
interface FocusEvent {
    splice: (spliced: any[]) => void
}
```

-   事件说明

    当显示栈被裁切时，该事件被触发，传入所有被裁切的元素组成的数组作为参数
