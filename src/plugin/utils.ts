import { isNil } from 'lodash';

export default function init() {
    return { has, getDamageColor };
}

/**
 * 判定一个值是否不是undefined或null
 * @param value 要判断的值
 */
export function has<T>(value: T): value is NonNullable<T> {
    return !isNil(value);
}

/**
 * 根据伤害大小获取颜色
 * @param damage 伤害大小
 */
export function getDamageColor(damage: number): string {
    if (typeof damage !== 'number') return '#f00';
    if (damage === 0) return '#2f2';
    if (damage < 0) return '#7f7';
    if (damage < core.status.hero.hp / 3) return '#fff';
    if (damage < (core.status.hero.hp * 2) / 3) return '#ff4';
    if (damage < core.status.hero.hp) return '#f22';
    return '#f00';
}
