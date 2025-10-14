import { getHeroStatusOf, getHeroStatusOn } from '../state/hero';
import { Range, ensureArray, has, manhattan } from '@user/data-utils';
import EventEmitter from 'eventemitter3';
import { hook } from '@user/data-base';
import {
    EnemyInfo,
    DamageInfo,
    DamageDelta,
    HaloData,
    CriticalDamageDelta,
    MapDamage,
    HaloFn,
    IEnemyCollection,
    IDamageEnemy,
    HaloType,
    IEnemyCollectionEvent
} from '@motajs/types';

export class EnemyCollection
    extends EventEmitter<IEnemyCollectionEvent>
    implements IEnemyCollection
{
    floorId: FloorIds;
    list: Map<number, DamageEnemy> = new Map();

    range: Range = new Range();
    /** 地图伤害 */
    mapDamage: Record<string, MapDamage> = {};
    haloList: HaloData[] = [];

    /** 楼层宽度 */
    width: number = 0;
    /** 楼层高度 */
    height: number = 0;

    constructor(floorId: FloorIds) {
        super();
        this.floorId = floorId;
        this.extract();
    }

    get(x: number, y: number) {
        const index = x + y * this.width;
        return this.list.get(index) ?? null;
    }

    /**
     * 解析本地图的怪物信息
     */
    extract() {
        this.list.clear();
        core.extractBlocks(this.floorId);
        const floor = core.status.maps[this.floorId];
        this.width = floor.width;
        this.height = floor.height;
        floor.blocks.forEach(v => {
            if (v.disable) return;
            if (v.event.cls !== 'enemy48' && v.event.cls !== 'enemys') return;
            const { x, y } = v;
            const index = x + y * this.width;
            const enemy = core.material.enemys[v.event.id as EnemyIds];
            this.list.set(
                index,
                new DamageEnemy(enemy, v.x, v.y, this.floorId, this)
            );
        });
        this.emit('extract');
        hook.emit('enemyExtract', this);
    }

    /**
     * 计算怪物真实属性
     */
    calRealAttribute() {
        this.haloList = [];
        this.list.forEach(v => {
            v.reset();
        });
        this.list.forEach(v => {
            v.preProvideHalo();
        });
        this.list.forEach(v => {
            v.calAttribute();
            v.provideHalo();
        });
        this.list.forEach(v => {
            v.getRealInfo();
        });
    }

    /**
     * 计算怪物伤害
     * @param noCache 是否不使用缓存
     */
    calDamage(noCache: boolean = false) {
        if (noCache) this.calRealAttribute();
        this.list.forEach(v => {
            v.calDamage(void 0);
        });
    }

    /**
     * 计算地图伤害
     */
    calMapDamage() {
        this.mapDamage = {};
        const hero = getHeroStatusOn(realStatus, this.floorId);
        this.list.forEach(v => {
            v.calMapDamage(this.mapDamage, hero);
        });
    }

    /**
     * 向怪物施加光环
     * @param type 光环的范围类型
     * @param data 光环范围信息
     * @param halo 光环效果函数
     * @param recursion 是否递归施加，只有在光环预平衡阶段会使用到
     */
    applyHalo<K extends keyof HaloType>(
        type: K,
        data: HaloType[K],
        enemy: DamageEnemy,
        halo: HaloFn | HaloFn[],
        recursion: boolean = false
    ) {
        const arr = ensureArray(halo);
        const enemys = this.range.type(type).scan(this.list.values(), data);
        if (!recursion) {
            arr.forEach(v => {
                enemys.forEach(e => {
                    e.injectHalo(v, enemy.info);
                });
            });
        } else {
            enemys.forEach(e => {
                arr.forEach(v => {
                    e.injectHalo(v, enemy.info);
                    e.preProvideHalo();
                });
            });
        }
    }

    /**
     * 预平衡光环
     */
    preBalanceHalo() {
        this.list.forEach(v => {
            v.preProvideHalo();
        });
    }
}

