import { getHeroStatusOf, getHeroStatusOn } from './hero';
import { Range, RangeCollection } from './range';
import {
    backDir,
    checkV2,
    ensureArray,
    formatDamage,
    has,
    manhattan,
    ofDir
} from './utils';

interface HaloType {
    square: {
        x: number;
        y: number;
        d: number;
    };
}

interface EnemyInfo {
    atk: number;
    def: number;
    hp: number;
    special: number[];
    damageDecline: number;
    atkBuff: number;
    defBuff: number;
    hpBuff: number;
    enemy: Enemy;
}

interface DamageInfo {
    damage: number;
    /** 从勇士位置指向怪物的方向 */
    dir: Dir | 'none';
    x?: number;
    y?: number;
    /** 自动切换技能时使用的技能 */
    skill?: number;
}

interface MapDamage {
    damage: number;
    type: Set<string>;
    mockery?: LocArr[];
}

interface HaloData<T extends keyof HaloType = keyof HaloType> {
    type: T;
    data: HaloType[T];
    from: DamageEnemy;
}

type HaloFn = (info: EnemyInfo, enemy: Enemy) => void;

export const haloSpecials: number[] = [21, 25, 26, 27];

export class EnemyCollection implements RangeCollection<DamageEnemy> {
    floorId: FloorIds;
    list: DamageEnemy[] = [];

    range: Range<DamageEnemy> = new Range(this);
    mapDamage: Record<string, MapDamage> = {};
    haloList: HaloData[] = [];

    constructor(floorId: FloorIds) {
        this.floorId = floorId;
        this.extract();
    }

    /**
     * 解析本地图的怪物信息
     */
    extract() {
        core.extractBlocks(this.floorId);
        core.status.maps[this.floorId].blocks.forEach(v => {
            if (v.event.cls !== 'enemy48' && v.event.cls !== 'enemys') return;
            const enemy = core.material.enemys[v.event.id as EnemyIds];
            this.list.push(
                new DamageEnemy(enemy, v.x, v.y, this.floorId, this)
            );
        });
    }

    /**
     * 计算怪物真实属性
     * @param noCache 是否不使用缓存
     */
    calRealAttribute(noCache: boolean = false) {
        this.list.forEach(v => {
            if (noCache) v.reset();
            v.calRealAttribute();
        });
    }

    /**
     * 计算怪物伤害
     * @param noCache 是否不使用缓存
     */
    calDamage(noCache: boolean = false, onMap: boolean = false) {
        this.list.forEach(v => {
            if (noCache || v.needCalculate) {
                v.reset();
                v.calRealAttribute();
            }
            v.calDamage(void 0, onMap);
        });
    }

