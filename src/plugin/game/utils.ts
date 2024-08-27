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

const backDirMap: Record<Dir2, Dir2> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
    leftup: 'rightdown',
    rightup: 'leftdown',
    leftdown: 'rightup',
    rightdown: 'leftup'
};

export function backDir(dir: Dir): Dir;
export function backDir(dir: Dir2): Dir2;
export function backDir(dir: Dir2): Dir2 {
    return backDirMap[dir];
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

/**
 * 计算曼哈顿距离
 */
export function manhattan(x1: number, y1: number, x2: number, y2: number) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * 检查一个点是否在当前超大地图 v2 优化范围内
 */
export function checkV2(x?: number, y?: number) {
    return (
        has(x) &&
        has(y) &&
        !(
            core.bigmap.v2 &&
            (x < core.bigmap.posX - core.bigmap.extend ||
                x > core.bigmap.posX + core._WIDTH_ + core.bigmap.extend ||
                y < core.bigmap.posY - core.bigmap.extend ||
                y > core.bigmap.posY + core._HEIGHT_ + core.bigmap.extend)
        )
    );
}

export function formatDamage(damage: number): DamageString {
    let dam = '';
    let color = '';
    if (!Number.isFinite(damage)) {
        dam = '???';
        color = '#f22';
    } else {
        dam = core.formatBigNumber(damage, true);
        if (damage <= 0) color = '#1f1';
        else if (damage < core.status.hero.hp / 3) color = '#fff';
        else if (damage < (core.status.hero.hp * 2) / 3) color = '#ff0';
        else if (damage < core.status.hero.hp) color = '#f93';
        else color = '#f22';
    }

    return { damage: dam, color: color as Color };
}

/**
 * 判断一个数组的数值是否全部相等
 * @param arr 要判断的数组
 */
export function equal(arr: number[]): boolean;
/**
 * 判断一个数组的元素的某个属性的数值是否全部相等
 * @param arr 要判断的数组
 * @param key 要判断的属性名
 */
export function equal<T>(arr: T[], key: keyof T): boolean;
export function equal(arr: any, key?: any) {
    if (has(key)) {
        for (let i = 1; i < arr.length; i++) {
            if (arr[i][key] !== arr[0][key]) return false;
        }
        return true;
    } else {
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[0]) return false;
        }
        return true;
    }
}

/**
 * 获得一个数组的数值的最大值和最小值
 * @param arr 要获得的数组
 */
export function boundary(arr: number[]): [number, number];
/**
 * 获得一个数组的元素的某个属性的数值的最大值和最小值
 * @param arr 要获得的数组
 * @param key 要获得的属性名
 */
export function boundary<T>(arr: T[], key: keyof T): [number, number];
export function boundary(arr: any, key?: any) {
    if (has(key)) {
        let min = arr[0][key];
        let max = arr[0][key];
        for (let i = 1; i < arr.length; i++) {
            const ele = arr[i][key];
            if (ele < min) min = ele;
            if (ele > max) max = ele;
        }
        return [min, max];
    } else {
        let min = arr[0];
        let max = arr[0];
        for (let i = 1; i < arr.length; i++) {
            const ele = arr[i];
            if (ele < min) min = ele;
            if (ele > max) max = ele;
        }
        return [min, max];
    }
}

/**
 * 获取两个坐标的相对方向
 * @param from 初始坐标
 * @param to 指向坐标
 */
export function findDir(from: Loc, to: Loc): Dir2 | 'none' {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return (
        (Object.entries(core.utils.scan2).find(v => {
            v[1].x === dx && v[1].y === dy;
        })?.[0] as Dir2) ?? 'none'
    );
}
