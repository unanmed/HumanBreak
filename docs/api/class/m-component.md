# 类 MComponent

渲染进程类，游戏进程不能直接使用。对于部分方法，请参考 [UI 编写](../../guide/ui.md)

-   实例成员
    -   [`content`](#content)
-   实例方法
    -   [`defineProps`](#defineprops)
    -   [`defineEmits`](#defineemits)
    -   [`div`](#div)
    -   [`span`](#span)
    -   [`canvas`](#canvas)
    -   [`text`](#text)
    -   [`com`](#com)
    -   [`vfor`](#vfor)
    -   [`h`](#h)
    -   [`onSetup`](#onsetup)
    -   [`onMounted`](#onmounted)
    -   [`setup`](#setup)
    -   [`ret`](#ret)
    -   [`export`](#export)
-   静态成员
    -   [`mountNum`](#mountnum)
-   静态方法
    -   [`vNodeS`](#vnodes)
    -   [`vNodeM`](#vnodem)
    -   [`vNode`](#vNode)
    -   [`unwrapProps`](#unwrapprops)
    -   [`prop`](#prop)

## content

```ts
declare var content: any[]
```

-   成员说明

    存储了当前组件的所有内容

## defineProps()

```ts
declare function defineProps(props: Record<string, any>): this
```

## defineEmits()

```ts
declare function defineEmits(emits: string[]): this
```

## div()

```ts
declare function div(children?: any, config?: any): this
```

## span()

```ts
declare function span(children?: any, config?: any): this
```

## canvas()

```ts
declare function canvas(config?: any): this
```

## text()

```ts
declare function text(text: string | (() => string), config?: any): this
```

## com()

```ts
declare function com(component: any, config?: any): this
```

## vfor()

```ts
declare function vfor(items: any, map: (value: any, index: number) => VNode): this
```

## h()

```ts
declare function h(type: any, children?: any, config?: any): this
```

## onSetup()

```ts
declare function onSetup(fn: OnSetupFunction): this
```

## onMounted()

```ts
declare function onMounted(fn: OnMountedFunction): this
```

## setup()

```ts
declare function setup(fn: SetupFunction): this
```

## ret()

```ts
declare function ret(fn: RetFunction): this
```

## export()

```ts
declare function export(): Component
```

## mountNum

```ts
declare var mountNum: number
```

## vNodeS()

```ts
declare function vNodeS(child: any, mount?: number): VNode
```

-   静态方法说明

    将单个渲染内容输出为单个 `VNode`

## vNodeM()

```ts
declare function vNodeM(mc: MComponent, mount?: number): VNode[]
```

-   静态方法说明

    将一个 `MComponent` 组件渲染为一个 `VNode` 数组

## vNode()

```ts
declare function vNode(children: any, mount?: number): VNode[]
```

-   静态方法说明

    将一系列渲染内容输出为一个 `VNode` 数组

## unwrapProps()

```ts
declare function unwrapProps(props?: Record<string, () => any>): Record<string, any>
```

-   静态方法说明

    获取 props 的真实值。因为传入渲染内容的 props 是一个函数，因此需要一层调用

## prop()

```ts
declare function prop(component: Component, props: Record<string, any>): VNode
```

-   静态方法说明

    在渲染时给一个组件传递 props。实际效果为在调用后并不会传递，当被传递的组件被渲染时，将会传递 props。
