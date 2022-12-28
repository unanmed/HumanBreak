import { has } from '../utils';

/**
 * 获取怪物的特殊技能描述
 * @param enemy 怪物实例
 */
export function getSpecialHint(enemy: Enemy & DetailedEnemy) {
    const all = core
        .getSpecials()
        .filter(v => enemy.special.includes(v[0]))
        .sort((a, b) => a[0] - b[0]);

    const des = all.map(v => {
        const des = v[2];
        if (des instanceof Function) {
            return des(enemy);
        }
        return des;
    });
    const name = all.map(v => {
        const name = v[1];
        if (name instanceof Function) {
            return name(enemy);
        }
        return name;
    });

    return (
        <div>
            {all.map((v, i) => {
                return (
                    <div class="special">
                        <span style={{ color: core.arrayToRGBA(v[3]) }}>
                            &nbsp;&nbsp;&nbsp;&nbsp;{name[i]}：
                        </span>
                        <span innerHTML={des[i]}></span>
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
    enemy: Enemy & DetailedEnemy,
    addDef: number = 0,
    addAtk: number = 0
) {
    const ratio = core.status.thisMap.ratio;
    const res: [number, number][] = [];

    let origin: number | undefined;
    let last = 0;

    const max = 100 - Math.floor(addDef / ratio);

    for (let i = 0; i <= max; i++) {
        const dam = core.getDamageInfo(enemy, {
            def: core.status.hero.def + ratio * i + addDef,
            atk: core.status.hero.atk + addAtk
        });

        if (res.length === 0) {
            origin = dam?.damage;
            if (has(origin)) {
                res.push([addDef + i * ratio, origin]);
                last = origin;
            }
            continue;
        }
        if (!has(dam)) continue;
        if (dam.damage === origin) continue;
        if (dam.damage === res.at(-1)?.[1]) continue;
        last = dam.damage;
        res.push([ratio * i + addDef, dam.damage]);
    }

    if ((res.at(-1)?.[1] ?? 1) <= 0) {
        res.push([res.at(-1)![0] + 1, 0]);
    }

    return res;
}

/**
 * 获取怪物的临界信息
 * @param enemy 怪物实例
 */
export function getCriticalDamage(
    enemy: Enemy & DetailedEnemy,
    addAtk: number = 0,
    addDef: number = 0
): [number, number][] {
    const ratio = core.status.thisMap.ratio;
    const res: [number, number][] = [];

    let origin: number | undefined;
    let last = 0;

    const max = 100 - Math.floor(addAtk / ratio);

    for (let i = 0; i <= max; i++) {
        const dam = core.getDamageInfo(enemy, {
            atk: core.status.hero.atk + ratio * i + addAtk,
            def: core.status.hero.def + addDef
        });

        if (res.length === 0) {
            origin = dam?.damage;
            if (has(origin)) {
                res.push([addAtk + i * ratio, origin]);
                last = origin;
            }
            continue;
        }
        if (!has(dam)) continue;
        if (dam.damage === origin) continue;
        if (dam.damage === res.at(-1)?.[1]) continue;
        last = dam.damage;
        res.push([ratio * i + addAtk, dam.damage]);
    }

    if ((res.at(-1)?.[1] ?? 1) <= 0) {
        res.push([res.at(-1)![0] + 1, 0]);
    }

    return res;
}