export class DamageEnemy implements IDamageEnemy {
    id: EnemyIds;
    x?: number;
    y?: number;
    floorId?: FloorIds;
    enemy: Enemy;
    col?: EnemyCollection;

    /**
     * 怪物属性。
     * 属性计算流程：预平衡光环(即计算加光环的光环怪的光环) -> 计算怪物在没有光环下的属性
     * -> provide inject 光环 -> 计算怪物的光环加成 -> 计算完毕
     */
    info!: EnemyInfo;

    /** 向其他怪提供过的光环 */
    providedHalo: Set<number> = new Set();

    /**
     * 伤害计算进度，0 -> 预平衡光环 -> 1 -> 计算没有光环的属性 -> 2 -> provide inject 光环
     * -> 3 -> 计算光环加成 -> 4 -> 计算完毕
     */
    progress: number = 0;

    constructor(
        enemy: Enemy,
        x?: number,
        y?: number,
        floorId?: FloorIds,
        col?: EnemyCollection
    ) {
        this.id = enemy.id;
        this.enemy = enemy;
        this.x = x;
        this.y = y;
        this.floorId = floorId;
        this.col = col;
        this.reset();
    }

    reset() {
        const enemy = this.enemy;
        this.info = {
            hp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            special: new Set(enemy.special),
            atkBuff_: 0,
            defBuff_: 0,
            hpBuff_: 0,
            guard: [],
            enemy: this.enemy,
            x: this.x,
            y: this.y,
            floorId: this.floorId
        };

        for (const [key, value] of Object.entries(enemy)) {
            if (!(key in this.info) && has(value)) {
                // @ts-expect-error 无法推导
                this.info[key] = value;
            }
        }
        this.progress = 0;
        this.providedHalo.clear();
    }

    /**
     * 计算怪物在不计光环下的属性，在inject光环之前，预平衡光环之后执行
     */
    calAttribute() {
        if (this.progress !== 1 && has(this.x) && has(this.floorId)) return;
        this.progress = 2;
        const special = this.info.special;
        const info = this.info;

        const { atk = 0, def = 0 } = getHeroStatusOn(realStatus);

        // 坚固
        if (special.has(3)) {
            info.def = Math.max(info.def, atk - 1);
        }

        // 模仿
        if (special.has(10)) {
            info.atk = atk;
            info.def = def;
        }
    }

    /**
     * 获取怪物的真实属性信息，在inject光环后执行
     */
    getRealInfo() {
        if (this.progress < 3 && has(this.x) && has(this.floorId)) {
            throw new Error(
                `Unexpected early real info calculating. Progress: ${this.progress}`
            );
        }
        if (this.progress === 4) return this.info;
        this.progress = 4;

        // 此时已经inject光环，因此直接计算真实属性
        const info = this.info;

        info.atk = Math.floor(info.atk * (info.atkBuff_ / 100 + 1));
        info.def = Math.floor(info.def * (info.defBuff_ / 100 + 1));
        info.hp = Math.floor(info.hp * (info.hpBuff_ / 100 + 1));

        return this.info;
    }

    /**
     * 光环预提供，用于平衡所有怪的光环属性，避免出现不同情况下光环效果不一致的现象
     */
    preProvideHalo() {
        if (this.progress !== 0) return;
        this.progress = 1;
        if (!this.floorId) return;
        if (!has(this.x) || !has(this.y)) return;

        // 这里可以做优先级更高的光环，比如加光环的光环怪等，写法与 provideHalo 类似

        // e 是被加成怪的属性，enemy 是施加光环的怪
    }

