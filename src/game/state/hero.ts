import { logger } from '@/core/common/logger';
import { EventEmitter } from 'eventemitter3';
import { cloneDeep, isNil } from 'lodash-es';
import { GameState, ISerializable } from './state';
import { ItemState } from './item';

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
    // @ts-ignore
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
    const { getSkillLevel } = Mota.Plugin.require('skillTree_g');
    if (name instanceof Array) {
        return Object.fromEntries(
            name.map(v => [v, getRealStatus(status, v, floorId)])
        );
    }

    if (name === 'all') {
        return Object.fromEntries(
            Object.keys(core.status.hero).map(v => [
                v,
                v !== 'all' &&
                    getRealStatus(status, v as keyof HeroStatus, floorId)
            ])
        );
    }

    let s = (status?.[name] ?? core.status.hero[name]) as number;
    if (s === null || s === void 0) {
        throw new ReferenceError(
            `Wrong hero status property name is delivered: ${name}`
        );
    }

    // 永夜、极昼
    if (name === 'atk' || name === 'def') {
        s += window.flags?.[`night_${floorId}`] ?? 0;
    }

    // 技能
    if (flags.bladeOn && flags.blade) {
        const level = getSkillLevel(2);
        if (name === 'atk') {
            s *= 1 + 0.1 * level;
        }
        if (name === 'def') {
            s *= 1 - 0.1 * level;
        }
    }
    if (flags.shield && flags.shieldOn) {
        const level = getSkillLevel(10);
        if (name === 'atk') {
            s *= 1 - 0.1 * level;
        }
        if (name === 'def') {
            s *= 1 + 0.1 * level;
        }
    }

    // buff
    if (typeof s === 'number')
        s *= core.getBuff(name as keyof NumbericHeroStatus);

    // 取整
    if (typeof s === 'number') s = Math.floor(s);
    return s;
}

export interface IHeroStatusDefault {
    atk: number;
    def: number;
    hp: number;
}

interface HeroStateEvent {
    set: [key: string | number | symbol, value: any];
}

type HeroStatusCalculate<T> = <K extends keyof T>(key: K, value: T[K]) => T[K];

export class HeroState<
    T extends object = IHeroStatusDefault
> extends EventEmitter<HeroStateEvent> {
    readonly status: T;
    readonly computedStatus: T;

    readonly buffable: Set<keyof T> = new Set();
    readonly buffMap: Map<keyof T, number> = new Map();

    private cal: HeroStatusCalculate<T> = (_, value) => value;

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
            logger.warn(
                14,
                `Cannot add status of non-number status. Key: ${String(key)}`
            );
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
            logger.warn(
                12,
                `Cannot mark buffable with a non-number status. Key: ${String(
                    key
                )}.`
            );
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
            logger.warn(
                13,
                `Cannot set buff non-number status. Key: ${String(key)}.`
            );
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
            logger.warn(
                13,
                `Cannot set buff non-number status. Key: ${String(key)}.`
            );
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
                // @ts-ignore
                this.computedStatus[key] = this.cal(key, value);
            }
            return true;
        }
        this.computedStatus[key] = this.cal(key, this.status[key]);
        return true;
    }

    /**
     * 计算所有可以buff加成的属性
     * @returns 是否计算成功
     */
    refreshBuffable(): boolean {
        for (const key of this.buffable) {
            this.computedStatus[key] = this.cal(key, this.status[key]);
        }
        return true;
    }

    /**
     * 复写属性计算函数，默认函数不进行计算，直接将原属性返回
     * @param fn 计算函数，传入两个参数，key表示属性名，value表示属性值，返回值表示计算结果
     */
    overrideCalculate(fn: HeroStatusCalculate<T>) {
        this.cal = fn;
    }
}

interface IHeroItem {
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

interface HeroEvent {
    beforeMove: [dir: Dir2];
    afterMove: [dir: Dir2];
    beforeMoveDirectly: [x: number, y: number];
    afterMoveDirectly: [x: number, y: number];
    stateChange: [state: HeroState<any>];
}

export class Hero<T extends object = IHeroStatusDefault>
    extends EventEmitter<HeroEvent>
    implements IHeroItem, ISerializable
{
    x: number;
    y: number;
    floorId: FloorIds;
    id: string;

    state: HeroState<T>;
    items: Map<AllIdsOf<'items'>, number> = new Map();

    constructor(
        id: string,
        x: number,
        y: number,
        floorId: FloorIds,
        state: HeroState<T>,
        gameState: GameState
    ) {
        super();
        this.id = id;
        this.x = x;
        this.y = y;
        this.floorId = floorId;
        this.state = state;

        const list = gameState.state.hero.list;
        if (list.has(id)) {
            logger.warn(11, `Repeated hero: ${id}.`);
        }
        list.set(id, this);
    }

    /**
     * 设置勇士状态，效果为直接将一个状态替换为另一个状态，不应当经常使用，仅应当在不得不使用的时候使用
     * @param state 要设置为的勇士状态
     */
    setState(state: HeroState<T>): void {
        this.state = state;
        this.emit('stateChange', state);
    }

    /**
     * 获取勇士状态
     */
    getState(): HeroState<T> {
        return this.state;
    }

    /**
     * 见 {@link HeroState.refreshStatus}
     */
    refreshState(key?: keyof T) {
        return this.state.refreshStatus(key);
    }

    setItem(item: AllIdsOf<'items'>, value: number): boolean {
        this.items.set(item, value < 0 ? 0 : value);
        return true;
    }

    addItem(item: AllIdsOf<'items'>, value: number): boolean {
        return this.setItem(item, (this.items.get(item) ?? 0) + value);
    }

    useItem(item: AllIdsOf<'items'>): boolean {
        const state = ItemState.item(item);
        return !!state?.use(this);
    }

    /**
     * 获得一个物品
     * @param item 物品id
     * @param num 获得的数量
     */
    getItem(item: AllIdsOf<'items'>, num: number): boolean;
    /**
     * 获得一个物品
     * @param item 物品id，填写坐标时无效
     * @param x 物品所在x坐标
     * @param y 物品所在y坐标
     * @param floorId 物品所在楼层
     * @param num 获得的数量
     */
    getItem(x: number, y: number, floorId?: FloorIds, num?: number): boolean;
    getItem(
        item: AllIdsOf<'items'> | number,
        y: number,
        floorId: FloorIds = this.floorId,
        num: number = 1
    ): boolean {
        if (!isNil(floorId) && typeof item === 'number') {
            // 如果指定了坐标
            const block = core.getBlock(item as number, y, floorId);
            const id = block.event.id as AllIdsOf<'items'>;
            const cls = core.material.items[id]?.cls;
            if (cls === void 0) {
                logger.warn(
                    15,
                    `Cannot get item of a non-item block on loc: ${item},${y},${floorId}`
                );
                return false;
            }
            return this.addItem(id, num!);
        }
        return this.addItem(item as AllIdsOf<'items'>, num!);
    }

    itemCount(item: AllIdsOf<'items'>): number {
        return this.items.get(item) ?? 0;
    }

    hasItem(item: AllIdsOf<'items'>): boolean {
        return this.itemCount(item) > 0;
    }

    toJSON(): string {
        return '';
    }
}
