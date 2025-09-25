import { Hotkey, gameKey } from '@motajs/system-action';
import { loading } from '@user/data-base';
import { TimingFn, Transition } from 'mutate-animate';
import {
    ComponentInternalInstance,
    getCurrentInstance,
    onMounted,
    onUnmounted,
    ref,
    Ref
} from 'vue';

export const enum Orientation {
    /** 横屏 */
    Landscape,
    /** 竖屏 */
    Portrait
}

export type OrientationHook = (
    orientation: Orientation,
    width: number,
    height: number
) => void;

let nowOrientation = Orientation.Landscape;
const orientationHooks = new Set<OrientationHook>();

function checkOrientation() {
    const before = nowOrientation;
    // 只要宽度大于高度，那么就视为横屏
    if (window.innerWidth >= window.innerHeight) {
        nowOrientation = Orientation.Landscape;
    } else {
        nowOrientation = Orientation.Portrait;
    }
    if (nowOrientation === before) return;

    orientationHooks.forEach(v => {
        v(nowOrientation, window.innerWidth, window.innerHeight);
    });
}
window.addEventListener('resize', checkOrientation);

/**
 * 当屏幕方向改变时执行函数
 * @param hook 当屏幕方向改变时执行的函数
 */
export function onOrientationChange(hook: OrientationHook) {
    onMounted(() => {
        orientationHooks.add(hook);
        hook(nowOrientation, window.innerWidth, window.innerHeight);
    });
    onUnmounted(() => {
        orientationHooks.delete(hook);
    });
}

/**
 * 当游戏加载完成时执行函数，如果调用此函数时游戏已经加载，那么会立刻调用传入的钩子函数
 * @param hook 当游戏加载完成时执行的函数
 */
export function onLoaded(hook: () => void) {
    if (!loading.loaded) {
        loading.once('loaded', hook);
    } else {
        hook();
    }
}

type KeyUsing = [Hotkey, symbol];

/**
 * 在组件中定义按键操作
 * @param noScope 是否不创建新作用域
 * @param scope 指定作用域，如果 `noScope` 为 `true`，则此项无效
 */
export function useKey(noScope: boolean = false, scope?: symbol): KeyUsing {
    if (noScope) {
        return [gameKey, gameKey.scope];
    } else {
        const sym = scope ?? Symbol();
        if (sym === gameKey.scope) {
            return [gameKey, gameKey.scope];
        } else {
            gameKey.use(sym);
            onUnmounted(() => {
                gameKey.dispose();
            });
            return [gameKey, sym];
        }
    }
}

export interface ITransitionedController<T> {
    readonly ref: Ref<T>;
    readonly value: T;

    /**
     * 执行动画，使当前值缓慢变化至目标值
     * @param value 目标值
     * @param time 动画时长
     */
    set(value: T, time?: number): void;

    /**
     * 设置动画的速率曲线
     * @param timing 速率曲线
     */
    mode(timing: TimingFn): void;

    /**
     * 设置动画的动画时长
     * @param time 动画时长
     */
    setTime(time: number): void;
}

class RenderTransition implements ITransitionedController<number> {
    private static key: number = 0;

    private readonly key: string = `$${RenderTransition.key++}`;

    public readonly ref: Ref<number>;

    set value(v: number) {
        this.transition.transition(this.key, v);
    }
    get value() {
        return this.transition.value[this.key];
    }

    constructor(
        value: number,
        public readonly transition: Transition,
        public time: number,
        public curve: TimingFn
    ) {
        this.ref = ref(value);
        transition.value[this.key] = value;
        transition.ticker.add(() => {
            this.ref.value = transition.value[this.key];
        });
    }

    set(value: number, time: number = this.time): void {
        this.transition.time(time).mode(this.curve).transition(this.key, value);
    }

    mode(timing: TimingFn): void {
        this.curve = timing;
    }

    setTime(time: number): void {
        this.time = time;
    }
}

type ColorRGBA = [number, number, number, number];

class RenderColorTransition implements ITransitionedController<string> {
    private static key: number = 0;

    private readonly keyR: string = `$colorR${RenderColorTransition.key++}`;
    private readonly keyG: string = `$colorG${RenderColorTransition.key++}`;
    private readonly keyB: string = `$colorB${RenderColorTransition.key++}`;
    private readonly keyA: string = `$colorA${RenderColorTransition.key++}`;

    public readonly ref: Ref<string>;

    set value(v: string) {
        this.set(v);
    }
    get value() {
        return this.encodeColor();
    }

    constructor(
        value: string,
        public readonly transition: Transition,
        public time: number,
        public curve: TimingFn
    ) {
        this.ref = ref(value);
        const [r, g, b, a] = this.decodeColor(value);
        transition.value[this.keyR] = r;
        transition.value[this.keyG] = g;
        transition.value[this.keyB] = b;
        transition.value[this.keyA] = a;
        transition.ticker.add(() => {
            this.ref.value = this.encodeColor();
        });
    }

    set(value: string, time: number = this.time): void {
        this.transitionColor(this.decodeColor(value), time);
    }

