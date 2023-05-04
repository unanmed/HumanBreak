import { Range, RangeCollection } from './range';
import { ensureArray } from './utils';

interface HaloType {
    square: {
        x: number;
        y: number;
        d: number;
    };
}

type HaloFn<T extends EnemyIds = EnemyIds> = (enemy: Enemy<T>) => Enemy<T>;

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
     * @param recursion 是否递归施加，一般只有在光环预平衡阶段会使用到
     */
    applyHalo<K extends keyof HaloType>(
        type: K,
        data: HaloType[K],
        halo: HaloFn | HaloFn[],
        recursion: boolean = false
    ) {
        const arr = ensureArray(halo);
    }

    /**
     * 预平衡光环
     */
    preBalanceHalo() {}
}

export class DamageEnemy<T extends EnemyIds = EnemyIds> {
    id: T;
    x?: number;
    y?: number;
    floorId?: FloorIds;
    enemy: Enemy<T>;

    /** 计算特殊属性但不计算光环的属性 */
    noHaloInfo?: Enemy<T>;
    /** 既计算特殊属性又计算光环的属性 */
    realInfo?: Enemy<T>;
    /** 向其他怪提供过的光环 */
    providedHalo: number[] = [];

    constructor(enemy: Enemy<T>, x?: number, y?: number, floorId?: FloorIds) {
        this.id = enemy.id;
        this.enemy = enemy;
        this.x = x;
        this.y = y;
        this.floorId = floorId;
    }

    reset() {
        delete this.noHaloInfo;
        delete this.realInfo;
    }

    calAttribute() {}

    getHaloSpecials(): number[] {
        if (!this.floorId) return [];
        if (!core.has(this.x) || !core.has(this.y)) return [];
        const special = this.realInfo?.special ?? this.enemy.special;
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
        const speical = this.getHaloSpecials();

        const square7: HaloFn[] = [];

        if (speical.includes(21)) {
        }
    }

    /**
     * 接受其他怪的光环
     */
    injectHalo(halo: HaloFn<T>) {}

    calDamage() {}
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
