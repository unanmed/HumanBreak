import { onMounted, onUnmounted } from 'vue';

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