    /**
     * 向其他怪提供光环
     */
    provideHalo() {
        if (this.progress !== 2) return;
        this.progress = 3;
        if (!this.floorId) return;
        if (!has(this.x) || !has(this.y)) return;
        const col = this.col ?? core.status.maps[this.floorId].enemy;
        if (!col) return;
        const special = this.info.special;

        // e 是被加成怪的属性，enemy 是施加光环的怪

        // 普通光环
        if (special.has(25)) {
            // 光环效果，这里直接增加 e 的 buff 属性
            const halo = (e: EnemyInfo, enemy: EnemyInfo) => {
                if (enemy.haloAdd) {
                    e.hpBuff_ += enemy.hpBuff ?? 0;
                    e.atkBuff_ += enemy.atkBuff ?? 0;
                    e.defBuff_ += enemy.defBuff ?? 0;
                } else {
                    e.hpBuff_ = Math.max(e.hpBuff_, enemy.hpBuff ?? 0);
                    e.atkBuff_ = Math.max(e.atkBuff_, enemy.atkBuff ?? 0);
                    e.defBuff_ = Math.max(e.defBuff_, enemy.defBuff ?? 0);
                }
            };
            // 根据范围施加光环
            const range = this.info.haloRange ?? 1;
            if (this.info.haloSquare) {
                col.applyHalo(
                    'square',
                    { x: this.x, y: this.y, d: range * 2 + 1 },
                    this,
                    halo
                );
            } else {
                col.applyHalo(
                    'manhattan',
                    { x: this.x, y: this.y, d: range },
                    this,
                    halo
                );
            }
        }

        // 支援也是一类光环
        if (special.has(26)) {
            col.applyHalo(
                'square',
                { x: this.x, y: this.y, d: 3 },
                this,
                (e, enemy) => {
                    e.guard.push(enemy);
                }
            );
        }
    }

    /**
     * 接受其他怪的光环
     */
    injectHalo(halo: HaloFn, enemy: EnemyInfo) {
        halo(this.info, enemy);
    }

    /**
     * 计算怪物伤害
     */
    calDamage(hero: Partial<HeroStatus> = core.status.hero): DamageInfo {
        const enemy = this.getRealInfo();
        return this.calEnemyDamageOf(hero, enemy);
    }

