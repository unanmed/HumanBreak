import { logger } from '@motajs/common';
import { EventEmitter } from 'eventemitter3';
import { cloneDeep } from 'lodash-es';

/**
 * 获取勇士在某一点的属性
 * @param name 要获取的勇士属性
 * @param floorId 勇士所在楼层
 */
export function getHeroStatusOn(name: 'all', floorId?: FloorIds): HeroStatus;
export function getHeroStatusOn(
    name: (keyof HeroStatus)[],
    floorId?: FloorIds
): Partial<HeroStatus>;
export function getHeroStatusOn<K extends keyof HeroStatus>(
    name: K,
    floorId?: FloorIds
): HeroStatus[K];
export function getHeroStatusOn(
    name: keyof HeroStatus | 'all' | (keyof HeroStatus)[],
    floorId?: FloorIds
) {
    // @ts-expect-error 暂时无法推导
    return getHeroStatusOf(core.status.hero, name, floorId);
}

/**
 * 获取一定状态下的勇士在某一点的属性
 * @param status 勇士的状态
 * @param name 要获取的勇士属性
 * @param floorId 勇士所在楼层
 */
export function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: 'all',
    floorId?: FloorIds
): HeroStatus;
export function getHeroStatusOf(
    status: Partial<HeroStatus>,
    name: (keyof HeroStatus)[],
    floorId?: FloorIds
): Partial<HeroStatus>;
export function getHeroStatusOf<K extends keyof HeroStatus>(
    status: Partial<HeroStatus>,
    name: K,
    floorId?: FloorIds
): HeroStatus[K];
export function getHeroStatusOf(
    status: DeepPartial<HeroStatus>,
    name: keyof HeroStatus | 'all' | (keyof HeroStatus)[],
    floorId?: FloorIds
) {
    return getRealStatus(status, name, floorId);
}

function getRealStatus(
    status: DeepPartial<HeroStatus>,
    name: keyof HeroStatus | 'all' | (keyof HeroStatus)[],
    floorId: FloorIds = core.status.floorId
): any {
    if (name instanceof Array) {
        const res: any = {};
        name.forEach(v => {
            res[v] = getRealStatus(status, v, floorId);
        });
        return res;
    }

    if (name === 'all') {
        const res: any = {};
        for (const [key, value] of Object.entries(core.status.hero)) {
            if (typeof value === 'number') {
                res[key] = getRealStatus(
                    status,
                    key as keyof HeroStatus,
                    floorId
                );
            } else {
                res[key] = value;
            }
        }

        return res;
    }

    let s = (status[name] ?? core.status.hero[name]) as number;
    if (s === null || s === void 0) {
        throw new ReferenceError(
            `Wrong hero status property name is delivered: ${name}`
        );
    }

    if (typeof s !== 'number') return s;

    // buff
    s *= core.status.hero.buff[name] ?? 1;
    s = Math.floor(s);

    // 衰弱效果
    if ((name === 'atk' || name === 'def') && flags.weak) {
        const weak = core.values.weakValue;
        if (weak < 1) {
            // 百分比衰弱
            s *= 1 - weak;
        } else {
            s -= weak;
        }
    }

    return s;
}

// 下面的内容暂时无用

export interface IHeroStatusDefault {
    atk: number;
    def: number;
    hp: number;
}

interface HeroStateEvent {
    set: [key: string | number | symbol, value: any];
}

type HeroStatusCalculate = (
    hero: HeroState<any>,
    key: string | number | symbol,
    value: any
) => any;

export class HeroState<
    T extends object = IHeroStatusDefault