    mode(timing: TimingFn): void {
        this.curve = timing;
    }

    setTime(time: number): void {
        this.time = time;
    }

    private transitionColor([r, g, b, a]: ColorRGBA, time: number) {
        this.transition
            .mode(this.curve)
            .time(time)
            .transition(this.keyR, r)
            .transition(this.keyG, g)
            .transition(this.keyB, b)
            .transition(this.keyA, a);
    }

    private decodeColor(color: string): ColorRGBA {
        if (color.startsWith('#')) {
            return this.decodeHash(color);
        } else if (color.startsWith('rgba')) {
            return this.decodeRGBA(color);
        } else if (color.startsWith('rgb')) {
            return this.decodeRGB(color);
        }
        return [0, 0, 0, 1];
    }

    private decodeHash(color: string): ColorRGBA {
        switch (color.length) {
            case 4:
                return [
                    Number(`0x${color.slice(1, 2).repeat(2)}`),
                    Number(`0x${color.slice(2, 3).repeat(2)}`),
                    Number(`0x${color.slice(3, 4).repeat(2)}`),
                    1
                ];
            case 5:
                return [
                    Number(`0x${color.slice(1, 2).repeat(2)}`),
                    Number(`0x${color.slice(2, 3).repeat(2)}`),
                    Number(`0x${color.slice(3, 4).repeat(2)}`),
                    Number(`0x${color.slice(4, 5).repeat(2)}`)
                ];
            case 7:
                return [
                    Number(`0x${color.slice(1, 3)}`),
                    Number(`0x${color.slice(3, 5)}`),
                    Number(`0x${color.slice(5, 7)}`),
                    1
                ];
            case 9:
                return [
                    Number(`0x${color.slice(1, 3)}`),
                    Number(`0x${color.slice(3, 5)}`),
                    Number(`0x${color.slice(5, 7)}`),
                    Number(`0x${color.slice(7, 9)}`)
                ];
        }
        return [0, 0, 0, 0];
    }

    private decodeRGBA(color: string): ColorRGBA {
        const data = color.slice(color.indexOf('(') + 1, color.indexOf(')'));
        const [r, g, b, a] = data.split(',');
        return [Number(r), Number(g), Number(b), Number(a)];
    }

    private decodeRGB(color: string): ColorRGBA {
        const data = color.slice(color.indexOf('(') + 1, color.indexOf(')'));
        const [r, g, b] = data.split(',');
        return [Number(r), Number(g), Number(b), 1];
    }

    private encodeColor() {
        const r = this.transition.value[this.keyR];
        const g = this.transition.value[this.keyG];
        const b = this.transition.value[this.keyB];
        const a = this.transition.value[this.keyA];
        return `rgba(${r},${g},${b},${a})`;
    }
}

const transitionMap = new Map<ComponentInternalInstance, Transition>();

function checkTransition() {
    const instance = getCurrentInstance();
    if (!instance) return null;
    if (instance.isUnmounted) {
        const tran = transitionMap.get(instance);
        tran?.ticker.destroy();
        transitionMap.delete(instance);
        return null;
    }
    if (!transitionMap.has(instance)) {
        const tran = new Transition();
        transitionMap.set(instance, tran);
        onUnmounted(() => {
            transitionMap.delete(instance);
            tran.ticker.destroy();
        });
    }
    const tran = transitionMap.get(instance);
    if (!tran) return null;
    return tran;
}

/**
 * 创建一个渐变数值，当数值发生变化时会缓慢变化值目标值而非突变，只可以用于组件内，不可用于组件外
 * ```tsx
 * const value = transitioned(10, 300, linear()); // 创建渐变，初始值为 10，渐变时长 300ms，线性变化
 * value.set(100); // 渐变至 100
 *
 * // 直接在元素上使用
 * <text text={value.ref.value} />
 * ```
 * @param value 初始值
 * @param time 渐变时长
 * @param curve 渐变的速率曲线
 */
export function transitioned(
    value: number,
    time: number,
    curve: TimingFn
): ITransitionedController<number> | null {
    const tran = checkTransition();
    if (!tran) return null;
    return new RenderTransition(value, tran, time, curve);
}

/**
 * 创建一个渐变颜色，当颜色发生变化时会缓慢变化值目标值而非突变，自动判断颜色字符串类型，只可用于组件内，不可用于组件外
 * ```tsx
 * // 创建渐变，初始值为 '#fff'（白色），渐变时长 300ms，线性变化
 * const color = transitionedColor('#fff', 300, linear());
 * color.set('rgba(129, 30, 40, 0.7)'); // 渐变至这个颜色
 *
 * // 直接在元素上使用
 * <text text='文本' fillStyle={color.ref.value} />
 * ```
 * @param color 颜色的初始值
 * @param time 渐变时长
 * @param curve 渐变的速率曲线
 */
export function transitionedColor(
    color: string,
    time: number,
    curve: TimingFn
): ITransitionedController<string> | null {
    const tran = checkTransition();
    if (!tran) return null;
    return new RenderColorTransition(color, tran, time, curve);
}