    /**
     * 计算地图伤害
     * @param damage 存入的对象
     */
    calMapDamage(
        damage: Record<string, MapDamage> = {},
        _hero: Partial<HeroStatus> = getHeroStatusOn(realStatus)
    ) {
        if (!has(this.x) || !has(this.y) || !has(this.floorId)) return damage;
        const enemy = this.enemy;
        const floor = core.status.maps[this.floorId];
        const w = floor.width;
        const h = floor.height;
        const objs = core.getMapBlocksObj(this.floorId);

        // 领域
        if (this.info.special.has(15)) {
            const range = enemy.range ?? 1;
            const startX = Math.max(0, this.x - range);
            const startY = Math.max(0, this.y - range);
            const endX = Math.min(floor.width - 1, this.x + range);
            const endY = Math.min(floor.height - 1, this.y + range);
            const dam = Math.max(enemy.zone ?? 0, 0);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (
                        !enemy.zoneSquare &&
                        manhattan(x, y, this.x, this.y) > range
                    ) {
                        // 如果是十字范围而且曼哈顿距离大于范围，则跳过此格
                        continue;
                    }
                    const loc = `${x},${y}` as LocString;
                    if (objs[loc]?.event.noPass) continue;
                    this.setMapDamage(damage, loc, dam, '领域');
                }
            }
        }

        // 激光
        if (this.info.special.has(24)) {
            const dirs: Dir[] = ['left', 'down', 'up', 'right'];
            const dam = Math.max(enemy.laser ?? 0, 0);

            for (const dir of dirs) {
                let x = this.x;
                let y = this.y;
                const { x: dx, y: dy } = core.utils.scan[dir];
                while (x >= 0 && y >= 0 && x < w && y < h) {
                    x += dx;
                    y += dy;
                    const loc = `${x},${y}` as LocString;
                    if (objs[loc]?.event.noPass) continue;
                    this.setMapDamage(damage, loc, dam, '激光');
                }
            }
        }

        // 阻击
        if (this.info.special.has(18)) {
            const dirs: Dir[] = ['left', 'down', 'up', 'right'];
            for (const dir of dirs) {
                const { x: dx, y: dy } = core.utils.scan[dir];
                const x = this.x + dx;
                const y = this.y + dy;
                const loc = `${x},${y}` as LocString;
                if (objs[loc]?.event.noPass) continue;
                this.setMapDamage(damage, loc, this.info.repulse ?? 0, '阻击');
                damage[loc].repulse ??= [];
                damage[loc].repulse.push([this.x, this.y]);
            }
        }

        // 捕捉
        if (this.info.special.has(27)) {
            const dirs: Dir[] = ['left', 'down', 'up', 'right'];
            for (const dir of dirs) {
                const { x: dx, y: dy } = core.utils.scan[dir];
                const x = this.x + dx;
                const y = this.y + dy;
                const loc = `${x},${y}` as LocString;
                if (objs[loc]?.event.noPass) continue;
                damage[loc] ??= { damage: 0, type: new Set() };
                damage[loc].ambush ??= [];
                damage[loc].ambush.push([this.x, this.y]);
            }
        }

        // 夹击
        if (this.info.special.has(16)) {
            // 只计算右方和下方的怪物，这样就可以避免一个点被重复计算两次
            const dirs: Dir[] = ['down', 'right'];
            for (const dir of dirs) {
                const { x: dx, y: dy } = core.utils.scan[dir];
                const x = this.x + dx * 2;
                const y = this.y + dy * 2;
                const e = this.col?.get(x, y);
                if (!e) continue;
                const info = e.getRealInfo();
                if (!info.special.has(16)) continue;
                const cx = this.x + dx;
                const cy = this.y + dy;
                const loc = `${cx},${cy}` as LocString;
                if (objs[loc]?.event.noPass) continue;
                const half = getHeroStatusOn('hp') / 2;
                let bt = half;
                // 夹击不超伤害值
                if (core.flags.betweenAttackMax) {
                    const aDamage = this.calDamage().damage;
                    const bDamage = e.calDamage().damage;
                    bt = Math.min(aDamage, bDamage, half);
                }
                this.setMapDamage(damage, loc, bt, '夹击');
            }
        }

        return damage;
    }

    private setMapDamage(
        damage: Record<string, MapDamage>,
        loc: string,
        dam: number,
        type: string
    ) {
        damage[loc] ??= { damage: 0, type: new Set() };
        damage[loc].damage += dam;
        if (type) damage[loc].type.add(type);
    }

    private calEnemyDamageOf(
        hero: Partial<HeroStatus>,
        enemy: EnemyInfo
    ): DamageInfo {
        const status = getHeroStatusOf(hero, realStatus, this.floorId);
        const damage = calDamageWith(enemy, status) ?? Infinity;

        return { damage };
    }

    /**
     * 计算怪物临界，计算临界时，根据当前方向计算临界，但也会输出与当前最少伤害的伤害差值
     * @param num 要计算多少个临界
     * @param dir 从怪物位置指向勇士的方向
     * @param hero 勇士属性，最终结果将会与由此属性计算出的伤害相减计算减伤
     */
    calCritical(
        num: number = 1,
        hero: Partial<HeroStatus> = core.status.hero
    ): CriticalDamageDelta[] {
        const origin = this.calDamage(hero);
        const seckill = this.getSeckillAtk();
        return this.calCriticalWith(num, seckill, origin, hero);
    }

    /**
     * 二分计算怪物临界
     * @param num 计算的临界数量
     * @param min 当前怪物伤害最小值
     * @param seckill 秒杀怪物时的攻击
     * @param hero 勇士真实属性
     */
    private calCriticalWith(
        num: number,
        seckill: number,
        origin: DamageInfo,
        hero: Partial<HeroStatus>
    ): CriticalDamageDelta[] {
        if (!isFinite(seckill)) return [];

        const res: CriticalDamageDelta[] = [];
        const def = hero.def!;
        const precision =
            (seckill < Number.MAX_SAFE_INTEGER ? 1 : seckill / 1e15) * 2;
        const enemy = this.getRealInfo();

        let curr = hero.atk!;
        let start = curr;
        let end = seckill;
        let ori = origin.damage;

        const status = { atk: curr, def };

        const calDam = () => {
            status.atk = curr;
            return this.calEnemyDamageOf(status, enemy).damage;
        };

        let i = 0;
        while (res.length < num) {
            if (end - start <= precision) {
                // 到达二分所需精度，计算临界准确值
                let cal = false;
                for (const v of [(start + end) / 2, end]) {
                    curr = v;
                    const dam = calDam();
                    if (dam < ori) {
                        res.push({
                            damage: dam,
                            atkDelta: Math.ceil(v - hero.atk!),
                            delta: -(dam - origin.damage)
                        });

                        start = v;
                        end = seckill;
                        cal = true;
                        ori = dam;
                        break;
                    }
                }
                if (!cal) break;
            }
            curr = Math.floor((start + end) / 2);

            const damage = calDam();

            if (damage < ori) {
                end = curr;
            } else {
                start = curr;
            }
            if (i++ >= 10000) {
                // eslint-disable-next-line no-console
                console.warn(
                    `Unexpected endless loop in calculating critical.` +
                        `Enemy Id: ${this.id}. Loc: ${this.x},${this.y}. Floor: ${this.floorId}`
                );
                break;
            }
        }

        if (res.length === 0) {
            curr = hero.atk!;
            const dam = calDam();
            res.push({
                damage: dam,
                atkDelta: 0,
                delta: 0
            });
        }

        return res;
    }

    /**
     * 计算n防减伤
     * @param num 要加多少防御
     * @param dir 从怪物位置指向勇士的方向
     * @param hero 勇士属性，最终结果将会与由此属性计算出的伤害相减计算减伤
     */
    calDefDamage(
        num: number = 1,
        hero: Partial<HeroStatus> = core.status.hero
    ): DamageDelta {
        const damage = this.calDamage({
            def: (hero.def ?? core.status.hero.def) + num
        });
        const origin = this.calDamage(hero);
        const finite = isFinite(damage.damage);

        return {
            damage: damage.damage,
            info: damage,
            delta: -(finite ? damage.damage - origin.damage : Infinity)
        };
    }

    /**
     * 获取怪物秒杀时所需的攻击
     */
    getSeckillAtk(): number {
        const info = this.getRealInfo();

        // 坚固，不可能通过攻击秒杀
        if (info.special.has(3)) {
            return Infinity;
        }

        // 常规怪物秒杀攻击是怪物防御+怪物生命
        return info.def + info.hp;
    }
}

