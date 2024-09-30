import { getDamageColor } from '../utils';
import { ToShowEnemy } from './book';
import type { DamageEnemy, EnemyInfo } from '../../game/enemy/damage';
import { isMobile } from '../use';

export function getLocFromMouseLoc(x: number, y: number): LocArr {
    const mx = Math.round(x + core.bigmap.offsetX / 32);
    const my = Math.round(y + core.bigmap.offsetY / 32);
    return [mx, my];
}

export function getDetailedEnemy(
    enemy: DamageEnemy,
    floorId: FloorIds = core.status.floorId
): ToShowEnemy {
    const ratio = core.status.maps[floorId].ratio;

    const dam = enemy.calDamage().damage;
    const cri = enemy.calCritical(1)[0];
    const critical = core.formatBigNumber(cri?.atkDelta);
    const criticalDam = core.formatBigNumber(cri?.delta);
    const defDam = core.formatBigNumber(enemy.calDefDamage(ratio).delta);
    const damage = core.formatBigNumber(dam);

    const fromFunc = (
        func: string | ((enemy: EnemyInfo) => string),
        enemy: EnemyInfo
    ) => {
        return typeof func === 'string' ? func : func(enemy);
    };
    const special: [string, string, string][] = [...enemy.info.special]
        .filter(v => !enemy.info.specialHalo?.includes(v))
        .map(vv => {
            const s = Mota.require('var', 'enemySpecials')[vv];
            return [
                fromFunc(s.name, enemy.info),
                fromFunc(s.desc, enemy.info),
                s.color as string
            ];
        });
    const l = isMobile ? 1 : 2;
    const showSpecial =
        special.length > l
            ? special.slice(0, l).concat([['...', '', '#fff']])
            : special.slice();

    const damageColor = getDamageColor(dam) as string;

    const detail: ToShowEnemy = {
        enemy,
        onMapEnemy: [enemy],
        critical,
        criticalDam,
        defDam,
        damageColor,
        special,
        showSpecial,
        damage
    };
    return detail;
}
