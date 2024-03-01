# 模块 Use

渲染进程模块，游戏进程不能直接使用

此模块包含了若干与 DOM 相关的功能函数与变量

-   变量
    -   [`isMobile`](#ismobile)
-   函数
    -   [`useDrag`](#usedrag)
    -   [`cancelGlobalDrag`](#cancelglobaldrag)
    -   [`useWheel`](#usewheel)
    -   [`useUp`](#useup)
    -   [`useDown`](#usedown)

## isMobile

```ts
declare var isMobile: boolean
```

-   变量说明

    表明是否是移动端，不过应该是没用的。。

## useDrag()

```ts
declare function useDrag(
    ele: HTMLElement | HTMLElement[],
    fn: DragFn,
    ondown?: DragFn,
    onup?: (e: MouseEvent | TouchEvent) => void,
    global: boolean = false
): void
```

-   类型说明

    ```ts
    type DragFn = (x: number, y: number, e: MouseEvent | TouchEvent) => void
    ```

-   参数说明

    -   `ele`: 目标元素，当为全局拖拽时，传入数组表示所有元素共用一个全局拖拽函数
    -   `fn`: 拖拽时触发的函数，传入 x y 和鼠标事件或点击事件
    -   `ondown`: 鼠标按下时执行的函数
    -   `global`: 是否全局拖拽，即拖拽后鼠标或手指离开元素后是否依然视为正在拖拽

-   函数说明

    向一个或若干个元素添加拖拽事件，如果是全局拖拽，当目标元素被销毁后，必须调用 `cancelGlobalDrag` 函数

## cancelGlobalDrag()

```ts
declare function cancelGlobalDrag(fn: DragFn): void
```

-   函数说明

    取消一个全局拖拽函数，传入拖拽函数引用

## useWheel()

```ts
declare function useWheel(
    ele: HTMLElement,
    fn: (x: number, y: number, z: number, e: WheelEvent) => void
): void
```

-   参数说明

    -   `ele`: 要添加滚轮监听函数的元素
    -   `fn`: 当滚轮滚动时，执行的函数

-   函数说明

    当触发滚轮时执行函数

## useUp()

```ts
declare function useUp(ele: HTMLElement, fn: DragFn): void
```

-   参数说明

    -   `ele`: 要监听的元素
    -   `fn`: 当鼠标抬起或手指抬起时，触发的函数

-   函数说明

    当手指或鼠标抬起时触发函数

## useDown()

```ts
declare function useDown(ele: HTMLElement, fn: DragFn): void
```

-   函数说明

    与 [`useUp`](#useup) 类似，不过触发时机变为了手指或鼠标按下时触发
