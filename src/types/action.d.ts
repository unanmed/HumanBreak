/**
 * 鼠标与触屏操作的函数
 */
type MotaMouseFunc = (x: number, y: number, px: number, py: number) => boolean;

/**
 * 按键操作的函数
 */
type MotaKeyboardFunc = (e: KeyboardEvent) => boolean;

/**
 * 没有最乱，只有更乱
 */
interface RegisteredActionMap {
    keyDown: (keyCode: number) => boolean;
    keyDownCtrl: () => boolean;
    keyUp: (keyCode: number, altKey: boolean, fromReplay: boolean) => boolean;
    longClick: MotaMouseFunc;
    onStatusBarClick: (px: number, py: number, vertical: boolean) => boolean;
    ondown: MotaMouseFunc;
    onkeyDown: MotaKeyboardFunc;
    onkeyUp: MotaKeyboardFunc;
    onmousewheel: (direct: 1 | -1) => boolean;
    onmove: MotaMouseFunc;
    onup: MotaMouseFunc;
    pressKey: (keyCode: number) => boolean;
}

type ActionKey = keyof RegisteredActionMap;

/**
 * 将注册的函数的返回值变成void就变成了actions上的函数...
 */
type VoidedActionFuncs = {
    [P in ActionKey]: (...params: Parameters<RegisteredActionMap[P]>) => void;
};

/**
 * 点击位置
 */
interface ClickLoc extends Loc {
    /**
     * 格子的大小（这不是32还能是其它的吗？？
     */
    size: 32;
}

interface RegisteredActionOf<K extends ActionKey> {
    /**
     * 交互的类型
     */
    action: K;

    /**
     * 交互的唯一标识符
     */
    name: string;

    /**
     * 优先级，越高越优先执行
     */
    priority: number;

    /**
     * 交互函数
     */
    func: RegisteredActionMap[K];
}

/**
 * 交互模块
 */
interface Actions extends VoidedActionFuncs {
    /**
     * 横向的最后一个格子的横坐标
     */
    readonly LAST: number;

    /**
     * 格子长度的一半
     */
    readonly _HX_: number;

    /**
     * 格子高度的一半
     */
    readonly _HY_: number;

    /**
     * 脚本编辑中的交互函数
     */
    readonly actionsdata: ActionData;

    /**
     * 所有已注册的交互操作
     */
    readonly actions: {
        [P in ActionKey]: RegisteredActionOf<P>[];
    };

    /**
     * 此函数将注册一个用户交互行为。
     * @param action 要注册的交互类型
     * @param name 自定义名称，可被注销使用
     * @param func 执行函数，如果func返回true，则不会再继续执行其他的交互函数
     * @param priority 优先级，优先级高的将会被执行。此项可不填，默认为0
     */
    registerAction<K extends ActionKey>(
        action: K,
        name: string,
        func: RegisteredActionMap[K],
        priority?: number
    ): void;

    /**
     * 注销一个用户交互行为
     * @param action 要注销的交互类型
     * @param name 要注销的自定义名称
     */
    unregisterAction(action: ActionKey, name: string): void;

    /**
     * 执行一个用户交互行为
     */
    doRegisteredAction<K extends ActionKey>(
        action: K,
        ...params: Parameters<RegisteredActionMap[K]>
    ): void;

    /**
     * 判断一个横坐标是否在(_HX_ - 2, _HX_ + 2)范围外
     * @param x 要判断的横坐标
     */
    _out(x: number): boolean;

    _getNextFlyFloor(delta: number, index: number): number;
}

declare const actions: new () => Actions;
