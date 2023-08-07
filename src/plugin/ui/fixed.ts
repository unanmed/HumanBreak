import { cloneDeep, debounce } from 'lodash-es';
import { ref } from 'vue';
import { getDamageColor } from '../utils';
import { ToShowEnemy, detailInfo } from './book';
import { DamageEnemy } from '../game/enemy/damage';
import { isMobile } from '../use';

export const showFixed = ref(false);

let lastId: EnemyIds;

const show = debounce((ev: MouseEvent) => {
    if (!window.flags) return;
    if (!flags.mouseLoc) return;
    flags.clientLoc = [ev.clientX, ev.clientY];
    const [mx, my] = getLocFromMouseLoc(...flags.mouseLoc);

    const e = core.status.thisMap.enemy.list.find(v => {
        return v.x === mx && v.y === my;
    });

    if (!e) return;

    lastId = e.id;
    const detail = getDetailedEnemy(e);
    detailInfo.enemy = detail;
    showFixed.value = true;
}, 200);

export default function init() {
    const data = core.canvas.data.canvas;
    data.addEventListener('mousemove', ev => {
        if (!core.isPlaying() || core.status.lockControl) return;
        const [mx, my] = getLocFromMouseLoc(...flags.mouseLoc);
        const e = core.getBlockId(mx, my);
        if (e !== lastId) showFixed.value = false;
        if (!e) return;
        show(ev);
    });
    data.addEventListener('mousedown', ev => {
        showFixed.value = false;
    });

    return {
        showFixed
    };
}

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
    const criticalDam = core.formatBigNumber(-cri?.delta);
    const defDam = core.formatBigNumber(-enemy.calDefDamage(ratio).delta);
    const damage = core.formatBigNumber(dam);

    const fromFunc = (
        func: string | ((enemy: Enemy) => string),
        enemy: Enemy
    ) => {
        return typeof func === 'string' ? func : func(enemy);
    };
    const special: [string, string, string][] = enemy.enemy.special.map(vv => {
        const s = core.plugin.special[vv];
        return [
            fromFunc(s.name, enemy.enemy),
            fromFunc(s.desc, enemy.enemy),
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