export interface DamageWithTurn {
    damage: number;
    turn: number;
}

/**
 * 计算伤害时会用到的勇士属性，攻击防御，其余的不会有buff加成，直接从core.status.hero取
 * 如果有属性不会被 buff 加成请在这里去除，有助于提高性能表现
 */
const realStatus: (keyof HeroStatus)[] = ['atk', 'def', 'mdef', 'hpmax'];

/** 当前是否正在计算支援怪的伤害 */
let inGuard = false;

/**
 * 计算伤害，返回值包含伤害与回合数
 * @param info 怪物信息
 * @param hero 勇士真实属性
 */
export function calDamageWithTurn(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): DamageWithTurn {
    const { hp } = core.status.hero;
    const { atk, def, mdef } = hero as HeroStatus;
    const { atk: monAtk, def: monDef, special } = info;
    let { hp: monHp } = info;

    // 无敌
    if (special.has(20) && core.itemCount('cross') < 1) {
        return { damage: Infinity, turn: 0 };
    }

    /** 怪物会对勇士造成的总伤害 */
    let damage = 0;

    /** 勇士每轮造成的伤害 */
    let heroPerDamage: number = 0;
    /** 怪物每轮造成的伤害 */
    let enemyPerDamage: number = 0;

    // 勇士每轮伤害为勇士攻击减去怪物防御
    heroPerDamage += atk - monDef;

    // 吸血
    if (special.has(11)) {
        const vampire = info.vampire ?? 0;
        const value = (vampire / 100) * hp;
        damage += value;
        // 如果吸血加到自身
        if (info.add) {
            monHp += value;
        }
    }

    // 魔攻
    if (special.has(2)) {
        enemyPerDamage = monAtk;
    } else {
        enemyPerDamage = monAtk - def;
    }

    // 连击
    if (special.has(4)) enemyPerDamage *= 2;
    if (special.has(5)) enemyPerDamage *= 3;
    if (special.has(6)) enemyPerDamage *= info.n!;

    if (enemyPerDamage < 0) enemyPerDamage = 0;

    let turn = Math.ceil(monHp / heroPerDamage);

    // 支援，当怪物被支援且不包含支援标记时执行，因为支援怪不能再被支援了
    if (info.guard.length > 0 && !inGuard) {
        inGuard = true;
        // 支援中魔防只会被计算一次，因此除了当前怪物，计算其他怪物伤害时魔防为 0
        const status = { ...hero, mdef: 0 };
        // 计算支援怪的伤害，同时把打支援怪花费的回合数加到当前怪物上，因为打支援怪的时候当前怪物也会打你
        // 因此回合数需要加上打支援怪的回合数
        for (const enemy of info.guard) {
            // 直接把 enemy 传过去，因此支援的 enemy 会吃到其原本所在位置的光环加成
            const extraInfo = calDamageWithTurn(enemy, status);
            turn += extraInfo.turn;
            damage += extraInfo.damage;
        }
        inGuard = false;
    }

    // 先攻
    if (special.has(1)) {
        damage += enemyPerDamage;
    }

    // 破甲
    if (special.has(7)) {
        const value = info.breakArmor ?? core.values.breakArmor;
        damage += (value / 100) * def;
    }

    // 反击
    if (special.has(8)) {
        const value = info.counterAttack ?? core.values.counterAttack;
        // 反击是每回合生效，因此加到 enemyPerDamage 上
        enemyPerDamage += (value / 100) * atk;
    }

    // 净化
    if (special.has(9)) {
        const value = info.purify ?? core.values.purify;
        damage += mdef * value;
    }

    damage += (turn - 1) * enemyPerDamage;

    // 魔防
    damage -= mdef;

    // 未开启负伤时，如果伤害为负，则设为 0
    if (!core.flags.enableNegativeDamage && damage < 0) {
        damage = 0;
    }

    // 固伤，无法被魔防减伤
    if (special.has(22)) {
        damage += info.damage ?? 0;
    }

    // 仇恨，无法被魔防减伤
    if (special.has(17)) {
        damage += core.getFlag('hatred', 0);
    }

    return { damage: Math.floor(damage), turn };
}

/**
 * 计算怪物伤害
 * @param info 怪物信息
 * @param hero 勇士信息
 */
export function calDamageWith(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): number {
    return calDamageWithTurn(info, hero).damage;
}

export function ensureFloorDamage(floorId: FloorIds) {
    const floor = core.status.maps[floorId];
    floor.enemy ??= new EnemyCollection(floorId);
}

export function getSingleEnemy(id: EnemyIds) {
    const e = core.material.enemys[id];
    const enemy = new DamageEnemy(e);
    enemy.calAttribute();
    enemy.getRealInfo();
    enemy.calDamage(core.status.hero);
    return enemy;
}

export function getEnemy(
    x: number,
    y: number,
    floorId: FloorIds = core.status.floorId
) {
    const enemy = core.status.maps[floorId].enemy.get(x, y);
    return enemy;
}

declare global {
    interface Floor {
        enemy: EnemyCollection;
    }
}
