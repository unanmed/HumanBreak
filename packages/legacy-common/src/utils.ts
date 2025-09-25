import { EVENT_KEY_CODE_MAP } from '@motajs/client-base';

export function flipBinary(num: number, col: number) {
    const n = 1 << col;
    if (num & n) return num & ~n;
    else return num | n;
}

/**
 * 根据布尔值数组转换成一个二进制数
 * @param arr 要转换的布尔值数组
 */
export function generateBinary(arr: boolean[]) {
    let num = 0;
    arr.forEach((v, i) => {
        if (v) {
            num |= 1 << i;
        }
    });
    return num;
}

/**
 * 删除数组内的某个项，返回删除后的数组
 * @param arr 要操作的数组
 * @param ele 要删除的项
 */
export function deleteWith<T>(arr: T[], ele: T): T[] {
    const index = arr.indexOf(ele);
    if (index === -1) return arr;
    arr.splice(index, 1);
    return arr;
}

export function spliceBy<T>(arr: T[], from: T): T[] {
    const index = arr.indexOf(from);
    if (index === -1) return [];
    return arr.splice(index);
}

/**
 * 获取事件中的keycode对应的键
 * @param key 要获取的键
 */
export function keycode(key: number) {
    return EVENT_KEY_CODE_MAP[key];
}
