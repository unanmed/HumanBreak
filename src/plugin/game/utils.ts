///<reference path="../../../src/types/core.d.ts" />

/**
 * 滑动数组
 * @param arr
 * @param delta
 */
export function slide<T>(arr: T[], delta: number): T[] {
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
    return arr;
}

export function backDir(dir: Dir): Dir {
    return {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left'
    }[dir] as Dir;
}

export function has<T>(v: T): v is NonNullable<T> {
    return v !== null && v !== void 0;
}

export function maxGameScale(n: number = 0) {
    const index = core.domStyle.availableScale.indexOf(core.domStyle.scale);
    core.control.setDisplayScale(
        core.domStyle.availableScale.length - 1 - index - n
    );
    if (!core.isPlaying() && core.flags.enableHDCanvas) {
        // @ts-ignore
        core.domStyle.ratio = Math.max(
            window.devicePixelRatio || 1,
            core.domStyle.scale
        );
        core.resize();
    }
}

export function ensureArray<T>(arr: T): T extends any[] ? T : T[] {
    // @ts-ignore
    return arr instanceof Array ? arr : [arr];
}

export function ofDir(x: number, y: number, dir: Dir2): LocArr {
    const { x: dx, y: dy } = core.utils.scan2[dir];
    return [x + dx, y + dy];
}

declare global {
    interface GamePluginUtils {
        ofDir: typeof ofDir;
    }
}

core.plugin.utils = {
    slide,
    backDir,
    has,
    maxGameScale,
    ofDir
};
core.has = has;
