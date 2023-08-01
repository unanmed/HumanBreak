import { CurrentEnemy } from '../game/enemy/battle';
import { has } from '../utils';

export interface ToShowEnemy extends CurrentEnemy {
    critical: string;
    criticalDam: string;
    defDam: string;
    /** [名称, 描述, 颜色] */
    special: [string, string, string][];
    damageColor: string;
    showSpecial: [string, string, string][];
    damage: string;
}

interface BookDetailInfo {
    /** 怪物手册详细信息展示的怪物 */
    enemy?: ToShowEnemy;
    /** 怪物手册的怪物详细信息的初始位置 */
    pos?: number;
}

export const detailInfo: BookDetailInfo = {};

/**
 * 获取怪物的特殊技能描述
 * @param enemy 怪物实例
 */
export function getSpecialHint(enemy: ToShowEnemy) {
    return (
        <div>
            {enemy.showSpecial.map((v, i) => {
                return (
                    <div class="special">
                        <span style={{ color: v[2] }}>
                            &nbsp;&nbsp;&nbsp;&nbsp;{v[0]}：
                        </span>
                        <span innerHTML={v[1]}></span>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * 获得怪物的最近100个加防减伤
 * @param enemy 怪物实例
 */
export function getDefDamage(
    enemy: ToShowEnemy,
    addDef: number = 0,
    addAtk: number = 0
) {
    const ratio = core.status.thisMap.ratio;
    const res: [number, number][] = [];

    let origin: number | undefined;
    let last = 0;

    const max = 100 - Math.floor(addDef / ratio);

    for (let i = 0; i <= max; i++) {
        const dam = enemy.enemy.calEnemyDamage(
            {
                atk: core.status.hero.atk + addAtk,
                def: core.status.hero.def + addDef + i * ratio
            },
            'none'
        );

        if (res.length === 0) {
            origin = dam[0].damage;
            if (has(origin)) {
                res.push([addDef + i * ratio, origin]);
                last = origin;
            }
            continue;
        }
        if (!isFinite(dam[0].damage)) continue;
        if (dam[0].damage === res.at(-1)?.[1]) continue;
        last = dam[0].damage;
        res.push([ratio * i + addDef, dam[0].damage]);
    }

    return res;
}

/**
 * 获取怪物的临界信息
 * @param enemy 怪物实例
 */
export function getCriticalDamage(
    enemy: ToShowEnemy,
    addAtk: number = 0,
    addDef: number = 0
): [number, number][] {
    const ratio = core.status.thisMap.ratio;
    const res: [number, number][] = [];

    let origin: number | undefined;
    let last = 0;

    const max = 100 - Math.floor(addAtk / ratio);

    for (let i = 0; i <= max; i++) {
        const dam = enemy.enemy.calEnemyDamage(
            {
                atk: core.status.hero.atk + addAtk + i * ratio,
                def: core.status.hero.def + addDef
            },
            'none'
        );

        if (res.length === 0) {
            origin = dam[0].damage;
            if (has(origin)) {
                res.push([addAtk + i * ratio, origin]);
                last = origin;
            }
            continue;
        }
        if (!isFinite(dam[0].damage)) continue;
        if (dam[0].damage === res.at(-1)?.[1]) continue;
        last = dam[0].damage;
        res.push([ratio * i + addAtk, dam[0].damage]);
    }

    return res;
}
