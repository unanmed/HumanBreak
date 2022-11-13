/** @file actions.js 定义了玩家的操作控制 */
declare class actions {
    /**
     * 此函数将注册一个用户交互行为。
     * @param action 要注册的交互类型，如 ondown, onclick, keyDown 等等。
     * @param name 你的自定义名称，可被注销使用；同名重复注册将后者覆盖前者。
     * @param func 执行函数。
     *             如果func返回true，则不会再继续执行其他的交互函数；否则会继续执行其他的交互函数。
     * @param priority 优先级；优先级高的将会被执行。此项可不填，默认为0
     */
    registerAction(
        action: string,
        name: string,
        func: string | ((...params: any) => void),
        priority?: number
    ): void;

    /** 注销一个用户交互行为 */
    unregisterAction(action: string, name: string): void;

    /** 执行一个用户交互行为 */
    doRegisteredAction(action: string, ...params: any): void;

    /** 按下某个键时 */
    onkeyDown(e: KeyboardEvent): void;

    /** 放开某个键时 */
    onkeyUp(e: KeyboardEvent): void;

    /** 按住某个键时 */
    pressKey(keyCode: number): void;

    /** 根据按下键的code来执行一系列操作 */
    keyDown(keyCode: number): void;

    /** 根据放开键的code来执行一系列操作 */
    keyUp(keyCode: number, altKey?: boolean, fromReplay?: boolean): void;

    /** 点击（触摸）事件按下时 */
    ondown(loc: number[]): void;

    /** 当在触摸屏上滑动时 */
    onmove(loc: number[]): void;

    /** 当点击（触摸）事件放开时 */
    onup(loc: number[]): void;

    /** 具体点击屏幕上(x,y)点时，执行的操作 */
    onclick(
        x: number,
        y: number,
        px: number,
        py: number,
        stepPostfix?: any
    ): void;

    /** 滑动鼠标滚轮时的操作 */
    onmousewheel(direct: 1 | -1): void;

    /** 长按Ctrl键时 */
    keyDownCtrl(): void;

    /** 长按 */
    longClick(
        x: number,
        y: number,
        px: number,
        py: number,
        fromEvent?: boolean
    ): void;

    /** 点击自绘状态栏时 */
    onStatusBarClick(e?: MouseEvent): void;
}
