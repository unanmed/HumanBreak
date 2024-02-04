import { loading } from '@/game/game';

const animation: ((time: number) => void)[] = [];

let animateTime = 0;

loading.once('coreInit', () => {
    core.registerAnimationFrame('animateController', true, time => {
        if (time - animateTime <= core.values.animateSpeed) return;
        for (const fn of animation) {
            fn(time);
        }
        animateTime = core.animateFrame.animateTime;
    });
});

/**
 * 添加一个动画
 * @param fn 要添加的函数
 */
export function addAnimate(fn: (time: number) => void) {
    animation.push(fn);
}

/**
 * 移除一个动画
 * @param fn 要移除的函数
 */
export function removeAnimate(fn: (time: number) => void) {
    const index = animation.findIndex(v => v === fn);
    if (index === -1) return;
    animation.splice(index, 1);
}