> extends EventEmitter<HeroStateEvent> {
    readonly status: T;
    readonly computedStatus: T;

    readonly buffable: Set<keyof T> = new Set();
    readonly buffMap: Map<keyof T, number> = new Map();

    private static cal: HeroStatusCalculate = (_0, _1, value) => value;

    constructor(init: T) {
        super();
        this.status = init;
        this.computedStatus = cloneDeep(init);
    }

    /**
     * 设置某个属性的值
     * @param key 要设置的属性
     * @param value 属性值
     * @returns 是否设置成功
     */
    setStatus<K extends keyof T>(key: K, value: T[K]): boolean {
        this.status[key] = value;
        this.emit('set', key, value);
        return this.refreshStatus(key);
    }

    /**
     * 增加或减少一个属性的值，只对数字型的属性有效
     * @param key 要修改的属性
     * @param value 属性的增量
     * @returns 是否设置成功
     */
    addStatus<K extends SelectKey<T, number>>(key: K, value: number): boolean {
        if (typeof this.status[key] !== 'number') {
            logger.warn(14, String(key));
            return false;
        }
        return this.setStatus<K>(key, (this.status[key] + value) as T[K]);
    }

    /**
     * 获取某个属性的原始值
     * @param key 要获取的属性
     * @returns 属性的值
     */
    getStatus<K extends keyof T>(key: K): T[K] {
        return this.status[key];
    }

    /**
     * 获取一个属性计算后的值，也就是2.x所说的勇士真实属性
     * @param key 要获取的属性值
     */
    getComputedStatus<K extends keyof T>(key: K): T[K] {
        return this.computedStatus[key];
    }

    /**
     * 标记某个属性为可以被buff加成
     */
    markBuffable(key: SelectKey<T, number>): void {
        if (typeof this.status[key] !== 'number') {
            logger.warn(12, String(key));
            return;
        }
        this.buffable.add(key);
        this.buffMap.set(key, 1);
    }

    /**
     * 设置某个属性的buff值
     * @param key 要设置buff的属性
     * @param value buff值
     * @returns 是否设置成功
     */
    setBuff(key: SelectKey<T, number>, value: number): boolean {
        if (!this.buffable.has(key) || typeof this.status[key] !== 'number') {
            logger.warn(13, String(key));
            return false;
        }
        this.buffMap.set(key, value);
        return this.refreshStatus(key);
    }

    /**
     * 增加或减少一个buff值
     * @param key 要修改的buff属性
     * @param value buff增量
     * @returns 是否修改成功
     */
    addBuff(key: SelectKey<T, number>, value: number): boolean {
        if (!this.buffable.has(key) || typeof this.status[key] !== 'number') {
            logger.warn(13, String(key));
            return false;
        }
        return this.setBuff(key, this.buffMap.get(key)! + value);
    }

    /**
     * 刷新某个或所有属性，重新进行计算
     * @param key 要刷新的属性名，不填表示刷新所有属性
     * @returns 是否计算成功
     */
    refreshStatus(key?: keyof T): boolean {
        if (key === void 0) {
            for (const [key, value] of Object.entries(this.status)) {
                // @ts-expect-error 暂时无法推导
                this.computedStatus[key] = HeroState.cal(this, key, value);
            }
            return true;
        }
        this.computedStatus[key] = HeroState.cal(this, key, this.status[key]);
        return true;
    }

    /**
     * 计算所有可以buff加成的属性
     * @returns 是否计算成功
     */
    refreshBuffable(): boolean {
        for (const key of this.buffable) {
            this.computedStatus[key] = HeroState.cal(
                this,
                key,
                this.status[key]
            );
        }
        return true;
    }

    /**
     * 复写属性计算函数，默认函数不进行计算，直接将原属性返回
     * @param fn 计算函数，传入两个参数，key表示属性名，value表示属性值，返回值表示计算结果
     */
    static overrideCalculate(fn: HeroStatusCalculate) {
        this.cal = fn;
    }
}

interface _IHeroItem {
    items: Map<AllIdsOf<'items'>, number>;

    /**
     * 设置勇士拥有的物品数量
     * @param item 物品id
     * @param value 物品数量
     * @returns 是否设置成功
     */
    setItem(item: AllIdsOf<'items'>, value: number): boolean;

    /**
     * 增加或减少勇士拥有的物品数量
     * @param item 物品id
     * @param value 物品数量增量
     * @returns 是否设置成功
     */
    addItem(item: AllIdsOf<'items'>, value: number): boolean;

    /**
     * 使用一个物品
     * @param item 物品id
     * @returns 是否使用成功
     */
    useItem(item: AllIdsOf<'items'>, x?: number, y?: number): boolean;

    /**
     * 获得一个物品
     * @param item 物品id
     * @param num 获得的数量
     */
    getItem(item: AllIdsOf<'items'>, num: number): void;
    /**
     * 获得一个物品
     * @param item 物品id
     * @param x 物品所在x坐标
     * @param y 物品所在y坐标
     * @param floorId 物品所在楼层
     * @param num 获得的数量
     */
    getItem(
        item: AllIdsOf<'items'>,
        x: number,
        y: number,
        floorId?: FloorIds,
        num?: number
    ): void;

    /**
     * 获取某个物品的数量
     * @param item 物品id
     */
    itemCount(item: AllIdsOf<'items'>): number;

    /**
     * 判断勇士是否拥有这个物品
     * @param item 物品id
     */
    hasItem(item: AllIdsOf<'items'>): boolean;
}
