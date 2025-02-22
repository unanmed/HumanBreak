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
    const loading = Mota.require('var', 'loading');
    if (!loading.loaded) {
        loading.once('loaded', hook);
    } else {
        hook();
    }
}

export interface ITransitionedController {
    readonly ref: Ref<number>;
    readonly value: number;
    set(value: number): void;
}

class RenderTransition implements ITransitionedController {
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
        public readonly time: number,
        public readonly curve: TimingFn
    ) {
        this.ref = ref(value);
        transition.ticker.add(() => {
            this.ref.value = transition.value[this.key];
        });
    }

    set(value: number): void {
        this.transition
            .time(this.time)
            .mode(this.curve)
            .transition(this.key, value);
    }
}

const transitionMap = new Map<ComponentInternalInstance, Transition>();

export function transitioned(
    value: number,
    time: number,
    curve: TimingFn
): ITransitionedController | null {
    const instance = getCurrentInstance();
    if (!instance) return null;
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
    return new RenderTransition(value, tran, time, curve);
}
