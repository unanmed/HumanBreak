import { gameKey, Hotkey } from '@/core/main/custom/hotkey';
import { Animation, Ticker, Transition } from 'mutate-animate';
import { onMounted, onUnmounted } from 'vue';

const ticker = new Ticker();

/**
 * 在组件中每帧执行一次函数
 * @param fn 每帧执行的函数
 */
export function onTick(fn: (time: number) => void) {
    onMounted(() => {
        ticker.add(fn);
    });
    onUnmounted(() => {
        ticker.remove(fn);
    });
}

type AnimationUsing = [Animation];
type TransitionUsing = [Transition];

/**
 * 在组件中创建一个动画实例
 */
export function useAnimation(): AnimationUsing {
    const ani = new Animation();
    onUnmounted(() => {
        ani.ticker.destroy();
    });
    return [ani];
}

/**
 * 在组件中创建一个渐变实例
 */
export function useTransition(): TransitionUsing {
    const tran = new Transition();
    onUnmounted(() => {
        tran.ticker.destroy();
    });
    return [tran];
}

type KeyUsing = [Hotkey, symbol];

/**
 * 在组件中定义按键操作
 */
export function useKey(): KeyUsing {
    const sym = Symbol();
    gameKey.use(sym);
    onUnmounted(() => {
        gameKey.dispose();
    });
    return [gameKey, sym];
}
