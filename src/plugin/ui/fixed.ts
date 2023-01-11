import { cloneDeep, debounce } from 'lodash';
import { ref } from 'vue';
import { getDamageColor } from '../utils';

export const showFixed = ref(false);

let lastId: EnemyIds;

const show = debounce((ev: MouseEvent) => {
    if (!window.flags) return;
    if (!flags.mouseLoc) return;
    flags.clientLoc = [ev.clientX, ev.clientY];
    const [mx, my] = getLocFromMouseLoc(...flags.mouseLoc);
    const e = core.getBlockId(mx, my);
    if (e !== lastId) showFixed.value = false;
    if (!e || !core.getClsFromId(e)?.startsWith('enemy')) return;

    lastId = e as EnemyIds;
    const enemy = core.material.enemys[e as EnemyIds];
    const detail = getDetailedEnemy(enemy, mx, my);
    core.plugin.bookDetailEnemy = detail;
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

    return {
        showFixed
    };
}

export function getLocFromMouseLoc(x: number, y: number): LocArr {
    const mx = Math.round(x + core.bigmap.offsetX / 32);
    const my = Math.round(y + core.bigmap.offsetY / 32);
    return [mx, my];
}

export function getDetailedEnemy<I extends EnemyIds>(
    enemy: Enemy<I>,
    x: number,
    y: number,
    floorId: FloorIds = core.status.floorId
): DetailedEnemy<I> {
    const ratio = core.status.maps[floorId].ratio;
    const enemyInfo = Object.assign(
        {},
        enemy,
        core.getEnemyInfo(enemy, void 0, x, y, floorId),
        core.getDamageInfo(enemy, void 0, x, y, floorId) ?? {}
    );
    const critical = core.nextCriticals(enemy, 1, x, y, floorId);
    const defDamage = core.getDefDamage(enemy, ratio, x, y, floorId);
    const specialText = core.getSpecialText(enemyInfo);
    let toShowSpecial = cloneDeep(specialText);
    if (toShowSpecial.length > 2) {
        toShowSpecial = toShowSpecial.slice(0, 2).concat(['...']);
    }
    const specialColor = core.getSpecialColor(enemyInfo);
    let toShowColor = cloneDeep(specialColor);
    if (toShowColor.length > 2) {
        toShowColor = toShowColor.slice(0, 2).concat(['#fff']);
    }
    if (toShowSpecial.length === 0) {
        toShowSpecial = ['无属性'];
        toShowColor = ['#fff'];
    }
    const damageColor = getDamageColor(enemyInfo.damage);
    const detail: DetailedEnemy<I> = Object.assign(enemyInfo, {
        critical: critical[0]?.[0] ?? '???',
        criticalDamage: critical[0]?.[1] ?? '???',
        defDamage,
        specialColor,
        specialText,
        toShowColor,
        toShowSpecial,
        damageColor
    });
    return detail;
}
