///<reference path="../../../src/types/core.d.ts" />

/**
 * 滑动数组
 * @param {any[]} arr
 * @param {number} delta
 */
export function slide(arr, delta) {
    if (delta === 0) return arr;
    delta %= arr.length;
    if (delta > 0) {
        arr.unshift(...arr.splice(arr.length - delta, delta));
        return arr;
    }
    if (delta < 0) {
        arr.push(...arr.splice(0, -delta));
        return arr;
    }
}

export function backDir(dir) {
    return {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
    }[dir];
}

export function has(v) {
    return v !== null && v !== void 0;
}

export function maxGameScale(n = 0) {
    const index = core.domStyle.availableScale.indexOf(core.domStyle.scale);
    core.control.setDisplayScale(
        core.domStyle.availableScale.length - 1 - index - n
    );
    if (!core.isPlaying() && core.flags.enableHDCanvas) {
        core.domStyle.ratio = Math.max(
            window.devicePixelRatio || 1,
            core.domStyle.scale
        );
        core.resize();
    }
}

core.plugin.utils = {
    slide,
    backDir,
    has,
    maxGameScale
};
core.has = has;
