import type { RenderItem } from './item';

export const enum MouseType {
    /** 没有按键按下 */
    None = 0,
    /** 左键 */
    Left = 1 << 0,
    /** 中键，即按下滚轮 */
    Middle = 1 << 1,
    /** 右键 */
    Right = 1 << 2,
    /** 侧键后退 */
    Back = 1 << 3,
    /** 侧键前进 */
    Forward = 1 << 4
}

export const enum WheelType {
    None,
    /** 以像素为单位 */
    Pixel,
    /** 以行为单位，每行长度视浏览器设置而定，约为 1rem */
    Line,
    /** 以页为单位，一般为一个屏幕高度 */
    Page
}

export const enum ActionType {
    /** 点击事件，即按下与抬起都在该元素上时触发 */
    Click,
    /** 鼠标或手指按下事件 */
    Down,
    /** 鼠标或手指移动事件 */
    Move,
    /** 鼠标或手指抬起事件 */
    Up,
    /** 鼠标或手指移动入该元素时触发的事件 */
    Enter,
    /** 鼠标或手指移出该元素时触发的事件 */
    Leave,
    /** 鼠标在该元素上滚轮时触发的事件 */
    Wheel
}

export const enum EventProgress {
    /** 捕获阶段 */
    Capture,
    /** 冒泡阶段 */
    Bubble
}

export interface IActionEventBase {
    /** 当前事件是监听的哪个元素 */
    target: RenderItem;
    /** 是触摸操作还是鼠标操作 */
    touch: boolean;
    /**
     * 触发的按键种类，会出现在点击、按下、抬起三个事件中，而其他的如移动等该值只会是 {@link MouseType.None}，
     * 电脑端可以有左键、中键、右键等，手机只会触发左键，每一项的值参考 {@link MouseType}
     */
    type: MouseType;
    /**
     * 当前按下了哪些按键。该值是一个数字，可以通过位运算判断是否按下了某个按键。
     * 例如通过 `buttons & MouseType.Left` 来判断是否按下了左键。
     * 注意在鼠标抬起或鼠标点击事件中，并不会包含触发的那个按键
     */
    buttons: number;
    /** 触发时是否按下了 alt 键 */
    altKey: boolean;
    /** 触发时是否按下了 shift 键 */
    shiftKey: boolean;
    /** 触发时是否按下了 ctrl 键 */
    ctrlKey: boolean;
    /** 触发时是否按下了 Windows(Windows) / Command(Mac) 键 */
    metaKey: boolean;
}

export interface IActionEvent extends IActionEventBase {
    /** 这次操作的标识符，在按下、移动、抬起阶段中保持不变 */
    identifier: number;
    /** 相对于触发元素左上角的横坐标 */
    offsetX: number;
    /** 相对于触发元素左上角的纵坐标 */
    offsetY: number;
    /** 相对于整个画布左上角的横坐标 */
    absoluteX: number;
    /** 相对于整个画布左上角的纵坐标 */
    absoluteY: number;

    /**
     * 调用后将停止事件的继续传播。
     * 在捕获阶段，将会阻止捕获的进一步进行，在冒泡阶段，将会阻止冒泡的进一步进行。
     * 如果当前元素有很多监听器，该方法并不会阻止其他监听器的执行。
     */
    stopPropagation(): void;
}

export interface IWheelEvent extends IActionEvent {
    /** 滚轮事件的鼠标横向滚动量 */
    wheelX: number;
    /** 滚轮事件的鼠标纵向滚动量 */
    wheelY: number;
    /** 滚轮事件的鼠标垂直屏幕的滚动量 */
    wheelZ: number;
    /** 滚轮事件的滚轮类型，表示了对应值的单位 */
    wheelType: WheelType;
}

export interface ERenderItemActionEvent {
    /** 当这个元素被点击时的捕获阶段触发 */
    clickCapture: [ev: Readonly<IActionEvent>];
    /** 当这个元素被点击时的冒泡阶段触发 */
    click: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上按下的捕获阶段触发 */
    downCapture: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上按下的冒泡阶段触发 */
    down: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上移动的捕获阶段触发 */
    moveCapture: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上移动的冒泡阶段触发 */
    move: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上抬起的捕获阶段触发 */
    upCapture: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上抬起的冒泡阶段触发 */
    up: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指进入该元素时触发 */
    enter: [ev: Readonly<IActionEventBase>];
    /** 当鼠标或手指离开该元素时触发 */
    leave: [ev: Readonly<IActionEventBase>];
    /** 当鼠标滚轮时的捕获阶段触发 */
    wheelCapture: [ev: Readonly<IWheelEvent>];
    /** 当鼠标滚轮时的冒泡阶段触发 */
    wheel: [ev: Readonly<IWheelEvent>];
}

export interface ActionEventMap {
    [ActionType.Click]: IActionEvent;
    [ActionType.Down]: IActionEvent;
    [ActionType.Enter]: IActionEvent;
    [ActionType.Leave]: IActionEvent;
    [ActionType.Move]: IActionEvent;
    [ActionType.Up]: IActionEvent;
    [ActionType.Wheel]: IWheelEvent;
}

export const eventNameMap: Record<ActionType, keyof ERenderItemActionEvent> = {
    [ActionType.Click]: 'click',
    [ActionType.Down]: 'down',
    [ActionType.Move]: 'move',
    [ActionType.Up]: 'up',
    [ActionType.Enter]: 'enter',
    [ActionType.Leave]: 'leave',
    [ActionType.Wheel]: 'wheel'
};