    /**
     * 计算地图伤害
     * @param noCache 是否不使用缓存
     */
    calMapDamage(noCache: boolean = false) {
        if (noCache) this.mapDamage = {};
        const hero = getHeroStatusOn(
            realStatus,
            core.status.hero.loc.x,
            core.status.hero.loc.y,
            this.floorId
        );
        this.list.forEach(v => {
            v.calMapDamage(this.mapDamage, hero);
        });
        console.log(this.mapDamage);
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
        halo: HaloFn | HaloFn[],
        recursion: boolean = false
    ) {
        const arr = ensureArray(halo);
        const enemy = this.range.scan(type, data);
        if (!recursion) {
            arr.forEach(v => {
                enemy.forEach(e => {
                    e.injectHalo(v);
                });
            });
        } else {
            enemy.forEach(e => {
                arr.forEach(v => {
                    e.injectHalo(v);
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

    render(onMap?: boolean): void;
    render(onMap: boolean, cal: boolean, noCache: boolean): void;
    render(
        onMap: boolean = false,
        cal: boolean = false,
        noCache: boolean = false
    ) {
        if (cal) {
            this.calDamage(noCache, true);
            this.calMapDamage(noCache);
        }

        // 怪物伤害
        this.list.forEach(v => {
            if (onMap && !checkV2(v.x, v.y)) return;

            if (!v.damage) {
                throw new Error(
                    `Unexpected null of enemy's damage. Loc: '${v.x},${v.y}'. Floor: ${v.floorId}`
                );
            }
            for (const dam of v.damage) {
                if (dam.dir === 'none') {
                    // 怪物本身所在位置
                    const { damage, color } = formatDamage(dam.damage);
                    core.status.damage.data.push({
                        text: damage,
                        px: 32 * v.x! + 1,
                        py: 32 * (v.y! + 1) - 1,
                        color: color
                    });
                }
            }
        });

        // 地图伤害
        const floor = core.status.maps[this.floorId];
        const width = floor.width;
        const height = floor.height;
        const objs = core.getMapBlocksObj(this.floorId);

        const startX =
            onMap && core.bigmap.v2
                ? Math.max(0, core.bigmap.posX - core.bigmap.extend)
                : 0;
        const endX =
            onMap && core.bigmap.v2
                ? Math.min(
                      width,
                      core.bigmap.posX + core._WIDTH_ + core.bigmap.extend + 1
                  )
                : width;
        const startY =
            onMap && core.bigmap.v2
                ? Math.max(0, core.bigmap.posY - core.bigmap.extend)
                : 0;
        const endY =
            onMap && core.bigmap.v2
                ? Math.min(
                      height,
                      core.bigmap.posY + core._HEIGHT_ + core.bigmap.extend + 1
                  )
                : height;

        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const id = `${x},${y}` as LocString;
                const dam = this.mapDamage[id];
                if (!dam || objs[id]?.event.noPass) continue;
                if (dam.damage === 0) continue;
                const damage = core.formatBigNumber(dam.damage, true);
                const color = dam.damage < 0 ? '#6eff6a' : '#fa3';
                core.status.damage.extraData.push({
                    text: damage,
                    px: 32 * x + 16,
                    py: 32 * (y + 1) - 14,
                    color,
                    alpha: 1
                });
            }
        }
    }
}

export class DamageEnemy<T extends EnemyIds = EnemyIds> {
    id: T;
    x?: number;
    y?: number;
    floorId?: FloorIds;
    enemy: Enemy<T>;
    col?: EnemyCollection;

    /**
     * 怪物属性。
     * 属性计算流程：预平衡光环(即计算加光环的光环怪的光环) -> 计算怪物在没有光环下的属性
     * -> provide inject 光环 -> 计算怪物的光环加成 -> 计算完毕
     */
    info!: EnemyInfo;
    /** 是否需要计算属性 */
    needCalculate: boolean = true;
    /** 怪物伤害 */
    damage?: DamageInfo[];
    /** 是否需要计算伤害 */
    needCalDamage: boolean = true;

    /** 向其他怪提供过的光环 */
    providedHalo: number[] = [];

    constructor(
        enemy: Enemy<T>,
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
            special: enemy.special.slice(),
            damageDecline: 0,
            atkBuff: 0,
            defBuff: 0,
            hpBuff: 0,
            enemy: this.enemy
        };
        this.needCalculate = true;
        this.needCalDamage = true;
    }

    /**
     * 计算怪物在不计光环下的属性，在inject光环之前，预平衡光环之后执行
     * @param hero 勇士属性
     * @param getReal 是否获取勇士真实属性，默认获取
     */
    calAttribute(
        hero: Partial<HeroStatus> = core.status.hero,
        getReal: boolean = true
    ) {
        if (!this.needCalculate) return;
        const special = this.info.special;
        const info = this.info;
        const enemy = this.enemy;
        const floorId = this.floorId ?? core.status.floorId;
        const { atk } = getReal
            ? getHeroStatusOf(hero, ['atk'], hero.x, hero.y, hero.floorId)
            : hero;

        if (!has(atk)) return;

        // 饥渴
        if (special.includes(7)) {
            info.atk += (atk * (enemy.hungry ?? 0)) / 100;
        }

        // 智慧之源
        if (flags.hard === 2 && special.includes(14)) {
            info.atk += flags[`inte_${floorId}`] ?? 0;
        }

        // 极昼永夜
        info.atk -= flags[`night_${floorId}`] ?? 0;
        info.def -= flags[`night_${floorId}`] ?? 0;

        // 坚固
        if (special.includes(3) && enemy.def < atk - 1) {
            info.def = atk - 1;
        }

        // 融化，融化不属于怪物光环，因此不能用provide和inject计算，需要在这里计算
        if (has(flags[`melt_${floorId}`]) && has(this.x) && has(this.y)) {
            for (const [loc, per] of Object.entries(flags[`melt_${floorId}`])) {
                const [mx, my] = loc.split(',').map(v => parseInt(v));
                if (Math.abs(mx - this.x) <= 1 && Math.abs(my - this.y) <= 1) {
                    info.atkBuff += per as number;
                    info.defBuff += per as number;
                }
            }
        }
    }

    /**
     * 获取怪物的真实属性信息，在inject光环后执行
     */
    getRealInfo() {
        if (!this.needCalculate) return this.info;

        // 此时已经inject光环，因此直接计算真实属性
        const info = this.info;
        info.atk *= info.atkBuff / 100 + 1;
        info.def *= info.defBuff / 100 + 1;
        info.hp *= info.hpBuff / 100 + 1;

        this.needCalculate = false;

        return this.info;
    }

    /**
     * 计算真实属性
     */
    calRealAttribute() {
        this.preProvideHalo();
        this.calAttribute();
        this.provideHalo();
        this.getRealInfo();
    }

    getHaloSpecials(): number[] {
        if (!this.floorId) return [];
        if (!core.has(this.x) || !core.has(this.y)) return [];
        const special = this.info.special ?? this.enemy.special;
        const filter = special.filter(v => {
            return haloSpecials.includes(v) && !this.providedHalo.includes(v);
        });
        if (filter.length === 0) return [];
        const collection = this.col ?? core.status.maps[this.floorId].enemy;
        if (!collection) {
            throw new Error(
                `Unexpected undefined of enemy collection in floor ${this.floorId}.`
            );
        }
        return filter;
    }

    /**
     * 光环预提供，用于平衡所有怪的光环属性，避免出现不同情况下光环效果不一致的现象
     */
    preProvideHalo() {}

    /**
     * 向其他怪提供光环
     */
    provideHalo() {
        if (!this.floorId) return;
        if (!core.has(this.x) || !core.has(this.y)) return;
        const col = this.col ?? core.status.maps[this.floorId].enemy;
        if (!col) return;
        const speical = this.getHaloSpecials();

        const square7: HaloFn[] = [];
        const square5: HaloFn[] = [];

        // 抱团
        if (speical.includes(8)) {
            square5.push((e, enemy) => {
                if (e.special.includes(8)) {
                    e.atkBuff += enemy.together ?? 0;
                    e.defBuff += enemy.together ?? 0;
                }
            });
            this.providedHalo.push(8);
        }

        // 冰封光环
        if (speical.includes(21)) {
            square7.push((e, enemy) => {
                e.damageDecline += enemy.iceDecline ?? 0;
            });
            this.providedHalo.push(21);
        }

        // 冰封之核
        if (speical.includes(26)) {
            square5.push((e, enemy) => {
                e.defBuff += enemy.iceCore ?? 0;
            });
            this.providedHalo.push(26);
        }

        // 火焰之核
        if (speical.includes(27)) {
            square5.push((e, enemy) => {
                e.atkBuff += enemy.fireCore ?? 0;
            });
            this.providedHalo.push(27);
        }

        col.applyHalo('square', { x: this.x, y: this.y, d: 7 }, square7);
        col.applyHalo('square', { x: this.x, y: this.y, d: 5 }, square5);
    }

    /**
     * 接受其他怪的光环
     */
    injectHalo(halo: HaloFn) {
        halo.call(this, this.info, this.enemy);
    }

    /**
     * 计算怪物伤害
     */
    calDamage(
        hero: Partial<HeroStatus> = core.status.hero,
        onMap: boolean = false
    ) {
        if (onMap && !checkV2(this.x, this.y)) return this.damage!;
        if (!this.needCalDamage) return this.damage!;
        const info = this.getRealInfo();
        const dirs = getNeedCalDir(this.x, this.y, this.floorId, hero);

        const damageCache: Record<string, number> = {};
        this.needCalDamage = false;

        return (this.damage = dirs.map(dir => {
            const status = getHeroStatusOf(hero, realStatus);
            let damage = calDamageWith(info, status) ?? Infinity;
            let skill = -1;

            // 自动切换技能
            if (flags.autoSkill) {
                for (let i = 0; i < skills.length; i++) {
                    const [unlock, condition] = skills[i];
                    if (!flags[unlock]) continue;
                    flags[condition] = true;
                    const status = getHeroStatusOf(hero, realStatus);
                    const id = `${status.atk},${status.def}`;
                    const d =
                        id in damageCache
                            ? damageCache[id]
                            : calDamageWith(info, status) ?? Infinity;
                    if (d < damage) {
                        damage = d;
                        skill = i;
                    }
                    flags[condition] = false;
                    damageCache[id] = d;
                }
            }

            let x: number | undefined;
            let y: number | undefined;
            if (has(this.x) && has(this.y)) {
                if (dir !== 'none') {
                    [x, y] = ofDir(this.x, this.y, dir);
                } else {
                    x = hero.x ?? this.x;
                    y = hero.y ?? this.y;
                }
            }

            return {
                damage,
                dir,
                skill,
                x,
                y
            };
        }));
    }

    /**
     * 计算地图伤害
     * @param damage 存入的对象
     */
    calMapDamage(
        damage: Record<string, MapDamage> = {},
        hero: Partial<HeroStatus> = getHeroStatusOn(realStatus)
    ) {
        if (!has(this.x) || !has(this.y) || !has(this.floorId)) return damage;
        const enemy = this.enemy;
        const floor = core.status.maps[this.floorId];
        const w = floor.width;
        const h = floor.height;

        // 突刺
        if (this.info.special.includes(15)) {
            const range = enemy.range ?? 1;
            const startX = Math.max(0, this.x - range);
            const startY = Math.max(0, this.y - range);
            const endX = Math.min(floor.width - 1, this.x + range);
            const endY = Math.min(floor.height - 1, this.y + range);
            const dam = Math.max((enemy.value ?? 0) - hero.def!, 0);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    if (
                        !enemy.zoneSquare &&
                        manhattan(x, y, this.x, this.y) > range
                    ) {
                        continue;
                    }
                    const loc = `${x},${y}`;
                    this.setMapDamage(damage, loc, dam, '突刺');
                }
            }
        }

        // 射击
        if (this.info.special.includes(24)) {
            const dirs: Dir[] = ['left', 'down', 'up', 'right'];
            const dam = Math.max((enemy.atk ?? 0) - hero.def!, 0);
            const objs = core.getMapBlocksObj(this.floorId);

            for (const dir of dirs) {
                let x = this.x;
                let y = this.y;
                const { x: dx, y: dy } = core.utils.scan[dir];
                while (1) {
                    if (x < 0 || y < 0 || x >= w || y >= h) break;
                    x += dx;
                    y += dy;
                    const loc = `${x},${y}` as LocString;
                    const block = objs[loc];
                    if (
                        block &&
                        block.event.noPass &&
                        block.event.cls !== 'enemys' &&
                        block.event.cls !== 'enemy48' &&
                        block.id !== 141 &&
                        block.id !== 151
                    ) {
                        break;
                    }
                    this.setMapDamage(damage, loc, dam, '射击');
                }
            }
        }

        // 电摇嘲讽
        if (this.info.special.includes(19)) {
            const objs = core.getMapBlocksObj(this.floorId);
            for (let nx = 0; nx < w; nx++) {
                const loc = `${nx},${this.y}` as LocString;
                const block = objs[loc];
                if (!block.event.noPass) {
                    damage[loc] ??= { damage: 0, type: new Set() };
                    damage[loc].mockery ??= [];
                    damage[loc].mockery!.push([this.x, this.y]);
                }
            }
            for (let ny = 0; ny < h; ny++) {
                const loc = `${this.x},${ny}` as LocString;
                const block = objs[loc];
                if (!block.event.noPass) {
                    damage[loc] ??= { damage: 0, type: new Set() };
                    damage[loc].mockery ??= [];
                    damage[loc].mockery!.push([this.x, this.y]);
                }
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
        damage[loc].type.add(type);
    }
}

/**
 * 计算伤害时会用到的勇士属性，攻击防御，其余的不会有buff加成，直接从core.status.hero取
 */
const realStatus: (keyof HeroStatus)[] = ['atk', 'def'];
/**
 * 主动技能列表
 */
const skills: [unlock: string, condition: string][] = [
    ['bladeOn', 'blade'],
    ['shieldOn', 'shield']
];

/**
 * 获取需要计算怪物伤害的方向
 * @param x 怪物横坐标
 * @param y 怪物纵坐标
 * @param floorId 怪物所在楼层
 */
export function getNeedCalDir(
    x?: number,
    y?: number,
    floorId: FloorIds = core.status.floorId,
    hero: Partial<HeroStatus> = core.status.hero
): (Dir | 'none')[] {
    // 第一章或序章，或者没有指定怪物位置，或者没开自动定位，用不到这个函数
    if (flags.chapter < 2 || !has(x) || !has(y)) {
        return ['none'];
    }

    // 如果指定了勇士坐标
    if (has(hero.x) && has(hero.y)) {
        return ['none'];
    }

    const needMap: Dir[] = ['left', 'down', 'right', 'up'];
    const { width, height } = core.status.maps[floorId];
    const blocks = core.getMapBlocksObj(floorId);

    const res = needMap.filter(v => {
        const [tx, ty] = ofDir(x, y, v);
        if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false;
        const index = `${tx},${ty}` as LocString;
        const block = blocks[index];
        if (!block || block.event.noPass) return false;
        if (!core.canMoveHero(tx, ty, backDir(v), floorId)) return false;

        return true;
    });
    return res.length === 0 ? ['none'] : res;
}

/**
 * 计算怪物伤害
 * @param info 怪物信息
 * @param hero 勇士信息
 */
export function calDamageWith(
    info: EnemyInfo,
    hero: Partial<HeroStatus>
): number | null {
    const { hp, hpmax, mana, mdef } = core.status.hero;
    let { atk, def } = hero as HeroStatus;
    const { hp: monHp, atk: monAtk, def: monDef, special, enemy } = info;

    let damage = 0;

    // 饥渴
    if (special.includes(7)) {
        atk *= 1 - enemy.hungry! / 100;
    }

    let heroPerDamage: number;

    // 绝对防御
    if (special.includes(9)) {
        heroPerDamage = atk + mana - monDef;
        if (heroPerDamage <= 0) return null;
    } else {
        heroPerDamage = atk - monDef;
        if (heroPerDamage > 0) heroPerDamage += mana;
        else return null;
    }

    let enemyPerDamage: number;

    // 魔攻
    if (special.includes(2) || special.includes(13)) {
        enemyPerDamage = monAtk;
    } else {
        enemyPerDamage = monAtk - def;
        if (enemyPerDamage < 0) enemyPerDamage = 0;
    }

    // 连击
    if (special.includes(4)) enemyPerDamage *= 2;
    if (special.includes(5)) enemyPerDamage *= 3;
    if (special.includes(6)) enemyPerDamage *= enemy.n!;

    // 霜冻
    if (special.includes(20) && !core.hasEquip('I589')) {
        heroPerDamage *= 1 - enemy.ice! / 100;
    }
    heroPerDamage *= 1 - info.damageDecline;

    // 苍蓝刻
    if (special.includes(28)) {
        heroPerDamage *= 1 - enemy.paleShield! / 100;
    }

    let turn = Math.ceil(monHp / heroPerDamage);

    // 致命一击
    if (special.includes(1)) {
        const times = Math.floor(turn / 5);
        damage += ((times * (enemy.crit! - 100)) / 100) * enemyPerDamage;
    }

    // 勇气之刃
    if (turn > 1 && special.includes(10)) {
        damage += (enemy.courage! / 100 - 1) * enemyPerDamage;
    }

    // 勇气冲锋
    if (special.includes(11)) {
        damage += (enemy.charge! / 100) * enemyPerDamage;
        turn += 5;
    }

    damage += (turn - 1) * enemyPerDamage;
    // 无上之盾
    if (flags.superSheild) {
        damage -= mdef / 10;
    }
    // 生命回复
    damage -= hpmax * turn;
    if (flags.hard === 1) damage *= 0.9;

    return damage;
}

export function ensureFloorDamage(floorId: FloorIds) {
    const floor = core.status.maps[floorId];
    floor.enemy ??= new EnemyCollection(floorId);
}

declare global {
    interface PluginDeclaration {
        damage: {
            Enemy: typeof DamageEnemy;
            Collection: typeof EnemyCollection;
            ensureFloorDamage: typeof ensureFloorDamage;
        };
    }

    interface Floor {
        enemy: EnemyCollection;
    }
}

core.plugin.damage = {
    Enemy: DamageEnemy,
    Collection: EnemyCollection,
    ensureFloorDamage
};
