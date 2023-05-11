import { getHeroStatusOf, getHeroStatusOn } from './hero';
import { Range, RangeCollection } from './range';
import { backDir, ensureArray, has, ofDir } from './utils';

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
    together: number;
}

interface DamageInfo {
    damage: number;
}

type HaloFn = (info: EnemyInfo, enemy: Enemy) => void;

export const haloSpecials: number[] = [21, 25, 26, 27];

export class EnemyCollection implements RangeCollection<DamageEnemy> {
    floorId: FloorIds;
    list: DamageEnemy[] = [];

    range: Range<DamageEnemy> = new Range(this);

    constructor(floorId: FloorIds) {
        this.floorId = floorId;
    }

    extract() {
        core.extractBlocks(this.floorId);
        core.status.maps[this.floorId].blocks.forEach(v => {
            if (v.event.cls !== 'enemy48' && v.event.cls !== 'enemys') return;
            const enemy = core.material.enemys[v.event.id as EnemyIds];
            this.list.push(new DamageEnemy(enemy));
        });
    }

    calAttribute(noCache: boolean = false) {}

    calDamage(noCache: boolean = false) {}

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
}

export class DamageEnemy<T extends EnemyIds = EnemyIds> {
    id: T;
    x?: number;
    y?: number;
    floorId?: FloorIds;
    enemy: Enemy<T>;

    /**
     * 怪物属性。
     * 属性计算流程：预平衡光环(即计算加光环的光环怪的光环) -> 计算怪物在没有光环下的属性
     * -> provide inject 光环 -> 计算怪物的光环加成 -> 计算完毕
     */
    info!: EnemyInfo;
    /** 是否需要计算属性 */
    needCalculate: boolean = true;
    /** 怪物伤害 */
    damage?: DamageInfo;
    /** 是否需要计算伤害 */
    needCalDamage: boolean = true;

    /** 向其他怪提供过的光环 */
    providedHalo: number[] = [];

    constructor(enemy: Enemy<T>, x?: number, y?: number, floorId?: FloorIds) {
        this.id = enemy.id;
        this.enemy = enemy;
        this.x = x;
        this.y = y;
        this.floorId = floorId;
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
            together: 0
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

    getHaloSpecials(): number[] {
        if (!this.floorId) return [];
        if (!core.has(this.x) || !core.has(this.y)) return [];
        const special = this.info.special ?? this.enemy.special;
        const filter = special.filter(v => {
            return haloSpecials.includes(v) && !this.providedHalo.includes(v);
        });
        if (filter.length === 0) return [];
        const collection = core.status.maps[this.floorId].enemy;
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
        const collection = core.status.maps[this.floorId].enemy;
        const speical = this.getHaloSpecials();

        const square7: HaloFn[] = [];
        const square5: HaloFn[] = [];

        if (speical.includes(8)) {
            square5.push((e, enemy) => {
                if (e === this.info) e.together += enemy.together ?? 0;
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

        collection.applyHalo('square', { x: this.x, y: this.y, d: 7 }, square7);
        collection.applyHalo('square', { x: this.x, y: this.y, d: 5 }, square5);
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
    calDamage() {
        if (!this.needCalDamage) return this.damage!;
        const info = this.getRealInfo();
    }
}

/**
 * 计算伤害时会用到的勇士属性，攻击防御，其余的不会有buff加成，直接从core.status.hero取
 */
const realStatus: (keyof HeroStatus)[] = ['atk', 'def'];

/**
 * 获取需要计算怪物伤害的方向
 * @param x 怪物横坐标
 * @param y 怪物纵坐标
 * @param floorId 怪物所在楼层
 */
export function getNeedCalDir(
    x: number,
    y: number,
    floorId: FloorIds,
    hero: Partial<HeroStatus> = core.status.hero
): [Dir | 'none', Partial<HeroStatus>][] {
    // 第一章或序章，用不到这个函数
    if (flags.chapter < 2) {
        return [['none', getHeroStatusOf(hero, realStatus, x, y, floorId)]];
    }

    // 如果指定了勇士坐标
    if (has(hero.x) && has(hero.y)) {
        const { x, y, floorId } = hero;
        if (has(floorId)) {
            return [['none', getHeroStatusOf(hero, realStatus, x, y, floorId)]];
        } else {
            return [['none', getHeroStatusOf(hero, realStatus, x, y, floorId)]];
        }
    }

    const needMap: Dir[] = ['left', 'down', 'right', 'up'];
    const { width, height } = core.status.maps[floorId];
    const blocks = core.getMapBlocksObj(floorId);

    return needMap
        .filter(v => {
            const [tx, ty] = ofDir(x, y, v);
            if (tx < 0 || ty < 0 || tx >= width || ty >= height) return false;
            const index = `${tx},${ty}` as LocString;
            const block = blocks[index];
            if (block.event.noPass) return false;
            if (!core.canMoveHero(tx, ty, backDir(v), floorId)) return false;

            return true;
        })
        .map(v => {
            const [tx, ty] = ofDir(x, y, v);
            const status = getHeroStatusOf(hero, realStatus, tx, ty, floorId);
            return [v, status];
        });
}

declare global {
    interface PluginDeclaration {
        damage: {
            Enemy: typeof DamageEnemy;
            Collection: typeof EnemyCollection;
        };
    }

    interface Floor {
        enemy: EnemyCollection;
    }
}

core.plugin.damage = {
    Enemy: DamageEnemy,
    Collection: EnemyCollection
};
